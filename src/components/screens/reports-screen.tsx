"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { BarChart3, TrendingUp, ShoppingCart, Wallet, Trophy, AlertTriangle, Users, Truck, Calendar } from "lucide-react";
import { ResponsiveContainer, BarChart, Bar, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid, Legend } from "recharts";
import { AppHeader } from "@/components/mobile/app-header";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/states";
import { REPORT_RANGES } from "@/lib/constants";
import { formatTk, formatTkCompact, toBnDigits, toInputDate } from "@/lib/format";
import { useAppStore } from "@/store/use-app-store";

async function fetchReport(params: { range: string; from?: string; to?: string }) {
  const q = new URLSearchParams({ range: params.range });
  if (params.from) q.set("from", params.from);
  if (params.to) q.set("to", params.to);
  const r = await fetch(`/api/reports?${q}`);
  return r.json();
}

export function ReportsScreen() {
  const [range, setRange] = useState("today");
  const [from, setFrom] = useState(toInputDate());
  const [to, setTo] = useState(toInputDate());
  const { refreshTick } = useAppStore();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["report", range, from, to, refreshTick], queryFn: () => fetchReport({ range, from: range === "custom" ? from : undefined, to: range === "custom" ? to : undefined }) });

  const bnLabels = (data?.series || []).map((s: any) => ({ ...s, label: s.label }));

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="রিপোর্ট" subtitle="ব্যবসার বিস্তারিত বিশ্লেষণ" />
      <div className="px-3 pt-3 bg-white dark:bg-card border-b border-border">
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar pb-2.5">
          {REPORT_RANGES.map((r) => (
            <button key={r.key} onClick={() => setRange(r.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${range === r.key ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{r.label}</button>
          ))}
        </div>
        {range === "custom" && (
          <div className="flex gap-2 pb-2.5">
            <input type="date" value={from} onChange={(e) => setFrom(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
            <input type="date" value={to} onChange={(e) => setTo(e.target.value)} className="flex-1 px-2 py-1.5 rounded-lg border border-input bg-background text-xs" />
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-28">
        {isLoading ? <LoadingState /> : isError ? <ErrorState message="রিপোর্ট লোড করা যায়নি" onRetry={refetch} /> : !data ? null : (
          <div className="p-3 space-y-3">
            {/* Summary cards */}
            <div className="grid grid-cols-2 gap-2">
              <SumCard label="মোট বিক্রি" value={data.summary.totalSales} bg="var(--sale-bg)" color="#1B5E20" icon={TrendingUp} />
              <SumCard label="মোট কেনা" value={data.summary.totalPurchases} bg="var(--purchase-bg)" color="#1565C0" icon={ShoppingCart} />
              <SumCard label="মোট খরচ" value={data.summary.totalExpenses} bg="var(--expense-bg)" color="#E65100" icon={Wallet} />
              <SumCard label="নিট লাভ" value={data.summary.netProfit} bg="var(--profit-bg)" color="#6A1B9A" icon={Trophy} />
            </div>

            {/* Profit breakdown */}
            <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/50">
              <p className="text-xs font-bold mb-3">লাভ-ক্ষতি বিশ্লেষণ</p>
              <div className="space-y-2 text-sm">
                <Row label="মোট বিক্রি" value={formatTk(data.summary.totalSales)} />
                <Row label="পণ্যের ক্রয়মূল্য (COGS)" value={`− ${formatTk(data.summary.totalSales - data.summary.grossProfit)}`} muted />
                <Row label="স্থূপ লাভ (Gross Profit)" value={formatTk(data.summary.grossProfit)} bold />
                <Row label="পরিচালন খরচ" value={`− ${formatTk(data.summary.totalExpenses)}`} muted />
                <div className="border-t border-border pt-2 mt-2">
                  <Row label="নিট লাভ (Net Profit)" value={formatTk(data.summary.netProfit)} bold color={data.summary.netProfit >= 0 ? "#1B5E20" : "#C62828"} />
                </div>
              </div>
            </div>

            {/* Dues */}
            <div className="grid grid-cols-2 gap-2">
              <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
                <p className="text-[10px] text-muted-foreground">গ্রাহক পাওনা</p>
                <p className="text-base font-bold text-[#1B5E20]">{formatTk(data.summary.customerDue)}</p>
              </div>
              <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
                <p className="text-[10px] text-muted-foreground">সরবরাহকারী দেনা</p>
                <p className="text-base font-bold text-[#C62828]">{formatTk(data.summary.supplierDue)}</p>
              </div>
            </div>

            {/* Sales chart */}
            <ChartCard title="বিক্রি ও ক্রয় ট্রেন্ড">
              <ResponsiveContainer width="100%" height={200}>
                <BarChart data={bnLabels} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatTkCompact(v).replace("৳ ", "")} />
                  <Tooltip formatter={(v: any) => formatTk(v)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Legend wrapperStyle={{ fontSize: 11 }} />
                  <Bar dataKey="sales" name="বিক্রি" fill="#1B5E20" radius={[4, 4, 0, 0]} />
                  <Bar dataKey="purchase" name="ক্রয়" fill="#1976D2" radius={[4, 4, 0, 0]} />
                </BarChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Profit chart */}
            <ChartCard title="লাভের ধারা">
              <ResponsiveContainer width="100%" height={160}>
                <LineChart data={bnLabels} margin={{ top: 5, right: 5, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#eee" vertical={false} />
                  <XAxis dataKey="label" tick={{ fontSize: 10, fill: "#666" }} axisLine={false} tickLine={false} />
                  <YAxis tick={{ fontSize: 9, fill: "#666" }} axisLine={false} tickLine={false} tickFormatter={(v) => formatTkCompact(v).replace("৳ ", "")} />
                  <Tooltip formatter={(v: any) => formatTk(v)} contentStyle={{ fontSize: 11, borderRadius: 8 }} />
                  <Line type="monotone" dataKey="profit" name="লাভ" stroke="#8E24AA" strokeWidth={2.5} dot={{ r: 3 }} />
                </LineChart>
              </ResponsiveContainer>
            </ChartCard>

            {/* Best sellers */}
            <ListCard title="সর্বাধিক বিক্রিত পণ্য" icon={Trophy} iconColor="#F57C00" items={data.bestSellers.map((b: any) => ({ name: b.name, value: `${toBnDigits(b.qty)} ${"kg"} • ${formatTk(b.revenue)}` }))} empty="এই সময়ে কোনো বিক্রি নেই" />

            {/* Top customers */}
            <ListCard title="শীর্ষ গ্রাহক" icon={Users} iconColor="#1B5E20" items={data.topCustomers.map((c: any) => ({ name: c.name, value: `${formatTk(c.total)} • ${toBnDigits(c.count)} বিক্রি` }))} empty="কোনো গ্রাহক নেই" />

            {/* Top suppliers */}
            <ListCard title="শীর্ষ সরবরাহকারী" icon={Truck} iconColor="#1565C0" items={data.topSuppliers.map((s: any) => ({ name: s.name, value: `${formatTk(s.total)} • ${toBnDigits(s.count)} ক্রয়` }))} empty="কোনো সরবরাহকারী নেই" />

            {/* Low stock */}
            <ListCard title="কম স্টকের পণ্য" icon={AlertTriangle} iconColor="#E65100" items={data.lowStock.map((p: any) => ({ name: p.name, value: `${toBnDigits(p.stockQuantity)} ${p.unit} (ন্যূনতম ${toBnDigits(p.minimumStock)})` }))} empty="সব পণ্যের স্টক পর্যাপ্ত" />
          </div>
        )}
      </div>
    </div>
  );
}

function SumCard({ label, value, bg, color, icon: Icon }: any) {
  return (
    <div className="rounded-2xl p-3 border border-border/50" style={{ background: bg }}>
      <div className="flex items-center gap-2">
        <span className="w-8 h-8 rounded-lg bg-white/70 flex items-center justify-center"><Icon className="w-4 h-4" style={{ color }} /></span>
        <span className="text-[11px] text-muted-foreground">{label}</span>
      </div>
      <p className="text-base font-bold mt-2" style={{ color }}>{formatTk(value)}</p>
    </div>
  );
}

function Row({ label, value, muted, bold, color }: any) {
  return (
    <div className="flex justify-between">
      <span className={muted ? "text-muted-foreground" : "text-foreground"}>{label}</span>
      <span className={`${bold ? "font-bold" : ""}`} style={color ? { color } : {}}>{value}</span>
    </div>
  );
}

function ChartCard({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
      <p className="text-xs font-bold mb-2">{title}</p>
      {children}
    </div>
  );
}

function ListCard({ title, icon: Icon, iconColor, items, empty }: any) {
  return (
    <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
      <p className="text-xs font-bold mb-2 flex items-center gap-1.5"><Icon className="w-4 h-4" style={{ color: iconColor }} /> {title}</p>
      {items.length === 0 ? <p className="text-center text-xs text-muted-foreground py-3">{empty}</p> : (
        <div className="space-y-1">
          {items.map((it: any, i: number) => (
            <div key={i} className="flex items-center justify-between py-1.5 border-b border-border/40 last:border-0">
              <span className="text-xs text-foreground flex items-center gap-2 min-w-0">
                <span className="w-5 h-5 rounded-full bg-muted flex items-center justify-center text-[10px] font-bold text-muted-foreground shrink-0">{toBnDigits(i + 1)}</span>
                <span className="truncate">{it.name}</span>
              </span>
              <span className="text-[11px] text-muted-foreground shrink-0 ml-2">{it.value}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

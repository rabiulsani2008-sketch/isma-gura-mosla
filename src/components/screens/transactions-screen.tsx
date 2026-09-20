"use client";

import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { Search, Receipt, Filter } from "lucide-react";
import { AppHeader } from "@/components/mobile/app-header";
import { LoadingState, EmptyState, ErrorState } from "@/components/shared/states";
import { TRANSACTION_TABS } from "@/lib/constants";
import { formatTk, formatBnDateTime, toBnDigits } from "@/lib/format";
import { useAppStore } from "@/store/use-app-store";

async function fetchTx(params: { type: string; search: string }) {
  const q = new URLSearchParams();
  if (params.type && params.type !== "all") q.set("type", params.type);
  if (params.search) q.set("search", params.search);
  const r = await fetch(`/api/transactions?${q}`);
  return r.json();
}

export function TransactionsScreen() {
  const [tab, setTab] = useState("all");
  const [search, setSearch] = useState("");
  const { refreshTick } = useAppStore();
  const { data, isLoading, isError, refetch } = useQuery({ queryKey: ["transactions", tab, search, refreshTick], queryFn: () => fetchTx({ type: tab, search }) });

  const txTypeMeta: Record<string, { label: string; color: string; sign: number }> = {
    sale: { label: "বিক্রি", color: "#1B5E20", sign: 1 },
    purchase: { label: "কেনা", color: "#1565C0", sign: -1 },
    expense: { label: "খরচ", color: "#E65100", sign: -1 },
    customer_payment: { label: "পাওনা", color: "#43A047", sign: 1 },
    supplier_payment: { label: "দেনা", color: "#8E24AA", sign: -1 },
  };

  const total = (data?.transactions || []).reduce((s: number, t: any) => s + t.amount, 0);

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="লেনদেন" subtitle={`মোট ${toBnDigits(data?.transactions?.length || 0)} টি • ${formatTk(total)}`} />
      <div className="px-3 pt-3 bg-white dark:bg-card border-b border-border">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="বিবরণ খুঁজুন..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary" />
        </div>
        <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2.5">
          {TRANSACTION_TABS.map((t) => (
            <button key={t.key} onClick={() => setTab(t.key)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${tab === t.key ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"}`}>
              {t.label}
            </button>
          ))}
        </div>
      </div>
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-28">
        {isLoading ? <LoadingState /> : isError ? <ErrorState message="লোড করা যায়নি" onRetry={refetch} /> : (
          (data?.transactions?.length || 0) === 0 ? <EmptyState icon={Receipt} title="কোনো লেনদেন নেই" description="এই ফিল্টারে কোনো লেনদেন পাওয়া যায়নি" /> : (
            <div className="p-3 space-y-2">
              {data.transactions.map((t: any) => {
                const m = txTypeMeta[t.type] || { label: t.type, color: "#666", sign: 1 };
                const isCredit = m.sign > 0;
                return (
                  <div key={t.id} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 flex items-center gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center text-white text-[10px] font-bold shrink-0" style={{ background: m.color }}>
                      {m.label.slice(0, 2)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBnDateTime(t.createdAt)} • {m.label}{t.paymentMethod ? ` • ${t.paymentMethod}` : ""}</p>
                    </div>
                    <span className={`text-sm font-bold ${isCredit ? "text-[#1B5E20]" : "text-[#C62828]"}`}>
                      {isCredit ? "+" : "−"} {formatTk(t.amount)}
                    </span>
                  </div>
                );
              })}
            </div>
          )
        )}
      </div>
    </div>
  );
}

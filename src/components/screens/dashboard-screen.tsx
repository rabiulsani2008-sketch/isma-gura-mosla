"use client";

import { useQuery } from "@tanstack/react-query";
import { motion } from "framer-motion";
import {
  TrendingUp, ShoppingCart, PackagePlus, Wallet,
  ArrowDownToLine, ArrowUpFromLine, AlertTriangle,
  Package, Users, Truck, ChevronRight, Receipt,
} from "lucide-react";
import { MainHeader } from "@/components/mobile/app-header";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { LoadingState, ErrorState, EmptyState } from "@/components/shared/states";
import { formatTk, formatTkCompact, formatBnNumber, formatBnTime, toBnDigits } from "@/lib/format";
import { fetchWithRetry } from "@/lib/fetch-retry";
import { useSaleCart, usePurchaseCart } from "@/store/use-cart";

async function fetchDashboard() {
  const r = await fetchWithRetry("/api/dashboard");
  if (!r.ok) throw new Error("failed");
  return r.json();
}

export function DashboardScreen() {
  const { data, isLoading, isError, refetch } = useQuery({
    queryKey: ["dashboard"],
    queryFn: fetchDashboard,
    retry: 3,
    retryDelay: 1000,
  });
  const { openModal, setActiveTab, refreshTick } = useAppStore();
  const t = useT();
  const clearSaleCart = useSaleCart((s) => s.clear);
  const clearPurchaseCart = usePurchaseCart((s) => s.clear);

  // refetch when refreshTick changes
  useQuery({
    queryKey: ["dashboard-refresh", refreshTick],
    queryFn: async () => { await refetch(); return null; },
  });

  const openSale = () => { clearSaleCart(); openModal("sale"); };
  const openPurchase = () => { clearPurchaseCart(); openModal("purchase"); };

  if (isLoading) return (<><MainHeader /><LoadingState /></>);
  if (isError) return (<><MainHeader /><ErrorState message={t("errLoadFailed")} onRetry={refetch} /></>);

  const cards = [
    { label: t("todaySales"), value: data.today.sales, bg: "var(--sale-bg)", icon: TrendingUp, iconColor: "#1B5E20", tap: openSale },
    { label: t("todayPurchase"), value: data.today.purchases, bg: "var(--purchase-bg)", icon: ShoppingCart, iconColor: "#1565C0", tap: openPurchase },
    { label: t("todayExpense"), value: data.today.expenses, bg: "var(--expense-bg)", icon: Wallet, iconColor: "#E65100", tap: () => openModal("expense") },
    { label: t("todayProfit"), value: data.today.netProfit, bg: "var(--profit-bg)", icon: TrendingUp, iconColor: "#6A1B9A", tap: () => setActiveTab("reports") },
  ];

  const quickActions = [
    { label: t("sell"), icon: ShoppingCart, color: "#1B5E20", action: openSale },
    { label: t("buy"), icon: PackagePlus, color: "#1976D2", action: openPurchase },
    { label: t("addExpense"), icon: Wallet, color: "#F57C00", action: () => openModal("expense") },
    { label: t("receiveMoney"), icon: ArrowDownToLine, color: "#43A047", action: () => openModal("receive_payment") },
    { label: t("payMoney"), icon: ArrowUpFromLine, color: "#8E24AA", action: () => openModal("pay_payment") },
  ];

  const txTypeMap: Record<string, { label: string; color: string }> = {
    sale: { label: t("txSale"), color: "#1B5E20" },
    purchase: { label: t("txPurchase"), color: "#1565C0" },
    expense: { label: t("txExpense"), color: "#E65100" },
    customer_payment: { label: t("txReceive"), color: "#43A047" },
    supplier_payment: { label: t("txPay"), color: "#8E24AA" },
  };

  return (
    <div className="flex-1 flex flex-col">
      <MainHeader />
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-28">
        {/* Financial summary cards */}
        <div className="px-4 pt-4 grid grid-cols-2 gap-3">
          {cards.map((c, i) => (
            <motion.button
              key={c.label}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.05 }}
              onClick={c.tap}
              className="text-left rounded-2xl p-3.5 shadow-sm border border-border/50 active:scale-[0.97] transition"
              style={{ background: c.bg }}
            >
              <div className="flex items-center justify-between">
                <span
                  className="w-9 h-9 rounded-xl flex items-center justify-center"
                  style={{ background: "rgba(255,255,255,0.7)" }}
                >
                  <c.icon className="w-5 h-5" style={{ color: c.iconColor }} />
                </span>
              </div>
              <p className="text-[11px] text-muted-foreground mt-2.5">{c.label}</p>
              <p className="text-base font-bold text-foreground mt-0.5">{formatTk(c.value)}</p>
            </motion.button>
          ))}
        </div>

        {/* Quick actions */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-foreground">{t("quickActions")}</h2>
          </div>
          <div className="flex gap-2 overflow-x-auto no-scrollbar pb-1">
            {quickActions.map((a) => (
              <button
                key={a.label}
                onClick={a.action}
                className="flex flex-col items-center gap-1.5 min-w-[64px] active:scale-95 transition"
              >
                <span
                  className="w-12 h-12 rounded-2xl flex items-center justify-center text-white shadow-sm"
                  style={{ background: a.color }}
                >
                  <a.icon className="w-5 h-5" />
                </span>
                <span className="text-[10px] font-medium text-foreground text-center leading-tight">{a.label}</span>
              </button>
            ))}
          </div>
        </div>

        {/* Dues summary */}
        <div className="px-4 mt-5 grid grid-cols-2 gap-3">
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-left bg-white dark:bg-card rounded-2xl p-3.5 border border-border/50 shadow-sm active:scale-[0.97] transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center">
                <Users className="w-4 h-4 text-[#1B5E20]" />
              </span>
              <span className="text-[11px] text-muted-foreground">{t("totalReceivable")}</span>
            </div>
            <p className="text-base font-bold text-[#1B5E20] mt-2">{formatTk(data.dues.customerDue)}</p>
            <p className="text-[10px] text-muted-foreground">{t("customerDue")}</p>
          </button>
          <button
            onClick={() => setActiveTab("transactions")}
            className="text-left bg-white dark:bg-card rounded-2xl p-3.5 border border-border/50 shadow-sm active:scale-[0.97] transition"
          >
            <div className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-[#FFEBEE] flex items-center justify-center">
                <Truck className="w-4 h-4 text-[#C62828]" />
              </span>
              <span className="text-[11px] text-muted-foreground">{t("totalPayable")}</span>
            </div>
            <p className="text-base font-bold text-[#C62828] mt-2">{formatTk(data.dues.supplierDue)}</p>
            <p className="text-[10px] text-muted-foreground">{t("supplierDue")}</p>
          </button>
        </div>

        {/* Stock alert */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <AlertTriangle className="w-4 h-4 text-amber-500" />
              {t("lowStock")}
            </h2>
            <button onClick={() => setActiveTab("stock")} className="text-[11px] text-primary font-medium flex items-center">
              {t("viewAll")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {data.lowStockProducts.length === 0 ? (
              <div className="p-4 text-center text-xs text-muted-foreground">{t("inStock")} ✓</div>
            ) : (
              data.lowStockProducts.slice(0, 5).map((p: any, i: number) => (
                <div
                  key={p.id}
                  className={`flex items-center justify-between px-3.5 py-2.5 ${i > 0 ? "border-t border-border/50" : ""}`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <span className="w-9 h-9 rounded-full bg-amber-50 flex items-center justify-center text-base shrink-0">
                      {p.stockQuantity <= 0 ? "🚫" : "⚠️"}
                    </span>
                    <div className="min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{p.name}</p>
                      <p className="text-[10px] text-muted-foreground">সর্বনিম্ন: {toBnDigits(p.minimumStock)} {p.unit}</p>
                    </div>
                  </div>
                  <span className={`text-xs font-semibold ${p.stockQuantity <= 0 ? "text-red-600" : "text-amber-600"}`}>
                    {p.stockQuantity <= 0 ? "শেষ" : `${toBnDigits(p.stockQuantity)} ${p.unit} বাকি`}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent transactions */}
        <div className="px-4 mt-5">
          <div className="flex items-center justify-between mb-2.5">
            <h2 className="text-sm font-bold text-foreground flex items-center gap-1.5">
              <Receipt className="w-4 h-4 text-primary" />
              {t("recentTransactions")}
            </h2>
            <button onClick={() => setActiveTab("transactions")} className="text-[11px] text-primary font-medium flex items-center">
              {t("viewAll")} <ChevronRight className="w-3 h-3" />
            </button>
          </div>
          <div className="bg-white dark:bg-card rounded-2xl border border-border/50 shadow-sm overflow-hidden">
            {data.recentTransactions.length === 0 ? (
              <EmptyState icon={Receipt} title={t("noTransactions")} description={t("errNoData")} />
            ) : (
              data.recentTransactions.map((t: any, i: number) => {
                const meta = txTypeMap[t.type] || { label: t.type, color: "#666" };
                const isCredit = t.type === "sale" || t.type === "customer_payment";
                return (
                  <div
                    key={t.id}
                    className={`flex items-center gap-3 px-3.5 py-3 ${i > 0 ? "border-t border-border/50" : ""}`}
                  >
                    <span
                      className="w-9 h-9 rounded-full flex items-center justify-center text-white text-[10px] font-bold shrink-0"
                      style={{ background: meta.color }}
                    >
                      {meta.label.slice(0, 2)}
                    </span>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-medium text-foreground truncate">{t.description}</p>
                      <p className="text-[10px] text-muted-foreground">{formatBnTime(t.createdAt)} • {meta.label}</p>
                    </div>
                    <span className={`text-sm font-bold ${isCredit ? "text-[#1B5E20]" : "text-[#C62828]"}`}>
                      {isCredit ? "+" : "−"} {formatTkCompact(t.amount)}
                    </span>
                  </div>
                );
              })
            )}
          </div>
        </div>

        {/* Stock overview */}
        <div className="px-4 mt-5">
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <Package className="w-4 h-4 mx-auto text-primary" />
              <p className="text-base font-bold text-foreground mt-1">{toBnDigits(data.stock.totalProducts)}</p>
              <p className="text-[10px] text-muted-foreground">{t("totalProducts")}</p>
            </div>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <Wallet className="w-4 h-4 mx-auto text-amber-500" />
              <p className="text-[13px] font-bold text-foreground mt-1">{formatTkCompact(data.stock.stockValue)}</p>
              <p className="text-[10px] text-muted-foreground">{t("stockValue")}</p>
            </div>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <AlertTriangle className="w-4 h-4 mx-auto text-red-500" />
              <p className="text-base font-bold text-foreground mt-1">{toBnDigits(data.stock.lowStockCount)}</p>
              <p className="text-[10px] text-muted-foreground">{t("zeroStock")}</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

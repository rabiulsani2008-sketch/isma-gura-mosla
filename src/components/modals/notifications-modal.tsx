"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, PackageX, TrendingDown, Users, Truck } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { formatTk, toBnDigits } from "@/lib/format";

export function NotificationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { notifLowStock, notifCustomerDue, notifSupplierDue, notifDaily, setNotif } = useAppStore();
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch("/api/dashboard").then((r) => r.json()), enabled: open });

  const alerts: { icon: any; color: string; bg: string; title: string; desc: string }[] = [];
  if (notifLowStock && data?.lowStockProducts?.length) {
    for (const p of data.lowStockProducts.slice(0, 5)) {
      alerts.push({
        icon: p.stockQuantity <= 0 ? PackageX : AlertTriangle,
        color: p.stockQuantity <= 0 ? "#C62828" : "#F57C00",
        bg: p.stockQuantity <= 0 ? "#FFEBEE" : "#FFF3E0",
        title: `${p.name} — ${p.stockQuantity <= 0 ? t("zeroStock") : t("lowStock")}`,
        desc: p.stockQuantity <= 0
          ? (useAppStore.getState().language === "bn" ? "পণ্য ফুরিয়ে গেছে" : "Product out of stock")
          : `${toBnDigits(p.stockQuantity)} ${p.unit} ${t("left")}`,
      });
    }
  }
  if (notifCustomerDue && data?.dues?.customerDue > 0) {
    alerts.push({ icon: Users, color: "#1B5E20", bg: "#E8F5E9", title: t("customerDue"), desc: `${formatTk(data.dues.customerDue)}` });
  }
  if (notifSupplierDue && data?.dues?.supplierDue > 0) {
    alerts.push({ icon: Truck, color: "#C62828", bg: "#FFEBEE", title: t("supplierDue"), desc: `${formatTk(data.dues.supplierDue)}` });
  }
  if (alerts.length === 0 && data) {
    alerts.push({ icon: Bell, color: "#1B5E20", bg: "#E8F5E9", title: t("allGood"), desc: t("allGoodDesc") });
  }

  const settings = [
    { key: "notifLowStock" as const, label: t("notifLowStock"), icon: PackageX, color: "#F57C00" },
    { key: "notifCustomerDue" as const, label: t("notifCustomerDue"), icon: Users, color: "#1B5E20" },
    { key: "notifSupplierDue" as const, label: t("notifSupplierDue"), icon: Truck, color: "#C62828" },
    { key: "notifDaily" as const, label: t("notifDaily"), icon: TrendingDown, color: "#1565C0" },
  ];

  return (
    <ModalSheet open={open} onClose={onClose} title={t("notifications")} subtitle={t("notificationSettings")}>
      <div className="p-4 space-y-4">
        {/* Settings toggles */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden">
          <p className="px-4 pt-3 pb-1 text-[11px] font-bold text-muted-foreground">{t("notificationSettings")}</p>
          {settings.map((s, i) => {
            const val = useAppStore.getState()[s.key];
            return (
              <button
                key={s.key}
                onClick={() => setNotif(s.key, !val)}
                className={`w-full flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/50" : ""} active:bg-muted/50 transition`}
              >
                <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: s.color + "20" }}>
                  <s.icon className="w-4 h-4" style={{ color: s.color }} />
                </span>
                <span className="flex-1 text-left text-sm font-medium">{s.label}</span>
                <div className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${val ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${val ? "translate-x-5" : ""}`} />
                </div>
              </button>
            );
          })}
        </div>

        {/* Current alerts */}
        <div>
          <p className="text-xs font-bold text-muted-foreground mb-2">{t("notifications")}</p>
          {isLoading ? (
            <div className="flex justify-center py-8"><div className="w-6 h-6 border-2 border-primary border-t-transparent rounded-full animate-spin" /></div>
          ) : (
            <div className="space-y-2">
              {alerts.map((a, i) => {
                const Icon = a.icon;
                return (
                  <div key={i} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 flex items-start gap-3">
                    <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.bg }}>
                      <Icon className="w-5 h-5" style={{ color: a.color }} />
                    </span>
                    <div className="min-w-0 flex-1">
                      <p className="text-sm font-semibold text-foreground">{a.title}</p>
                      <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </ModalSheet>
  );
}

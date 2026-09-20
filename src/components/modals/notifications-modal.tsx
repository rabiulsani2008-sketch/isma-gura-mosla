"use client";

import { useQuery } from "@tanstack/react-query";
import { AlertTriangle, Bell, PackageX, TrendingDown } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { LoadingState } from "@/components/shared/states";
import { formatTk, toBnDigits } from "@/lib/format";

export function NotificationsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const { data, isLoading } = useQuery({ queryKey: ["dashboard"], queryFn: () => fetch("/api/dashboard").then((r) => r.json()), enabled: open });

  const alerts: { icon: any; color: string; bg: string; title: string; desc: string }[] = [];
  if (data?.lowStockProducts?.length) {
    for (const p of data.lowStockProducts.slice(0, 5)) {
      alerts.push({
        icon: p.stockQuantity <= 0 ? PackageX : AlertTriangle,
        color: p.stockQuantity <= 0 ? "#C62828" : "#F57C00",
        bg: p.stockQuantity <= 0 ? "#FFEBEE" : "#FFF3E0",
        title: `${p.name} — ${p.stockQuantity <= 0 ? "স্টক শেষ" : "কম স্টক"}`,
        desc: `${p.stockQuantity <= 0 ? "পণ্য ফুরিয়ে গেছে" : `মাত্র ${toBnDigits(p.stockQuantity)} ${p.unit} বাকি`}. দ্রুত ক্রয় করুন।`,
      });
    }
  }
  if (data?.dues?.customerDue > 10000) {
    alerts.push({ icon: TrendingDown, color: "#1B5E20", bg: "#E8F5E9", title: "গ্রাহক পাওনা বেশি", desc: `মোট পাওনা ${formatTk(data.dues.customerDue)}. আদায় করুন।` });
  }
  if (data?.dues?.supplierDue > 10000) {
    alerts.push({ icon: TrendingDown, color: "#C62828", bg: "#FFEBEE", title: "সরবরাহকারী দেনা বেশি", desc: `মোট দেনা ${formatTk(data.dues.supplierDue)}. পরিশোধ করুন।` });
  }
  if (alerts.length === 0 && data) {
    alerts.push({ icon: Bell, color: "#1B5E20", bg: "#E8F5E9", title: "সব ঠিক আছে", desc: "কোনো সতর্কতা নেই। ব্যবসা ভালো চলছে।" });
  }

  return (
    <ModalSheet open={open} onClose={onClose} title="নোটিফিকেশন" subtitle="সতর্কতা ও আপডেট">
      {isLoading ? <LoadingState /> : (
        <div className="p-4 space-y-2">
          {alerts.map((a, i) => {
            const Icon = a.icon;
            return (
              <div key={i} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 flex items-start gap-3">
                <span className="w-10 h-10 rounded-xl flex items-center justify-center shrink-0" style={{ background: a.bg }}>
                  <Icon className="w-5 h-5" style={{ color: a.color }} />
                </span>
                <div className="min-w-0">
                  <p className="text-sm font-semibold text-foreground">{a.title}</p>
                  <p className="text-[11px] text-muted-foreground mt-0.5">{a.desc}</p>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </ModalSheet>
  );
}

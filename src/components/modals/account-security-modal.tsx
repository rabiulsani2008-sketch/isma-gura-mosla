"use client";

import { Lock, Users, Shield, KeyRound, ChevronRight } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";

export function AccountSecurityModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { openModal, session } = useAppStore();

  const items = [
    { icon: KeyRound, label: t("changePassword"), color: "#1B5E20", bg: "#E8F5E9", modal: "change_password" as const },
    { icon: Users, label: t("shopMembers"), color: "#1565C0", bg: "#E3F2FD", modal: "members" as const },
  ];

  return (
    <ModalSheet open={open} onClose={onClose} title={t("accountSecurity")} subtitle={session?.userName}>
      <div className="p-4 space-y-3">
        <div className="flex justify-center"><div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center"><Shield className="w-8 h-8 text-primary" /></div></div>

        {/* Current account info */}
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/50">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-[#E8F5E9] flex items-center justify-center text-xl">👤</div>
            <div className="flex-1 min-w-0">
              <p className="text-sm font-bold">{session?.userName}</p>
              <p className="text-[11px] text-muted-foreground">{session?.role === "owner" ? t("owner") : t("staff")}</p>
            </div>
            <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${session?.role === "owner" ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#E8F5E9] text-primary"}`}>
              {session?.role === "owner" ? t("owner") : t("staff")}
            </span>
          </div>
        </div>

        {/* Security options */}
        <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden">
          {items.map((it, i) => (
            <button
              key={it.modal}
              onClick={() => { onClose(); setTimeout(() => openModal(it.modal), 100); }}
              className={`w-full flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/50" : ""} active:bg-muted/50 transition`}
            >
              <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: it.bg }}>
                <it.icon className="w-4 h-4" style={{ color: it.color }} />
              </span>
              <span className="flex-1 text-left text-sm font-medium">{it.label}</span>
              <ChevronRight className="w-4 h-4 text-muted-foreground" />
            </button>
          ))}
        </div>

        <div className="bg-[#E8F5E9] rounded-xl p-3 flex items-start gap-2">
          <Lock className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-primary">
            {useT_lang() === "bn"
              ? "আপনার পাসওয়ার্ড এনক্রিপ্টেড আকারে সংরক্ষিত। শপ কোড শেয়ার করে অন্যদের যোগ দিন।"
              : "Your password is stored encrypted. Share your shop code to let others join."}
          </p>
        </div>
      </div>
    </ModalSheet>
  );
}

function useT_lang() {
  return useAppStore((s) => s.language);
}

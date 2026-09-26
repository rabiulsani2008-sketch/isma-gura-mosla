"use client";

import { Check, Globe } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { translations, type Lang } from "@/lib/i18n";
import { toast } from "sonner";

export function LanguageModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const { language, setLanguage } = useAppStore();

  const choose = (lang: Lang) => {
    setLanguage(lang);
    // Persist to shop on backend (best-effort)
    fetch("/api/shop", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ language: lang }) }).catch(() => {});
    toast.success(lang === "bn" ? "বাংলা নির্বাচিত" : "English selected");
    onClose();
  };

  const options: { code: Lang; label: string; sub: string }[] = [
    { code: "bn", label: "বাংলা", sub: "Bengali" },
    { code: "en", label: "English", sub: "ইংরেজি" },
  ];

  return (
    <ModalSheet open={open} onClose={onClose} title={t("language")} subtitle={t("bangla") + " / " + t("english")}>
      <div className="p-4 space-y-2">
        <div className="flex justify-center mb-2"><div className="w-16 h-16 rounded-2xl bg-[#E3F2FD] flex items-center justify-center"><Globe className="w-8 h-8 text-[#1565C0]" /></div></div>
        {options.map((o) => (
          <button
            key={o.code}
            onClick={() => choose(o.code)}
            className={`w-full flex items-center gap-3 p-4 rounded-2xl border-2 transition active:scale-[0.98] ${
              language === o.code ? "border-primary bg-[#E8F5E9]" : "border-border bg-white dark:bg-card"
            }`}
          >
            <div className="flex-1 text-left">
              <p className="text-base font-bold">{o.label}</p>
              <p className="text-xs text-muted-foreground">{o.sub}</p>
            </div>
            {language === o.code && <Check className="w-5 h-5 text-primary" />}
          </button>
        ))}
        <p className="text-[11px] text-muted-foreground text-center mt-3">
          {language === "bn" ? "আপনার পছন্দ সংরক্ষিত হবে" : "Your preference will be saved"}
        </p>
      </div>
    </ModalSheet>
  );
}

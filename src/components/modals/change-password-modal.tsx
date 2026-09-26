"use client";

import { useState } from "react";
import { Loader2, Lock, Check } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { toast } from "sonner";

export function ChangePasswordModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const [oldPw, setOldPw] = useState("");
  const [newPw, setNewPw] = useState("");
  const [confirmPw, setConfirmPw] = useState("");
  const [loading, setLoading] = useState(false);
  const { bumpRefresh } = useAppStore();

  const submit = async () => {
    if (!oldPw) return toast.error(t("oldPassword"));
    if (!newPw || newPw.length < 4) return toast.error(t("errPasswordShort"));
    if (newPw !== confirmPw) return toast.error(t("confirmPassword") + " ✗");
    setLoading(true);
    try {
      const res = await fetch("/api/auth/change-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ oldPassword: oldPw, newPassword: newPw }),
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error === "PASSWORD_SHORT" ? t("errPasswordShort") : d.error);
      toast.success(t("changePassword") + " ✓");
      setOldPw(""); setNewPw(""); setConfirmPw("");
      bumpRefresh();
      onClose();
    } catch {
      toast.error(t("errNetwork"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title={t("changePassword")} subtitle={t("accountSecurity")} footer={
      <button onClick={submit} disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Check className="w-4 h-4" /> {t("save")}</>}
      </button>
    }>
      <div className="p-4 space-y-4">
        <div className="flex justify-center"><div className="w-16 h-16 rounded-2xl bg-[#E8F5E9] flex items-center justify-center"><Lock className="w-8 h-8 text-primary" /></div></div>
        <Field label={t("oldPassword")}><input type="password" value={oldPw} onChange={(e) => setOldPw(e.target.value)} className={inputCls} /></Field>
        <Field label={t("newPassword")}><input type="password" value={newPw} onChange={(e) => setNewPw(e.target.value)} className={inputCls} /></Field>
        <Field label={t("confirmPassword")}><input type="password" value={confirmPw} onChange={(e) => setConfirmPw(e.target.value)} className={inputCls} /></Field>
        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3 text-[11px] text-amber-700 dark:text-amber-400">
          {t("errPasswordShort")}
        </div>
      </div>
    </ModalSheet>
  );
}

const inputCls = "w-full px-3 py-3 rounded-xl border border-input bg-white dark:bg-card text-base outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium mb-1.5 block">{label}</label>{children}</div>;
}

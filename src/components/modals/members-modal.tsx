"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, UserPlus, Copy, Crown, User } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { formatBnDate } from "@/lib/format";
import { toast } from "sonner";

export function MembersModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { session } = useAppStore();
  const [showAdd, setShowAdd] = useState(false);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");
  const [adding, setAdding] = useState(false);

  const { data, isLoading } = useQuery({
    queryKey: ["members"],
    queryFn: () => fetch("/api/members").then((r) => r.json()),
    enabled: open,
  });

  const addMember = async () => {
    if (!name.trim()) return toast.error(t("errNameRequired"));
    if (!phone.trim()) return toast.error(t("errPhoneRequired"));
    if (!password || password.length < 4) return toast.error(t("errPasswordShort"));
    setAdding(true);
    try {
      const res = await fetch("/api/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, phone, password }),
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error === "PHONE_EXISTS" ? t("errPhoneExists") : d.error);
      toast.success(t("addMember") + " ✓");
      setName(""); setPhone(""); setPassword("");
      setShowAdd(false);
      qc.invalidateQueries({ queryKey: ["members"] });
    } catch {
      toast.error(t("errNetwork"));
    } finally {
      setAdding(false);
    }
  };

  const copyCode = () => {
    if (data?.shopCode) {
      navigator.clipboard.writeText(data.shopCode);
      toast.success(t("shopCode") + " ✓");
    }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title={t("shopMembers")} subtitle={t("shopInfo")} footer={
      !showAdd && session?.role === "owner" ? (
        <button onClick={() => setShowAdd(true)} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          <UserPlus className="w-4 h-4" /> {t("addMember")}
        </button>
      ) : showAdd ? (
        <button onClick={addMember} disabled={adding} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {adding ? <Loader2 className="w-4 h-4 animate-spin" /> : t("save")}
        </button>
      ) : undefined
    }>
      <div className="p-4 space-y-4">
        {/* Shop code share card */}
        {data?.shopCode && (
          <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white rounded-2xl p-4">
            <p className="text-xs text-white/80">{t("shopCode")}</p>
            <div className="flex items-center justify-between mt-1">
              <p className="text-xl font-bold tracking-wider font-mono">{data.shopCode}</p>
              <button onClick={copyCode} className="p-2 rounded-lg bg-white/15 active:scale-90 transition">
                <Copy className="w-4 h-4" />
              </button>
            </div>
            <p className="text-[10px] text-white/70 mt-2">{t("joinShop")} → {t("enterShopCode")}</p>
          </div>
        )}

        {showAdd && (
          <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border space-y-3">
            <Field label={t("name")}><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} placeholder={t("name")} /></Field>
            <Field label={t("phone")}><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} placeholder="01XXXXXXXXX" type="tel" /></Field>
            <Field label={t("password")}><input value={password} onChange={(e) => setPassword(e.target.value)} className={inputCls} placeholder="••••" type="password" /></Field>
            <button onClick={() => setShowAdd(false)} className="text-xs text-muted-foreground">{t("cancel")}</button>
          </div>
        )}

        {/* Members list */}
        {isLoading ? <div className="flex justify-center py-8"><Loader2 className="w-6 h-6 animate-spin text-primary" /></div> : (
          <div className="space-y-2">
            <p className="text-xs font-bold text-muted-foreground">{t("shopMembers")} ({data?.users?.length || 0})</p>
            {data?.users?.map((u: any) => (
              <div key={u.id} className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3">
                <div className={`w-10 h-10 rounded-full flex items-center justify-center ${u.role === "owner" ? "bg-[#FFF3E0]" : "bg-[#E8F5E9]"}`}>
                  {u.role === "owner" ? <Crown className="w-5 h-5 text-[#E65100]" /> : <User className="w-5 h-5 text-primary" />}
                </div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{u.name}</p>
                  <p className="text-[11px] text-muted-foreground">{u.phone}</p>
                </div>
                <span className={`text-[10px] px-2 py-1 rounded-full font-medium ${u.role === "owner" ? "bg-[#FFF3E0] text-[#E65100]" : "bg-[#E8F5E9] text-primary"}`}>
                  {u.role === "owner" ? t("owner") : t("staff")}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </ModalSheet>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-input bg-background text-base outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium mb-1.5 block">{label}</label>{children}</div>;
}

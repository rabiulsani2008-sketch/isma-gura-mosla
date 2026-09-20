"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Loader2, Save } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import { toast } from "sonner";

export function ShopSetupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { session, setSession } = useAppStore();
  const { data } = useQuery({ queryKey: ["shop"], queryFn: () => fetch("/api/shop").then((r) => r.json()), enabled: open });

  const [name, setName] = useState(COMPANY_NAME);
  const [ownerName, setOwnerName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [tagline, setTagline] = useState(COMPANY_TAGLINE);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (data?.shop) {
      setName(data.shop.name);
      setOwnerName(data.shop.ownerName);
      setPhone(data.shop.phone);
      setAddress(data.shop.address);
      setTagline(data.shop.tagline);
    }
  }, [data]);

  const save = async () => {
    setSaving(true);
    try {
      const res = await fetch("/api/shop", { method: "PUT", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, ownerName, phone, address, tagline }) });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || "ব্যর্থ");
      toast.success("দোকানের তথ্য আপডেট হয়েছে");
      if (session) setSession({ ...session, shopName: name });
      qc.invalidateQueries({ queryKey: ["shop"] });
      onClose();
    } finally { setSaving(false); }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="দোকানের তথ্য" subtitle="আপনার ব্যবসার বিস্তারিত" footer={
      <button onClick={save} disabled={saving} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <><Save className="w-4 h-4" /> সংরক্ষণ করুন</>}
      </button>
    }>
      <div className="p-4 space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-4xl">🌿</div>
        </div>
        <Field label="দোকানের নাম"><input value={name} onChange={(e) => setName(e.target.value)} className={inputCls} /></Field>
        <Field label="মালিকের নাম"><input value={ownerName} onChange={(e) => setOwnerName(e.target.value)} className={inputCls} /></Field>
        <Field label="মোবাইল নম্বর"><input value={phone} onChange={(e) => setPhone(e.target.value)} className={inputCls} /></Field>
        <Field label="ঠিকানা"><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} className={`${inputCls} resize-none`} /></Field>
        <Field label="স্লোগান"><input value={tagline} onChange={(e) => setTagline(e.target.value)} className={inputCls} /></Field>
        <div className="bg-[#E8F5E9] rounded-xl p-3 text-center">
          <p className="text-[11px] text-muted-foreground">মুদ্রা</p>
          <p className="text-base font-bold text-primary">৳ টাকা (BDT)</p>
        </div>
      </div>
    </ModalSheet>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium mb-1.5 block">{label}</label>{children}</div>;
}

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";

export function CustomerModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [address, setAddress] = useState("");
  const [openingDue, setOpeningDue] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const { bumpRefresh } = useAppStore();

  const submit = async () => {
    if (!name.trim()) return toast.error("নাম দিন");
    if (!phone.trim()) return toast.error("মোবাইল নম্বর দিন");
    setSubmitting(true);
    try {
      const res = await fetch("/api/customers", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ name, phone, address, openingDue: Number(openingDue) || 0 }) });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ব্যর্থ");
      toast.success("গ্রাহক সফলভাবে যোগ হয়েছে।");
      setName(""); setPhone(""); setAddress(""); setOpeningDue("");
      qc.invalidateQueries({ queryKey: ["customers"] });
      bumpRefresh();
      onClose();
    } catch { toast.error("নেটওয়ার্ক সমস্যা"); } finally { setSubmitting(false); }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="গ্রাহক যোগ করুন" subtitle="নতুন গ্রাহকের তথ্য" footer={
      <button onClick={submit} disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "সংরক্ষণ করুন"}
      </button>
    }>
      <div className="p-4 space-y-4">
        <Field label="নাম *"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="গ্রাহকের নাম" className={inputCls} /></Field>
        <Field label="মোবাইল নম্বর *"><input type="tel" value={phone} onChange={(e) => setPhone(e.target.value)} placeholder="01XXXXXXXXX" className={inputCls} /></Field>
        <Field label="ঠিকানা"><textarea value={address} onChange={(e) => setAddress(e.target.value)} rows={2} placeholder="ঠিকানা..." className={`${inputCls} resize-none`} /></Field>
        <Field label="পূর্বের বকেয়া (৳)"><input type="number" value={openingDue} onChange={(e) => setOpeningDue(e.target.value)} placeholder="0" className={inputCls} /></Field>
      </div>
    </ModalSheet>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary";
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return <div><label className="text-xs font-medium mb-1.5 block">{label}</label>{children}</div>;
}

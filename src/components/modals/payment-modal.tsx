"use client";

import { useState, useEffect } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Loader2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { PAYMENT_METHODS } from "@/lib/constants";
import { formatTk } from "@/lib/format";
import { toast } from "sonner";

export function PaymentModal({
  open,
  type,
  presetPartyId,
  onClose,
}: {
  open: boolean;
  type: "customer_payment" | "supplier_payment";
  presetPartyId?: string;
  onClose: () => void;
}) {
  const isCustomer = type === "customer_payment";
  const [partyId, setPartyId] = useState<string | null>(presetPartyId || null);
  const [search, setSearch] = useState("");
  const [showPicker, setShowPicker] = useState(!presetPartyId);
  const [amount, setAmount] = useState("");
  const [method, setMethod] = useState("নগদ");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const { bumpRefresh } = useAppStore();

  useEffect(() => {
    if (presetPartyId) { setPartyId(presetPartyId); setShowPicker(false); }
    else { setPartyId(null); setShowPicker(true); }
  }, [presetPartyId, open]);

  const { data } = useQuery({
    queryKey: [isCustomer ? "customers" : "suppliers"],
    queryFn: () => fetch(isCustomer ? "/api/customers" : "/api/suppliers").then((r) => r.json()),
    enabled: open,
  });
  const parties = (data?.[isCustomer ? "customers" : "suppliers"] || []).filter((p: any) =>
    !search || p.name.includes(search) || p.phone.includes(search)
  );
  const selected = (data?.[isCustomer ? "customers" : "suppliers"] || []).find((p: any) => p.id === partyId);

  const submit = async () => {
    if (!partyId) return toast.error(isCustomer ? "গ্রাহক নির্বাচন করুন" : "সরবরাহকারী নির্বাচন করুন");
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("পরিমাণ ০-এর বেশি হতে হবে");
    setSubmitting(true);
    try {
      const res = await fetch("/api/payments", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          type,
          [isCustomer ? "customerId" : "supplierId"]: partyId,
          [isCustomer ? "customerName" : "supplierName"]: selected?.name,
          amount: amt,
          paymentMethod: method,
          note,
        }),
      });
      const d = await res.json();
      if (!res.ok) return toast.error(d.error || "ব্যর্থ");
      toast.success(isCustomer ? "পাওনা সফলভাবে গ্রহণ হয়েছে।" : "দেনা সফলভাবে পরিশোধ হয়েছে।");
      setAmount(""); setNote("");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      qc.invalidateQueries({ queryKey: [isCustomer ? "customers" : "suppliers"] });
      bumpRefresh();
      onClose();
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title={isCustomer ? "টাকা নিন (গ্রাহক পাওনা)" : "টাকা দিন (সরবরাহকারী দেনা)"}
      subtitle={selected ? selected.name : `${isCustomer ? "গ্রাহক" : "সরবরাহকারী"} নির্বাচন করুন`}
      footer={
        <button onClick={submit} disabled={submitting || !partyId} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "সংরক্ষণ করুন"}
        </button>
      }
    >
      <div className="p-4 space-y-4">
        {/* Party picker */}
        {showPicker ? (
          <div>
            <div className="relative mb-2">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input autoFocus value={search} onChange={(e) => setSearch(e.target.value)} placeholder={isCustomer ? "গ্রাহক খুঁজুন..." : "সরবরাহকারী খুঁজুন..."} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary" />
            </div>
            <div className="space-y-1.5 max-h-72 overflow-y-auto scrollbar-thin">
              {parties.map((p: any) => (
                <button key={p.id} onClick={() => { setPartyId(p.id); setShowPicker(false); }} className="w-full text-left bg-white dark:bg-card rounded-xl p-3 border border-border/50 active:scale-[0.98]">
                  <div className="flex items-center justify-between">
                    <div className="min-w-0">
                      <p className="text-sm font-semibold truncate">{p.name}</p>
                      <p className="text-[11px] text-muted-foreground">{p.phone}</p>
                    </div>
                    <div className="text-right">
                      <p className={`text-xs font-bold ${p.due > 0 ? (isCustomer ? "text-[#1B5E20]" : "text-[#C62828]") : "text-muted-foreground"}`}>
                        {isCustomer ? "পাওনা" : "দেনা"}: {formatTk(p.due)}
                      </p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </div>
        ) : (
          <>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 flex items-center justify-between">
              <div>
                <p className="text-sm font-semibold">{selected?.name}</p>
                <p className="text-[11px] text-muted-foreground">{selected?.phone}</p>
              </div>
              <button onClick={() => setShowPicker(true)} className="text-xs text-primary font-medium">পরিবর্তন</button>
            </div>
            {selected?.due > 0 && (
              <div className={`rounded-xl p-3 ${isCustomer ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"} flex justify-between items-center`}>
                <span className="text-xs">{isCustomer ? "বর্তমান পাওনা" : "বর্তমান দেনা"}</span>
                <span className={`font-bold ${isCustomer ? "text-[#1B5E20]" : "text-[#C62828]"}`}>{formatTk(selected.due)}</span>
              </div>
            )}
            <div>
              <label className="text-xs font-medium mb-1.5 block">পরিমাণ (৳)</label>
              <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} placeholder="0" className="w-full px-3 py-3 rounded-xl border border-input bg-white dark:bg-card text-lg font-bold outline-none focus:border-primary" />
              {selected?.due > 0 && Number(amount) > selected.due && (
                <p className="text-[11px] text-amber-600 mt-1">⚠️ পাওনার চেয়ে বেশি টাকা প্রবেশ করানো হয়েছে</p>
              )}
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">পরিশোধ পদ্ধতি</label>
              <div className="grid grid-cols-3 gap-1.5">
                {PAYMENT_METHODS.filter((m) => m !== "বাকিতে").map((m) => (
                  <button key={m} onClick={() => setMethod(m)} className={`py-2 rounded-lg text-[11px] font-medium ${method === m ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">নোট (ঐচ্ছিক)</label>
              <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="নোট..." className="w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary" />
            </div>
          </>
        )}
      </div>
    </ModalSheet>
  );
}

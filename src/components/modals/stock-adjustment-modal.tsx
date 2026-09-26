"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { toBnDigits } from "@/lib/format";
import { toast } from "sonner";

export function StockAdjustmentModal({ open, product, onClose }: { open: boolean; product: any; onClose: () => void }) {
  const [newQty, setNewQty] = useState("");
  const [note, setNote] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const { bumpRefresh } = useAppStore();

  useEffect(() => {
    if (product) { setNewQty(String(product.stockQuantity)); setNote(""); }
  }, [product, open]);

  const submit = async () => {
    if (!product) return;
    const q = Number(newQty);
    if (q < 0) return toast.error("পরিমাণ ঋণাত্মক হতে পারে না");
    setSubmitting(true);
    try {
      const res = await fetch("/api/stock", { method: "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify({ productId: product.id, newQuantity: q, note }) });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ব্যর্থ");
      toast.success("স্টক আপডেট হয়েছে।");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["stock"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      bumpRefresh();
      onClose();
    } catch { toast.error("নেটওয়ার্ক সমস্যা"); } finally { setSubmitting(false); }
  };

  if (!product) return null;
  const delta = Number(newQty) - product.stockQuantity;

  return (
    <ModalSheet open={open} onClose={onClose} title="স্টক সমন্বয়" subtitle={product.name} footer={
      <button onClick={submit} disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "সংরক্ষণ করুন"}
      </button>
    }>
      <div className="p-4 space-y-4">
        <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/50 text-center">
          <p className="text-xs text-muted-foreground">বর্তমান স্টক</p>
          <p className="text-2xl font-bold text-foreground mt-1">{toBnDigits(product.stockQuantity)} {product.unit}</p>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">নতুন স্টক পরিমাণ</label>
          <input type="text" inputMode="decimal" pattern="[0-9.]*" value={newQty} onChange={(e) => setNewQty(e.target.value.replace(/,/g,".").replace(/[^\d.]/g,""))} className="w-full px-3 py-3 rounded-xl border border-input bg-white dark:bg-card text-lg font-bold text-center outline-none focus:border-primary" />
        </div>
        {delta !== 0 && (
          <div className={`rounded-xl p-3 text-center ${delta > 0 ? "bg-[#E8F5E9]" : "bg-[#FFEBEE]"}`}>
            <p className="text-xs text-muted-foreground">পরিবর্তন</p>
            <p className={`text-lg font-bold ${delta > 0 ? "text-[#1B5E20]" : "text-[#C62828]"}`}>{delta > 0 ? "+" : ""}{toBnDigits(delta)} {product.unit}</p>
          </div>
        )}
        <div>
          <label className="text-xs font-medium mb-1.5 block">নোট (ঐচ্ছিক)</label>
          <input value={note} onChange={(e) => setNote(e.target.value)} placeholder="সমন্বয়ের কারণ..." className="w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary" />
        </div>
      </div>
    </ModalSheet>
  );
}

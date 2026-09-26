"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { EXPENSE_CATEGORIES } from "@/lib/constants";
import { useAppStore } from "@/store/use-app-store";
import { formatTk } from "@/lib/format";
import { toInputDate } from "@/lib/format";
import { toast } from "sonner";

export function ExpenseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [category, setCategory] = useState<string>(EXPENSE_CATEGORIES[0]);
  const [amount, setAmount] = useState("");
  const [note, setNote] = useState("");
  const [date, setDate] = useState(toInputDate());
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const { bumpRefresh } = useAppStore();

  const submit = async () => {
    const amt = Number(amount);
    if (!amt || amt <= 0) return toast.error("পরিমাণ ০-এর বেশি হতে হবে");
    setSubmitting(true);
    try {
      const res = await fetch("/api/expenses", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ category, amount: amt, note, expenseDate: date }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ব্যর্থ");
      toast.success("খরচ সফলভাবে সংরক্ষণ হয়েছে।");
      setAmount(""); setNote("");
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["expenses"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
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
      title="খরচ যোগ করুন"
      subtitle="নতুন খরচের তথ্য লিখুন"
      footer={
        <button onClick={submit} disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
          {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "খরচ সংরক্ষণ করুন"}
        </button>
      }
    >
      <div className="p-4 space-y-4">
        <div>
          <label className="text-xs font-medium mb-1.5 block">খরচের ধরন</label>
          <div className="grid grid-cols-2 gap-1.5">
            {EXPENSE_CATEGORIES.map((c) => (
              <button key={c} onClick={() => setCategory(c)} className={`py-2.5 rounded-xl text-xs font-medium transition ${category === c ? "bg-[#FFF3E0] text-[#E65100] border-2 border-[#FB8C00]" : "bg-white dark:bg-card border border-border"}`}>
                {c}
              </button>
            ))}
          </div>
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">পরিমাণ (৳)</label>
          <input type="text" inputMode="decimal" pattern="[0-9.]*" value={amount} onChange={(e) => setAmount(e.target.value.replace(/,/g,".").replace(/[^\d.]/g,""))} placeholder="0" className="w-full px-3 py-3 rounded-xl border border-input bg-white dark:bg-card text-lg font-bold outline-none focus:border-primary" />
          {amount && Number(amount) > 0 && <p className="text-xs text-muted-foreground mt-1">= {formatTk(Number(amount))}</p>}
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">তারিখ</label>
          <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary" />
        </div>
        <div>
          <label className="text-xs font-medium mb-1.5 block">নোট (ঐচ্ছিক)</label>
          <textarea value={note} onChange={(e) => setNote(e.target.value)} placeholder="খরচের বিবরণ..." rows={2} className="w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary resize-none" />
        </div>
      </div>
    </ModalSheet>
  );
}

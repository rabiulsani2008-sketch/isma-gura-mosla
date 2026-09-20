"use client";

import { useState } from "react";
import { Download, Upload, FileJson, Loader2, Database } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { toast } from "sonner";

export function BackupModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [busy, setBusy] = useState(false);

  const exportJson = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/backup");
      if (!res.ok) return toast.error("ব্যাকআপ ব্যর্থ");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `backup-${new Date().toISOString().slice(0, 10)}.json`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("ব্যাকআপ ডাউনলোড হয়েছে");
    } finally { setBusy(false); }
  };

  const exportCsv = async () => {
    setBusy(true);
    try {
      const res = await fetch("/api/transactions");
      const { transactions } = await res.json();
      const rows = [["তারিখ", "ধরন", "বিবরণ", "পরিমাণ", "পদ্ধতি"]];
      for (const t of transactions) {
        rows.push([new Date(t.createdAt).toLocaleString("bn-BD"), t.type, t.description, String(t.amount), t.paymentMethod || ""]);
      }
      const csv = rows.map((r) => r.map((c) => `"${String(c).replace(/"/g, '""')}"`).join(",")).join("\n");
      const blob = new Blob(["\ufeff" + csv], { type: "text/csv;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url; a.download = `transactions-${new Date().toISOString().slice(0, 10)}.csv`;
      a.click();
      URL.revokeObjectURL(url);
      toast.success("CSV ডাউনলোড হয়েছে");
    } finally { setBusy(false); }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="ব্যাকআপ ও এক্সপোর্ট" subtitle="আপনার ডেটা নিরাপদ রাখুন">
      <div className="p-4 space-y-3">
        <button onClick={exportJson} disabled={busy} className="w-full bg-white dark:bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3 active:scale-[0.98] disabled:opacity-60 text-left">
          <span className="w-11 h-11 rounded-xl bg-[#E8F5E9] flex items-center justify-center"><Download className="w-5 h-5 text-[#1B5E20]" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">JSON ব্যাকআপ</p>
            <p className="text-[11px] text-muted-foreground">সম্পূর্ণ ডেটা ডাউনলোড করুন</p>
          </div>
          {busy && <Loader2 className="w-4 h-4 animate-spin text-muted-foreground" />}
        </button>

        <button onClick={exportCsv} disabled={busy} className="w-full bg-white dark:bg-card rounded-2xl p-4 border border-border/50 flex items-center gap-3 active:scale-[0.98] disabled:opacity-60 text-left">
          <span className="w-11 h-11 rounded-xl bg-[#E3F2FD] flex items-center justify-center"><FileJson className="w-5 h-5 text-[#1565C0]" /></span>
          <div className="flex-1">
            <p className="text-sm font-semibold">লেনদেন CSV (Excel)</p>
            <p className="text-[11px] text-muted-foreground">সব লেনদেন এক্সপোর্ট করুন</p>
          </div>
        </button>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-2xl p-3 flex items-start gap-2">
          <Database className="w-4 h-4 text-amber-600 mt-0.5 shrink-0" />
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            ব্যাকআপ ফাইল নিরাপদ স্থানে সংরক্ষণ করুন। এটি আপনার সম্পূর্ণ ব্যবসার ডেটা ধারণ করে।
          </p>
        </div>
      </div>
    </ModalSheet>
  );
}

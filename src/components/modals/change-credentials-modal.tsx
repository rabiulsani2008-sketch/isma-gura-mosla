"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Phone, Check, KeyRound } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { toast } from "sonner";

export function ChangeCredentialsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const t = useT();
  const qc = useQueryClient();
  const { session, setSession } = useAppStore();
  const [currentPw, setCurrentPw] = useState("");
  const [newPhone, setNewPhone] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!currentPw) return toast.error("বর্তমান পাসওয়ার্ড দিন");
    if (!newPhone.trim() && !newPw) return toast.error("নতুন ফোন বা পাসওয়ার্ড দিন");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          currentPassword: currentPw,
          newPhone: newPhone.trim() || undefined,
          newPassword: newPw || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "আপডেট ব্যর্থ");
        return;
      }
      toast.success("সফলভাবে আপডেট হয়েছে!");
      // Update session if phone changed
      if (newPhone.trim() && session) {
        setSession({ ...session, userId: newPhone.trim() });
      }
      setCurrentPw("");
      setNewPhone("");
      setNewPw("");
      qc.invalidateQueries({ queryKey: ["shop"] });
      onClose();
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-input bg-white dark:bg-card text-base outline-none focus:border-primary transition";

  return (
    <ModalSheet
      open={open}
      onClose={onClose}
      title="ফোন ও পাসওয়ার্ড পরিবর্তন"
      subtitle="আপনার অ্যাকাউন্টের তথ্য আপডেট করুন"
      footer={
        <button
          onClick={submit}
          disabled={loading}
          className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60"
        >
          {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><Check className="w-5 h-5" /> আপডেট করুন</>}
        </button>
      }
    >
      <div className="p-4 space-y-4">
        {/* Info banner */}
        <div className="bg-[#E8F5E9] dark:bg-[#1B3A22] rounded-xl p-3 flex items-start gap-2">
          <KeyRound className="w-4 h-4 text-primary mt-0.5 shrink-0" />
          <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7]">
            নিরাপত্তার জন্য বর্তমান পাসওয়ার্ড দিতে হবে। নতুন ফোন বা পাসওয়ার্ড যেকোনো একটি বা দুটোই পরিবর্তন করতে পারেন।
          </p>
        </div>

        {/* Current password (required) */}
        <div>
          <label className="text-xs font-medium mb-1.5 block">বর্তমান পাসওয়ার্ড *</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              value={currentPw}
              onChange={(e) => setCurrentPw(e.target.value)}
              placeholder="বর্তমান পাসওয়ার্ড"
              className={inputCls}
            />
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium"
            >
              {showPw ? "লুকান" : "দেখান"}
            </button>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-bold text-muted-foreground mb-3">পরিবর্তন করতে চান (যেকোনো একটি বা দুটো)</p>
        </div>

        {/* New phone (optional) */}
        <div>
          <label className="text-xs font-medium mb-1.5 block">নতুন মোবাইল নম্বর</label>
          <div className="relative">
            <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type="tel"
              inputMode="numeric"
              value={newPhone}
              onChange={(e) => setNewPhone(e.target.value)}
              placeholder="নতুন নম্বর (ঐচ্ছিক)"
              className={inputCls}
            />
          </div>
        </div>

        {/* New password (optional) */}
        <div>
          <label className="text-xs font-medium mb-1.5 block">নতুন পাসওয়ার্ড</label>
          <div className="relative">
            <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
            <input
              type={showPw ? "text" : "password"}
              value={newPw}
              onChange={(e) => setNewPw(e.target.value)}
              placeholder="নতুন পাসওয়ার্ড (ঐচ্ছিক, ৪+ অঙ্ক)"
              className={inputCls}
            />
          </div>
        </div>

        <div className="bg-amber-50 dark:bg-amber-950/30 rounded-xl p-3">
          <p className="text-[11px] text-amber-700 dark:text-amber-400">
            ℹ️ ফোন বা পাসওয়ার্ড পরিবর্তন করলে সব ডিভাইসে নতুন তথ্য দিয়ে লগইন করতে হবে।
          </p>
        </div>
      </div>
    </ModalSheet>
  );
}

"use client";

import { useState } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2, Lock, Phone, Check, ShieldCheck } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";

export function ChangeCredentialsModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const qc = useQueryClient();
  const { session, setSession } = useAppStore();
  const [newPhone, setNewPhone] = useState("");
  const [newPw, setNewPw] = useState("");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async () => {
    if (!newPhone.trim() && !newPw) return toast.error("নতুন ফোন বা পাসওয়ার্ড দিন");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/update-credentials", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          newPhone: newPhone.trim() || undefined,
          newPassword: newPw || undefined,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "আপডেট ব্যর্থ");
        return;
      }
      toast.success("লগইন তথ্য আপডেট হয়েছে! আপনার সব ডেটা সুরক্ষিত আছে।");
      // Update session if phone changed
      if (newPhone.trim() && session) {
        setSession({ ...session, userId: newPhone.trim() });
      }
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
      subtitle="শুধু লগইন তথ্য বদলাবে, ডেটা নয়"
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
        {/* DATA SAFE banner — prominent green */}
        <div className="bg-gradient-to-br from-[#E8F5E9] to-[#C8E6C9] dark:from-[#1B3A22] dark:to-[#2E7D32] rounded-2xl p-4 flex items-start gap-3">
          <ShieldCheck className="w-6 h-6 text-[#1B5E20] dark:text-[#A5D6A7] shrink-0 mt-0.5" />
          <div>
            <p className="text-sm font-bold text-[#1B5E20] dark:text-[#A5D6A7]">আপনার সব ডেটা সুরক্ষিত থাকবে</p>
            <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7] mt-1">
              ফোন বা পাসওয়ার্ড পরিবর্তন করলে শুধু লগইন তথ্য বদলাবে।
              আপনার পণ্য, বিক্রি, গ্রাহক, সরবরাহকারী, স্টক, রিপোর্ট — সবকিছু আগের মতোই থাকবে। কিছু মুছবে না।
            </p>
          </div>
        </div>

        <div className="border-t border-border pt-4">
          <p className="text-xs font-bold text-muted-foreground mb-3">নতুন তথ্য দিন (যেকোনো একটি বা দুটো)</p>
        </div>

        {/* New phone */}
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

        {/* New password */}
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
            <button
              type="button"
              onClick={() => setShowPw((v) => !v)}
              className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground text-xs font-medium"
            >
              {showPw ? "লুকান" : "দেখান"}
            </button>
          </div>
        </div>

        <div className="bg-blue-50 dark:bg-blue-950/30 rounded-xl p-3">
          <p className="text-[11px] text-blue-700 dark:text-blue-400">
            ℹ️ পরিবর্তন করার পর সব ডিভাইসে নতুন ফোন/পাসওয়ার্ড দিয়ে লগইন করতে হবে। তবে ডেটা সব ডিভাইসে আগের মতোই থাকবে।
          </p>
        </div>
      </div>
    </ModalSheet>
  );
}

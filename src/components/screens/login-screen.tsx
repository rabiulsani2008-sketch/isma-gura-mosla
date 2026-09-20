"use client";

import { useState } from "react";
import Image from "next/image";
import { motion } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, Fingerprint, Loader2 } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";

export function LoginScreen() {
  const { setSession, setPhase } = useAppStore();
  const [phone, setPhone] = useState("01700000000");
  const [pin, setPin] = useState("1234");
  const [showPin, setShowPin] = useState(false);
  const [loading, setLoading] = useState(false);

  const submit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !pin) {
      toast.error("মোবাইল নম্বর ও PIN দিন");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, pin }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "লগইন ব্যর্থ হয়েছে");
        return;
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success("স্বাগতম! লগইন সফল হয়েছে।");
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা হয়েছে। আবার চেষ্টা করুন।");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mobile-shell flex flex-col bg-[#F5F4EE]">
      {/* Green top */}
      <div className="bg-gradient-to-br from-[#0E3D13] via-[#1B5E20] to-[#2E7D32] pt-safe">
        <div className="px-6 pt-10 pb-14 flex flex-col items-center text-center">
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center p-3"
          >
            <Image src="/logo.png" alt="লোগো" width={80} height={80} className="object-contain" />
          </motion.div>
          <h1 className="mt-5 text-white text-xl font-bold leading-snug">
            ইসমা গুড়া মসলা
            <br />
            প্রাইভেট লিমিটেড
          </h1>
          <p className="mt-2 text-white/80 text-xs">{COMPANY_TAGLINE}</p>
        </div>
      </div>

      {/* Form card */}
      <motion.div
        initial={{ y: 30, opacity: 0 }}
        animate={{ y: 0, opacity: 1 }}
        transition={{ delay: 0.2, duration: 0.4 }}
        className="-mt-8 mx-5 bg-white rounded-3xl shadow-lg p-6"
      >
        <h2 className="text-lg font-bold text-foreground mb-1">লগইন</h2>
        <p className="text-muted-foreground text-xs mb-5">আপনার অ্যাকাউন্টে প্রবেশ করুন</p>

        <form onSubmit={submit} className="space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">মোবাইল নম্বর</label>
            <div className="relative">
              <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type="tel"
                inputMode="numeric"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                placeholder="01XXXXXXXXX"
                className="w-full pl-9 pr-3 py-3 rounded-xl border border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
            </div>
          </div>

          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">পাসওয়ার্ড / PIN</label>
            <div className="relative">
              <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <input
                type={showPin ? "text" : "password"}
                inputMode="numeric"
                value={pin}
                onChange={(e) => setPin(e.target.value)}
                placeholder="••••"
                className="w-full pl-9 pr-10 py-3 rounded-xl border border-input bg-background text-sm focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition"
              />
              <button
                type="button"
                onClick={() => setShowPin((v) => !v)}
                className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground"
                aria-label="PIN দেখান"
              >
                {showPin ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
          >
            {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "লগইন"}
          </button>
        </form>

        <div className="mt-4 flex items-center gap-3">
          <div className="flex-1 h-px bg-border" />
          <span className="text-xs text-muted-foreground">অথবা</span>
          <div className="flex-1 h-px bg-border" />
        </div>

        <button
          type="button"
          onClick={() => toast.info("বায়োমেট্রিক লগইন শীঘ্রই আসছে")}
          className="mt-4 w-full border border-border bg-background hover:bg-muted/50 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition"
        >
          <Fingerprint className="w-5 h-5 text-primary" />
          বায়োমেট্রিক লগইন
        </button>

        <div className="mt-4 flex justify-between text-xs">
          <button onClick={() => toast.info("পাসওয়ার্ড রিকভারি শীঘ্রই আসছে")} className="text-primary font-medium">
            পাসওয়ার্ড ভুলে গেছেন?
          </button>
          <button onClick={() => toast.info("নতুন অ্যাকাউন্টের জন্য শপ সেটআপ করুন")} className="text-primary font-medium">
            নতুন অ্যাকাউন্ট
          </button>
        </div>
      </motion.div>

      <div className="mt-6 mx-5 mb-6 bg-[#E8F5E9] border border-[#C8E6C9] rounded-xl p-3 text-center">
        <p className="text-[11px] text-[#1B5E20]">
          <strong>ডেমো লগইন:</strong> মোবাইল <code className="font-mono">01700000000</code> • PIN <code className="font-mono">1234</code>
        </p>
      </div>

      <div className="mt-auto text-center text-[10px] text-muted-foreground pb-6 px-6">
        © {new Date().getFullYear()} {COMPANY_NAME}
      </div>
    </div>
  );
}

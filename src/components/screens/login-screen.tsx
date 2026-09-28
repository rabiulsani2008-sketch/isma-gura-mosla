"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, Loader2, ChevronLeft, Store } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { COMPANY_NAME } from "@/lib/constants";

type Mode = "login" | "register";

export function LoginScreen() {
  const { setSession, setPhase } = useAppStore();
  const t = useT();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);
  const [showPw, setShowPw] = useState(false);

  // Shared fields
  const [phone, setPhone] = useState("");
  const [password, setPassword] = useState("");

  // Register-only fields
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone.trim()) return toast.error("মোবাইল নম্বর দিন");
    if (!password) return toast.error("পাসওয়ার্ড দিন");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "লগইন ব্যর্থ");
        return;
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success("স্বাগতম!");
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) return toast.error("দোকানের নাম দিন");
    if (!phone.trim()) return toast.error("মোবাইল নম্বর দিন");
    if (!password || password.length < 4) return toast.error("পাসওয়ার্ড কমপক্ষে ৪ অঙ্কের হতে হবে");

    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password, shopName, ownerName: ownerName || shopName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "রেজিস্টার ব্যর্থ");
        return;
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success("অ্যাকাউন্ট তৈরি হয়েছে!");
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-11 pr-4 py-3.5 rounded-2xl border-2 border-input bg-white dark:bg-card text-base outline-none focus:border-primary transition";

  return (
    <div className="mobile-shell flex flex-col bg-[#F5F4EE] dark:bg-background">
      {/* Green top */}
      <div className="bg-gradient-to-br from-[#0E3D13] via-[#1B5E20] to-[#2E7D32] pt-safe">
        <div className="px-6 pt-8 pb-14 flex flex-col items-center text-center relative">
          {mode === "register" && (
            <button
              onClick={() => setMode("login")}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/15 active:scale-90 transition"
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-full bg-white shadow-xl flex items-center justify-center p-2 overflow-hidden"
          >
            { }
            <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
          </motion.div>
          <h1 className="mt-5 text-white text-xl font-bold leading-snug">
            {t("appName")}
            <br />
            <span className="text-base">প্রাইভেট লিমিটেড</span>
          </h1>
          <p className="mt-2 text-white/80 text-xs">{t("tagline")}</p>
        </div>
      </div>

      <div className="-mt-8 mx-5 mb-4 flex-1">
        <AnimatePresence mode="wait">
          {/* LOGIN */}
          {mode === "login" && (
            <motion.form
              key="login"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onSubmit={submitLogin}
              className="bg-white dark:bg-card rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">{t("login")}</h2>
              <p className="text-muted-foreground text-xs mb-5">মোবাইল নম্বর ও পাসওয়ার্ড দিন</p>

              <div className="space-y-3.5">
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="মোবাইল নম্বর"
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground p-1"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60 text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : t("login")}
                </button>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs text-muted-foreground mb-2">নতুন দোকান?</p>
                <button
                  type="button"
                  onClick={() => setMode("register")}
                  className="text-primary font-semibold text-sm flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Store className="w-4 h-4" /> নতুন অ্যাকাউন্ট তৈরি করুন
                </button>
              </div>
            </motion.form>
          )}

          {/* REGISTER */}
          {mode === "register" && (
            <motion.form
              key="register"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onSubmit={submitRegister}
              className="bg-white dark:bg-card rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">নতুন অ্যাকাউন্ট</h2>
              <p className="text-muted-foreground text-xs mb-5">দোকানের তথ্য দিন</p>

              <div className="space-y-3.5">
                <div className="relative">
                  <Store className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="দোকানের নাম *"
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <Phone className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type="tel"
                    inputMode="numeric"
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="মোবাইল নম্বর *"
                    className={inputCls}
                  />
                </div>
                <div className="relative">
                  <Lock className="absolute left-3.5 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                  <input
                    type={showPw ? "text" : "password"}
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    placeholder="পাসওয়ার্ড (৪+ অঙ্ক) *"
                    className={inputCls}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPw((v) => !v)}
                    className="absolute right-3.5 top-1/2 -translate-y-1/2 text-muted-foreground p-1"
                  >
                    {showPw ? <EyeOff className="w-5 h-5" /> : <Eye className="w-5 h-5" />}
                  </button>
                </div>
                <input
                  type="text"
                  value={ownerName}
                  onChange={(e) => setOwnerName(e.target.value)}
                  placeholder="মালিকের নাম (ঐচ্ছিক)"
                  className="w-full px-4 py-3.5 rounded-2xl border-2 border-input bg-white dark:bg-card text-base outline-none focus:border-primary transition"
                />

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60 text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "অ্যাকাউন্ট তৈরি করুন"}
                </button>
              </div>

              <div className="mt-4 bg-[#E8F5E9] dark:bg-[#1B3A22] rounded-xl p-3 text-center">
                <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7]">
                  একই মোবাইল নম্বর ও পাসওয়ার্ড দিয়ে যেকোনো ডিভাইসে লগইন করতে পারবেন।
                </p>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {/* Demo hint */}
      {mode === "login" && (
        <div className="mx-5 mb-6 bg-[#E8F5E9] dark:bg-[#1B3A22] border border-[#C8E6C9] dark:border-[#2E7D32] rounded-xl p-3 text-center">
          <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7]">
            <strong>ডেমো:</strong> নম্বর <code className="font-mono">01700000000</code> • পাসওয়ার্ড <code className="font-mono">1234</code>
          </p>
        </div>
      )}

      <div className="mt-auto text-center text-[10px] text-muted-foreground pb-6 px-6">
        © 2026 {COMPANY_NAME}
      </div>
    </div>
  );
}

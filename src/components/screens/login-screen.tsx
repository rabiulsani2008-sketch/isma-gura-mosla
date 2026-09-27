"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Loader2, Store, Plus, ChevronLeft, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { COMPANY_NAME } from "@/lib/constants";

type Mode = "login" | "create";

export function LoginScreen() {
  const { setSession, setPhase } = useAppStore();
  const t = useT();
  const [mode, setMode] = useState<Mode>("login");
  const [loading, setLoading] = useState(false);

  // Login: just shop code
  const [shopCode, setShopCode] = useState("");

  // Create: shop name + owner name
  const [shopName, setShopName] = useState("");
  const [ownerName, setOwnerName] = useState("");

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopCode.trim()) {
      toast.error("শপ কোড দিন");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/simple-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "ভুল শপ কোড");
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

  const submitCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!shopName.trim()) {
      toast.error("দোকানের নাম দিন");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/auth/create-shop", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shopName, ownerName: ownerName || shopName }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "সমস্যা হয়েছে");
        return;
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success(`দোকান তৈরি হয়েছে! কোড: ${data.shopCode}`);
      // Show the code prominently
      setTimeout(() => {
        toast.info(`আপনার শপ কোড: ${data.shopCode}`, { duration: 8000 });
      }, 1000);
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা। ইন্টারনেট চেক করুন।");
    } finally {
      setLoading(false);
    }
  };

  const inputCls =
    "w-full px-4 py-4 rounded-2xl border-2 border-input bg-white dark:bg-card text-lg font-medium text-center tracking-wider outline-none focus:border-primary transition";

  return (
    <div className="mobile-shell flex flex-col bg-[#F5F4EE] dark:bg-background">
      {/* Green top */}
      <div className="bg-gradient-to-br from-[#0E3D13] via-[#1B5E20] to-[#2E7D32] pt-safe">
        <div className="px-6 pt-8 pb-14 flex flex-col items-center text-center relative">
          {mode === "create" && (
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
              <p className="text-muted-foreground text-xs mb-5">শপ কোড দিয়ে লগইন করুন</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-2 block text-center">
                    শপ কোড
                  </label>
                  <div className="relative">
                    <KeyRound className="absolute left-3 top-1/2 -translate-y-1/2 w-5 h-5 text-muted-foreground" />
                    <input
                      type="text"
                      value={shopCode}
                      onChange={(e) => setShopCode(e.target.value.toUpperCase())}
                      placeholder="ISMA-XXXXXX"
                      autoCapitalize="characters"
                      className="w-full pl-11 pr-4 py-4 rounded-2xl border-2 border-input bg-white dark:bg-card text-lg font-bold tracking-wider text-center outline-none focus:border-primary transition"
                    />
                  </div>
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60 text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Store className="w-5 h-5" />}
                  {t("login")}
                </button>
              </div>

              <div className="mt-5 text-center">
                <p className="text-xs text-muted-foreground mb-2">নতুন দোকান?</p>
                <button
                  type="button"
                  onClick={() => setMode("create")}
                  className="text-primary font-semibold text-sm flex items-center justify-center gap-1.5 mx-auto"
                >
                  <Plus className="w-4 h-4" /> নতুন দোকান তৈরি করুন
                </button>
              </div>
            </motion.form>
          )}

          {mode === "create" && (
            <motion.form
              key="create"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onSubmit={submitCreate}
              className="bg-white dark:bg-card rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">নতুন দোকান</h2>
              <p className="text-muted-foreground text-xs mb-5">দোকানের নাম দিন, কোড পাবেন</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium mb-2 block">দোকানের নাম *</label>
                  <input
                    type="text"
                    value={shopName}
                    onChange={(e) => setShopName(e.target.value)}
                    placeholder="যেমন: ইসমা গুড়া মসলা"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-input bg-white dark:bg-card text-base outline-none focus:border-primary transition"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium mb-2 block">মালিকের নাম</label>
                  <input
                    type="text"
                    value={ownerName}
                    onChange={(e) => setOwnerName(e.target.value)}
                    placeholder="আপনার নাম"
                    className="w-full px-4 py-3.5 rounded-2xl border-2 border-input bg-white dark:bg-card text-base outline-none focus:border-primary transition"
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold py-4 rounded-2xl flex items-center justify-center gap-2 transition disabled:opacity-60 text-base"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : "দোকান তৈরি করুন"}
                </button>
              </div>

              <div className="mt-4 bg-[#E8F5E9] dark:bg-[#1B3A22] rounded-xl p-3 text-center">
                <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7]">
                  দোকান তৈরি হলে আপনি একটি <strong>শপ কোড</strong> পাবেন।
                  <br />
                  এই কোড সবাই শেয়ার করে লগইন করবে।
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
            <strong>ডেমো:</strong> কোড <code className="font-mono font-bold">ISMA-DEMO01</code> দিয়ে লগইন করুন
          </p>
        </div>
      )}

      <div className="mt-auto text-center text-[10px] text-muted-foreground pb-6 px-6">
        © 2026 {COMPANY_NAME}
      </div>
    </div>
  );
}

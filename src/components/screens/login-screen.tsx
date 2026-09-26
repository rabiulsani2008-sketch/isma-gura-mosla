"use client";

import { useState } from "react";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { Phone, Lock, Eye, EyeOff, Fingerprint, Loader2, UserPlus, LogIn, ChevronLeft, Store, KeyRound } from "lucide-react";
import { toast } from "sonner";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import { translations, type TranslationKey } from "@/lib/i18n";

type Mode = "login" | "register" | "join";

export function LoginScreen() {
  const { setSession, setPhase, openModal, closeModal } = useAppStore();
  const t = useT();
  const [mode, setMode] = useState<Mode>("login");

  // Login fields
  const [phone, setPhone] = useState("01700000000");
  const [password, setPassword] = useState("1234");
  const [showPw, setShowPw] = useState(false);
  const [loading, setLoading] = useState(false);

  // Register fields
  const [rName, setRName] = useState("");
  const [rPhone, setRPhone] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rShopName, setRShopName] = useState("");
  const [rOwner, setROwner] = useState("");
  const [rAddress, setRAddress] = useState("");

  // Join fields
  const [jName, setJName] = useState("");
  const [jPhone, setJPhone] = useState("");
  const [jPassword, setJPassword] = useState("");
  const [jShopCode, setJShopCode] = useState("");

  const submitLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!phone || !password) return toast.error(t("errPhoneRequired"));
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, TranslationKey> = {
          PHONE_PASSWORD_REQUIRED: "errPhoneRequired",
          LOGIN_FAILED: "loginFailed",
        };
        return toast.error(t(errMap[data.error] || "loginFailed"));
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success(t("loginSuccess"));
    } catch {
      toast.error(t("errNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const submitRegister = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!rName.trim()) return toast.error(t("errNameRequired"));
    if (!rPhone.trim()) return toast.error(t("errPhoneRequired"));
    if (!rPassword || rPassword.length < 4) return toast.error(t("errPasswordShort"));
    if (!rShopName.trim()) return toast.error(t("shopName") + " " + t("errNameRequired"));
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: rName, phone: rPhone, password: rPassword,
          shopName: rShopName, ownerName: rOwner || rName, address: rAddress,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, TranslationKey> = {
          NAME_REQUIRED: "errNameRequired",
          PHONE_REQUIRED: "errPhoneRequired",
          PASSWORD_SHORT: "errPasswordShort",
          SHOP_NAME_REQUIRED: "errNameRequired",
          PHONE_EXISTS: "errPhoneExists",
        };
        return toast.error(t(errMap[data.error] || "errNetwork"));
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success(t("registerSuccess"));
      if (data.shopCode) {
        setTimeout(() => toast.info(`${t("shopCode")}: ${data.shopCode}`, { duration: 6000 }), 800);
      }
    } catch {
      toast.error(t("errNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const submitJoin = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!jName.trim()) return toast.error(t("errNameRequired"));
    if (!jPhone.trim()) return toast.error(t("errPhoneRequired"));
    if (!jPassword || jPassword.length < 4) return toast.error(t("errPasswordShort"));
    if (!jShopCode.trim()) return toast.error(t("errInvalidShopCode"));
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: jName, phone: jPhone, password: jPassword, shopCode: jShopCode }),
      });
      const data = await res.json();
      if (!res.ok) {
        const errMap: Record<string, TranslationKey> = {
          NAME_REQUIRED: "errNameRequired",
          PHONE_REQUIRED: "errPhoneRequired",
          PASSWORD_SHORT: "errPasswordShort",
          INVALID_SHOP_CODE: "errInvalidShopCode",
          PHONE_EXISTS: "errPhoneExists",
        };
        return toast.error(t(errMap[data.error] || "errNetwork"));
      }
      localStorage.setItem("isma_client_session", JSON.stringify(data.session));
      setSession(data.session);
      setPhase("app");
      toast.success(t("registerSuccess"));
    } catch {
      toast.error(t("errNetwork"));
    } finally {
      setLoading(false);
    }
  };

  const inputCls = "w-full pl-9 pr-10 py-3 rounded-xl border border-input bg-background text-base focus:border-primary focus:ring-2 focus:ring-primary/20 outline-none transition";

  return (
    <div className="mobile-shell flex flex-col bg-[#F5F4EE] dark:bg-background">
      {/* Green top */}
      <div className="bg-gradient-to-br from-[#0E3D13] via-[#1B5E20] to-[#2E7D32] pt-safe">
        <div className="px-6 pt-8 pb-14 flex flex-col items-center text-center relative">
          {mode !== "login" && (
            <button
              onClick={() => setMode("login")}
              className="absolute top-4 left-4 p-2 rounded-full bg-white/15 active:scale-90 transition"
              aria-label={t("back")}
            >
              <ChevronLeft className="w-5 h-5 text-white" />
            </button>
          )}
          <motion.div
            initial={{ scale: 0.7, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            transition={{ duration: 0.5 }}
            className="w-24 h-24 rounded-3xl bg-white shadow-xl flex items-center justify-center p-3"
          >
            <Image src="/logo.png" alt="logo" width={80} height={80} className="object-contain" priority />
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
              <p className="text-muted-foreground text-xs mb-5">{t("appName")}</p>

              <div className="space-y-4">
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("phone")}</label>
                  <div className="relative">
                    <Phone className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type="tel"
                      inputMode="numeric"
                      value={phone}
                      onChange={(e) => setPhone(e.target.value)}
                      placeholder="01XXXXXXXXX"
                      className={inputCls}
                    />
                  </div>
                </div>
                <div>
                  <label className="text-xs font-medium text-foreground mb-1.5 block">{t("password")}</label>
                  <div className="relative">
                    <Lock className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                    <input
                      type={showPw ? "text" : "password"}
                      value={password}
                      onChange={(e) => setPassword(e.target.value)}
                      placeholder="••••"
                      className={inputCls}
                    />
                    <button
                      type="button"
                      onClick={() => setShowPw((v) => !v)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground p-1"
                      aria-label={t("password")}
                    >
                      {showPw ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </div>
                <button
                  type="submit"
                  disabled={loading}
                  className="w-full bg-primary hover:bg-primary/90 active:scale-[0.98] text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 transition disabled:opacity-60"
                >
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <><LogIn className="w-5 h-5" /> {t("login")}</>}
                </button>
              </div>

              <div className="mt-4 flex items-center gap-3">
                <div className="flex-1 h-px bg-border" />
                <span className="text-xs text-muted-foreground">অথবা</span>
                <div className="flex-1 h-px bg-border" />
              </div>

              <button
                type="button"
                onClick={() => toast.info(t("biometricSoon"))}
                className="mt-4 w-full border border-border bg-background hover:bg-muted/50 py-3 rounded-xl flex items-center justify-center gap-2 text-sm font-medium transition"
              >
                <Fingerprint className="w-5 h-5 text-primary" /> {t("biometric")}
              </button>

              <div className="mt-4 flex flex-col gap-2 text-center">
                <button type="button" onClick={() => setMode("register")} className="text-primary font-medium text-sm flex items-center justify-center gap-1">
                  <UserPlus className="w-4 h-4" /> {t("register")}
                </button>
                <button type="button" onClick={() => setMode("join")} className="text-primary font-medium text-sm flex items-center justify-center gap-1">
                  <Store className="w-4 h-4" /> {t("joinShop")}
                </button>
              </div>
            </motion.form>
          )}

          {/* REGISTER (new shop) */}
          {mode === "register" && (
            <motion.form
              key="register"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onSubmit={submitRegister}
              className="bg-white dark:bg-card rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">{t("registerTitle")}</h2>
              <p className="text-muted-foreground text-xs mb-5">{t("createNewShop")}</p>
              <div className="space-y-3.5">
                <RegField icon={Store} label={t("shopName")} value={rShopName} onChange={setRShopName} placeholder="ইসমা গুড়া মসলা" />
                <RegField icon={UserPlus} label={t("ownerName")} value={rOwner} onChange={setROwner} placeholder={t("ownerName")} />
                <RegField icon={Phone} label={t("phone")} value={rPhone} onChange={setRPhone} placeholder="01XXXXXXXXX" type="tel" />
                <RegField icon={Lock} label={t("password")} value={rPassword} onChange={setRPassword} placeholder="••••" type="password" />
                <div>
                  <label className="text-xs font-medium mb-1.5 block">{t("name")}</label>
                  <input value={rName} onChange={(e) => setRName(e.target.value)} placeholder={t("name")} className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-base outline-none focus:border-primary" />
                </div>
                <div>
                  <label className="text-xs font-medium mb-1.5 block">{t("address")}</label>
                  <textarea value={rAddress} onChange={(e) => setRAddress(e.target.value)} rows={2} placeholder={t("address")} className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-base outline-none focus:border-primary resize-none" />
                </div>
                <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t("createNewShop")}</>}
                </button>
              </div>
            </motion.form>
          )}

          {/* JOIN (existing shop) */}
          {mode === "join" && (
            <motion.form
              key="join"
              initial={{ y: 20, opacity: 0 }}
              animate={{ y: 0, opacity: 1 }}
              exit={{ y: -20, opacity: 0 }}
              onSubmit={submitJoin}
              className="bg-white dark:bg-card rounded-3xl shadow-lg p-6"
            >
              <h2 className="text-lg font-bold text-foreground mb-1">{t("joinShop")}</h2>
              <p className="text-muted-foreground text-xs mb-5">{t("haveShopCode")}</p>
              <div className="space-y-3.5">
                <RegField icon={KeyRound} label={t("shopCode")} value={jShopCode} onChange={setJShopCode} placeholder="ISMA-XXXXXX" />
                <RegField icon={UserPlus} label={t("name")} value={jName} onChange={setJName} placeholder={t("name")} />
                <RegField icon={Phone} label={t("phone")} value={jPhone} onChange={setJPhone} placeholder="01XXXXXXXXX" type="tel" />
                <RegField icon={Lock} label={t("password")} value={jPassword} onChange={setJPassword} placeholder="••••" type="password" />
                <button type="submit" disabled={loading} className="w-full bg-primary text-primary-foreground font-semibold py-3.5 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
                  {loading ? <Loader2 className="w-5 h-5 animate-spin" /> : <>{t("joinShop")}</>}
                </button>
              </div>
            </motion.form>
          )}
        </AnimatePresence>
      </div>

      {mode === "login" && (
        <div className="mx-5 mb-6 bg-[#E8F5E9] dark:bg-[#1B3A22] border border-[#C8E6C9] dark:border-[#2E7D32] rounded-xl p-3 text-center">
          <p className="text-[11px] text-[#1B5E20] dark:text-[#A5D6A7]">
            <strong>{t("demoLogin")}:</strong> {t("phone")} <code className="font-mono">01700000000</code> • {t("password")} <code className="font-mono">1234</code>
          </p>
        </div>
      )}
      <div className="mt-auto text-center text-[10px] text-muted-foreground pb-6 px-6">
        © {new Date().getFullYear()} {COMPANY_NAME}
      </div>
    </div>
  );
}

function RegField({ icon: Icon, label, value, onChange, placeholder, type = "text" }: {
  icon: any; label: string; value: string; onChange: (v: string) => void; placeholder?: string; type?: string;
}) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-base outline-none focus:border-primary"
        />
      </div>
    </div>
  );
}

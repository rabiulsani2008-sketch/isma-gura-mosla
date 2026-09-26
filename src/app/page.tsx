"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { useMounted } from "@/hooks/use-mounted";
import { SplashScreen } from "@/components/mobile/splash-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { AppShell } from "@/components/mobile/app-shell";
import { ErrorBoundary } from "@/components/providers/error-boundary";

export default function Page() {
  const { phase, setPhase, session, setSession, setDarkMode, setLanguage, setNotif } = useAppStore();
  const mounted = useMounted();

  // Hydrate preferences from localStorage (dark mode, language, notification settings)
  useEffect(() => {
    if (!mounted) return;
    try {
      const d = localStorage.getItem("isma_dark") === "1";
      setDarkMode(d);
      const lang = (localStorage.getItem("isma_lang") as "bn" | "en") || "bn";
      setLanguage(lang);
      (["notifLowStock", "notifCustomerDue", "notifSupplierDue", "notifDaily"] as const).forEach((k) => {
        const v = localStorage.getItem(`isma_${k}`);
        if (v !== null) setNotif(k, v === "1");
      });
    } catch {
      /* localStorage might not be available */
    }
  }, [mounted, setDarkMode, setLanguage, setNotif]);

  // Ensure demo data is seeded, then check session
  useEffect(() => {
    if (!mounted) return;
    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/seed", { method: "POST" });
      } catch {
        /* ignore */
      }
      try {
        const r = await fetch("/api/auth/session");
        const d = await r.json();
        if (!cancelled && d.session) {
          setSession(d.session);
          setPhase("app");
          return;
        }
      } catch {
        /* ignore */
      }
      try {
        const raw = localStorage.getItem("isma_client_session");
        if (!cancelled && raw) {
          setSession(JSON.parse(raw));
          setPhase("app");
          return;
        }
      } catch {
        /* ignore */
      }
      if (!cancelled) setPhase("auth");
    })();
  }, [mounted, setSession, setPhase]);

  // Hardware back button (Android) / browser back — route to in-app goBack
  useEffect(() => {
    if (phase !== "app") return;
    const handler = () => {
      history.pushState(null, "", location.href);
      useAppStore.getState().goBack();
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [phase]);

  // Before mount (SSR), render a static placeholder to avoid hydration mismatch
  if (!mounted) {
    return (
      <div className="mobile-shell flex items-center justify-center bg-gradient-to-br from-[#0E3D13] via-[#1B5E20] to-[#2E7D32]">
        <div className="w-10 h-10 rounded-full border-[3px] border-white/30 border-t-white animate-spin" />
      </div>
    );
  }

  return (
    <ErrorBoundary>
      {phase === "splash" && <SplashScreen />}
      {phase === "auth" && !session && <LoginScreen />}
      {(phase === "app" || (session && phase !== "splash")) && <AppShell />}
    </ErrorBoundary>
  );
}


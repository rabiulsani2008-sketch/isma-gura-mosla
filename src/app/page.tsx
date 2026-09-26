"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { SplashScreen } from "@/components/mobile/splash-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { AppShell } from "@/components/mobile/app-shell";

export default function Page() {
  const { phase, setPhase, session, setSession, setDarkMode, setLanguage, setNotif } = useAppStore();

  // Hydrate preferences from localStorage (dark mode, language, notification settings)
  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = localStorage.getItem("isma_dark") === "1";
    setDarkMode(d);
    const lang = (localStorage.getItem("isma_lang") as "bn" | "en") || "bn";
    setLanguage(lang);
    (["notifLowStock", "notifCustomerDue", "notifSupplierDue", "notifDaily"] as const).forEach((k) => {
      const v = localStorage.getItem(`isma_${k}`);
      if (v !== null) setNotif(k, v === "1");
    });
     
  }, []);

  // Ensure demo data is seeded, then check session
  useEffect(() => {
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
      const raw = localStorage.getItem("isma_client_session");
      if (!cancelled && raw) {
        try {
          setSession(JSON.parse(raw));
          setPhase("app");
          return;
        } catch {
          /* ignore */
        }
      }
      if (!cancelled) setPhase("auth");
    })();

    const t = setTimeout(() => {
      // splash minimum display; phase set by session check
    }, 1800);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
     
  }, []);

  // Hardware back button (Android) / browser back — route to in-app goBack
  useEffect(() => {
    if (phase !== "app") return;
    const handler = (e: PopStateEvent) => {
      // Push a state so we can intercept the next back
      history.pushState(null, "", location.href);
      useAppStore.getState().goBack();
    };
    history.pushState(null, "", location.href);
    window.addEventListener("popstate", handler);
    return () => window.removeEventListener("popstate", handler);
  }, [phase]);

  if (phase === "splash") {
    return <SplashScreen />;
  }
  if (phase === "auth" || !session) {
    return <LoginScreen />;
  }
  return <AppShell />;
}

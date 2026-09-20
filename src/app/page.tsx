"use client";

import { useEffect } from "react";
import { useAppStore } from "@/store/use-app-store";
import { SplashScreen } from "@/components/mobile/splash-screen";
import { LoginScreen } from "@/components/screens/login-screen";
import { AppShell } from "@/components/mobile/app-shell";

export default function Page() {
  const { phase, setPhase, session, setSession, darkMode, setDarkMode } = useAppStore();

  // Hydrate dark mode from localStorage
  useEffect(() => {
    if (typeof window === "undefined") return;
    const d = localStorage.getItem("isma_dark") === "1";
    setDarkMode(d);
  }, [setDarkMode]);

  // Ensure demo data is seeded, then check session
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        await fetch("/api/seed", { method: "POST" });
      } catch {
        /* ignore */
      }
      // Check existing server session
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
      // Fall back to client session
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

    // Splash timer
    const t = setTimeout(() => {
      if (!cancelled && phase === "splash") {
        // phase will be set by session check; if still splash, show auth
      }
    }, 2200);
    return () => {
      cancelled = true;
      clearTimeout(t);
    };
  }, []);

  if (phase === "splash" || (!session && phase === "splash")) {
    return <SplashScreen />;
  }
  if (phase === "auth" || !session) {
    return <LoginScreen />;
  }
  return <AppShell />;
}

"use client";

import { useEffect } from "react";

/**
 * Registers the PWA service worker for offline app shell caching + installability.
 */
export function ServiceWorkerRegister() {
  useEffect(() => {
    if ("serviceWorker" in navigator && process.env.NODE_ENV === "production") {
      navigator.serviceWorker.register("/sw.js").catch(() => {
        // Silent fail — service worker is a progressive enhancement
      });
    }
  }, []);
  return null;
}

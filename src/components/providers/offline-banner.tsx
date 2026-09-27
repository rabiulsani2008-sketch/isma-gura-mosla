"use client";

import { useState, useEffect } from "react";
import { WifiOff } from "lucide-react";

/**
 * Shows a banner when the user goes offline.
 * The app UI still works (cached), but data operations need internet.
 */
export function OfflineBanner() {
  const [offline, setOffline] = useState(false);

  useEffect(() => {
    const update = () => setOffline(!navigator.onLine);
    update();
    window.addEventListener("online", update);
    window.addEventListener("offline", update);
    return () => {
      window.removeEventListener("online", update);
      window.removeEventListener("offline", update);
    };
  }, []);

  if (!offline) return null;

  return (
    <div className="fixed top-0 left-0 right-0 z-[100] bg-amber-500 text-white text-center text-xs py-1.5 px-4 flex items-center justify-center gap-2 max-w-[480px] mx-auto">
      <WifiOff className="w-3.5 h-3.5 shrink-0" />
      <span>ইন্টারনেট সংযোগ নেই। ডেটা সিঙ্ক করতে ইন্টারনেট চালু করুন।</span>
    </div>
  );
}

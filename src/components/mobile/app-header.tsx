"use client";

import { ArrowLeft, Bell } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { COMPANY_NAME } from "@/lib/constants";
import { cn } from "@/lib/utils";

interface Props {
  title: string;
  subtitle?: string;
  showBack?: boolean;
  showBell?: boolean;
  onBell?: () => void;
  rightSlot?: React.ReactNode;
  green?: boolean;
}

export function AppHeader({ title, subtitle, showBack, showBell, onBell, rightSlot, green = true }: Props) {
  const t = useT();
  const { goBack, canGoBack, openModal } = useAppStore();
  const showBackBtn = showBack ?? canGoBack();

  return (
    <header
      className={cn(
        "sticky top-0 z-20 pt-safe",
        green
          ? "bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white"
          : "bg-card text-foreground border-b border-border"
      )}
    >
      <div className="px-3 pt-3 pb-3 flex items-center gap-2 max-w-[480px] mx-auto">
        {showBackBtn && (
          <button
            onClick={() => goBack()}
            className="-ml-1 p-2 rounded-full active:scale-90 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={t("back")}
          >
            <ArrowLeft className="w-5 h-5" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className={green ? "text-white/75 text-xs truncate" : "text-muted-foreground text-xs truncate"}>{subtitle}</p>}
        </div>
        {rightSlot}
        {showBell && (
          <button
            onClick={() => onBell?.() ?? openModal("notifications")}
            className="relative p-2 rounded-full active:scale-90 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
            aria-label={t("notifications")}
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400" />
          </button>
        )}
      </div>
    </header>
  );
}

export function MainHeader() {
  const { session, openModal, language, setLanguage } = useAppStore();
  const t = useT();
  const today = new Date();
  const monthNames = language === "bn"
    ? ["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"]
    : ["January","February","March","April","May","June","July","August","September","October","November","December"];
  const dayNames = language === "bn"
    ? ["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"]
    : ["Sunday","Monday","Tuesday","Wednesday","Thursday","Friday","Saturday"];
  const bnDate = `${dayNames[today.getDay()]}, ${today.getDate()} ${monthNames[today.getMonth()]}`;

  return (
    <header className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] text-white pt-safe sticky top-0 z-20">
      <div className="px-4 pt-3 pb-4 max-w-[480px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center shrink-0 overflow-hidden">
              { }
              <img src="/logo.png" alt="logo" className="w-full h-full object-cover" />
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold leading-tight truncate">{t("appName")}</h1>
              <p className="text-white/70 text-[11px] leading-tight">প্রাইভেট লিমিটেড</p>
            </div>
          </div>
          <div className="flex items-center gap-1.5">
            {/* Language toggle */}
            <button
              onClick={() => setLanguage(language === "bn" ? "en" : "bn")}
              className="px-2.5 py-1.5 rounded-lg bg-white/10 text-white text-xs font-semibold active:scale-90 transition"
              aria-label="Language"
            >
              {language === "bn" ? "EN" : "বাং"}
            </button>
            <button
              onClick={() => openModal("notifications")}
              className="relative p-2 rounded-full bg-white/10 active:scale-90 transition min-w-[36px] min-h-[36px] flex items-center justify-center"
              aria-label={t("notifications")}
            >
              <Bell className="w-5 h-5" />
              <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#1B5E20]" />
            </button>
          </div>
        </div>
        <p className="text-white/70 text-xs mt-2">{bnDate}</p>
      </div>
    </header>
  );
}

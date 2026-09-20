"use client";

import { useRouter } from "next/navigation";
import { ArrowLeft, Bell } from "lucide-react";
import { useAppStore } from "@/store/use-app-store";
import { COMPANY_NAME } from "@/lib/constants";

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
  const { openModal } = useAppStore();
  return (
    <header
      className={
        green
          ? "bg-gradient-to-r from-[#1B5E20] to-[#2E7D32] text-white"
          : "bg-card text-foreground border-b border-border"
      }
    >
      <div className="px-4 pt-3 pb-3 flex items-center gap-2 max-w-[480px] mx-auto">
        {showBack && (
          <button
            onClick={() => window.history.back()}
            className="-ml-1 p-1 rounded-full active:scale-90 transition"
            aria-label="পেছনে"
          >
            <ArrowLeft className="w-6 h-6" />
          </button>
        )}
        <div className="flex-1 min-w-0">
          <h1 className="text-base font-bold leading-tight truncate">{title}</h1>
          {subtitle && <p className={green ? "text-white/75 text-xs" : "text-muted-foreground text-xs"}>{subtitle}</p>}
        </div>
        {rightSlot}
        {showBell && (
          <button
            onClick={() => onBell?.() ?? openModal("notifications")}
            className="relative p-1.5 rounded-full active:scale-90 transition"
            aria-label="নোটিফিকেশন"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1 right-1 w-2 h-2 rounded-full bg-amber-400" />
          </button>
        )}
      </div>
    </header>
  );
}

export function MainHeader() {
  const { session, openModal } = useAppStore();
  const today = new Date();
  const bnDate = `${["রবিবার","সোমবার","মঙ্গলবার","বুধবার","বৃহস্পতিবার","শুক্রবার","শনিবার"][today.getDay()]}, ${today.getDate()} ${["জানুয়ারি","ফেব্রুয়ারি","মার্চ","এপ্রিল","মে","জুন","জুলাই","আগস্ট","সেপ্টেম্বর","অক্টোবর","নভেম্বর","ডিসেম্বর"][today.getMonth()]}`;
  return (
    <header className="bg-gradient-to-r from-[#1B5E20] via-[#2E7D32] to-[#1B5E20] text-white pt-safe">
      <div className="px-4 pt-3 pb-4 max-w-[480px] mx-auto">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-white/15 backdrop-blur flex items-center justify-center text-lg shrink-0">
              🌿
            </div>
            <div className="min-w-0">
              <h1 className="text-[15px] font-bold leading-tight truncate">ইসমা গুড়া মসলা</h1>
              <p className="text-white/70 text-[11px] leading-tight">প্রাইভেট লিমিটেড</p>
            </div>
          </div>
          <button
            onClick={() => openModal("notifications")}
            className="relative p-2 rounded-full bg-white/10 active:scale-90 transition"
            aria-label="নোটিফিকেশন"
          >
            <Bell className="w-5 h-5" />
            <span className="absolute top-1.5 right-1.5 w-2 h-2 rounded-full bg-amber-400 ring-2 ring-[#1B5E20]" />
          </button>
        </div>
        <p className="text-white/70 text-xs mt-2">{bnDate}</p>
      </div>
    </header>
  );
}

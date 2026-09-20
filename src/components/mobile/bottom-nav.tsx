"use client";

import { Home, Receipt, Package, BarChart3, User } from "lucide-react";
import { motion } from "framer-motion";
import { useAppStore, type TabKey } from "@/store/use-app-store";
import { cn } from "@/lib/utils";

const TABS: { key: TabKey; label: string; icon: typeof Home }[] = [
  { key: "home", label: "হোম", icon: Home },
  { key: "transactions", label: "লেনদেন", icon: Receipt },
  { key: "stock", label: "স্টক", icon: Package },
  { key: "reports", label: "রিপোর্ট", icon: BarChart3 },
  { key: "profile", label: "প্রোফাইল", icon: User },
];

export function BottomNav() {
  const { activeTab, setActiveTab } = useAppStore();

  return (
    <nav className="sticky bottom-0 z-30 bg-white/95 dark:bg-card/95 backdrop-blur border-t border-border pb-safe">
      <div className="grid grid-cols-5 max-w-[480px] mx-auto">
        {TABS.map((t) => {
          const active = activeTab === t.key;
          const Icon = t.icon;
          return (
            <button
              key={t.key}
              onClick={() => setActiveTab(t.key)}
              className="relative flex flex-col items-center justify-center gap-1 py-2.5 px-1 active:scale-95 transition-transform"
            >
              {active && (
                <motion.span
                  layoutId="navIndicator"
                  className="absolute top-0 h-1 w-8 rounded-full bg-primary"
                  transition={{ type: "spring", stiffness: 400, damping: 30 }}
                />
              )}
              <Icon
                className={cn(
                  "w-[22px] h-[22px] transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
                strokeWidth={active ? 2.5 : 2}
              />
              <span
                className={cn(
                  "text-[10px] leading-none font-medium transition-colors",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                {t.label}
              </span>
            </button>
          );
        })}
      </div>
    </nav>
  );
}

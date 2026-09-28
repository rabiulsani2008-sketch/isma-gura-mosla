"use client";

import { useQuery } from "@tanstack/react-query";
import { Store, Shield, Database, Download, Bell, Globe, DollarSign, Moon, LogOut, ChevronRight, Users, KeyRound } from "lucide-react";
import { AppHeader } from "@/components/mobile/app-header";
import { LoadingState } from "@/components/shared/states";
import { useAppStore } from "@/store/use-app-store";
import { useT } from "@/lib/use-i18n";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import { toast } from "sonner";

export function ProfileScreen() {
  const t = useT();
  const { session, openModal, darkMode, toggleDarkMode, logout, language, setLanguage } = useAppStore();
  const { data, isLoading } = useQuery({ queryKey: ["shop"], queryFn: () => fetch("/api/shop").then((r) => r.json()) });

  const items = [
    { icon: Store, label: t("shopInfo"), color: "#1B5E20", bg: "#E8F5E9", action: () => openModal("shop_setup") },
    { icon: Database, label: t("backup"), color: "#E65100", bg: "#FFF3E0", action: () => openModal("backup") },
    { icon: Download, label: t("export"), color: "#8E24AA", bg: "#F3E5F5", action: () => openModal("backup") },
    { icon: Bell, label: t("notificationSettings"), color: "#F57C00", bg: "#FFF3E0", action: () => openModal("notifications") },
    { icon: Globe, label: t("language"), color: "#00838F", bg: "#E0F7FA", action: () => openModal("language"), value: language === "bn" ? "বাংলা" : "English" },
    { icon: DollarSign, label: t("currency"), color: "#43A047", bg: "#E8F5E9", action: () => toast.info(t("currencyTaka")), value: "৳ BDT" },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title={t("profile")} subtitle={t("accountSecurity")} />
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-28">
        {/* Profile header */}
        <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white px-4 pt-4 pb-8">
          <div className="flex items-center gap-3 max-w-[480px] mx-auto">
            <div className="w-16 h-16 rounded-full bg-white flex items-center justify-center overflow-hidden p-1">
              { }
              <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
            </div>
            <div className="min-w-0 flex-1">
              <p className="text-base font-bold leading-tight truncate">{t("appName")}</p>
              <p className="text-white/75 text-[11px] mt-0.5">{t("tagline")}</p>
              <p className="text-white/60 text-[10px] mt-1">{session?.userName} • {data?.shop?.phone || session?.userId}</p>
            </div>
          </div>
        </div>

        {isLoading ? <LoadingState /> : (
          <div className="px-3 -mt-4">
            {/* Stats */}
            <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">{t("owner")}</p>
                <p className="text-xs font-semibold truncate">{data?.shop?.ownerName || "—"}</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-[10px] text-muted-foreground">{t("currency")}</p>
                <p className="text-xs font-semibold">৳ BDT</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">{t("version")}</p>
                <p className="text-xs font-semibold">v2.0.0</p>
              </div>
            </div>

            {/* Settings list */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden mb-3">
              {items.map((it, i) => (
                <button key={it.label} onClick={it.action} className={`w-full flex items-center gap-3 px-4 py-3.5 ${i > 0 ? "border-t border-border/50" : ""} active:bg-muted/50 transition min-h-[52px]`}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: it.bg }}>
                    <it.icon className="w-4 h-4" style={{ color: it.color }} />
                  </span>
                  <span className="flex-1 text-left text-sm font-medium text-foreground">{it.label}</span>
                  {it.value && <span className="text-xs text-muted-foreground">{it.value}</span>}
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Dark mode toggle */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden mb-3">
              <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-3.5 active:bg-muted/50 transition min-h-[52px]">
                <span className="w-9 h-9 rounded-xl bg-[#1A237E] flex items-center justify-center shrink-0">
                  <Moon className="w-4 h-4 text-white" />
                </span>
                <span className="flex-1 text-left text-sm font-medium">{t("darkMode")}</span>
                <div className={`w-11 h-6 rounded-full p-0.5 transition shrink-0 ${darkMode ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </div>

            {/* Logout */}
            <button onClick={() => { if (confirm(t("confirmLogout"))) logout(); }} className="w-full bg-white dark:bg-card rounded-2xl border border-red-200 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-600 active:scale-[0.98] mb-3">
              <LogOut className="w-4 h-4" /> {t("logout")}
            </button>

            <p className="text-center text-[10px] text-muted-foreground pb-2">
              © {new Date().getFullYear()} {COMPANY_NAME}
              <br />{t("rightsReserved")}
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

"use client";

import { useQuery } from "@tanstack/react-query";
import { Store, Shield, Database, Download, Bell, Globe, DollarSign, Moon, LogOut, ChevronRight, User } from "lucide-react";
import { AppHeader } from "@/components/mobile/app-header";
import { LoadingState } from "@/components/shared/states";
import { useAppStore } from "@/store/use-app-store";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import { toast } from "sonner";

export function ProfileScreen() {
  const { session, openModal, darkMode, toggleDarkMode, logout } = useAppStore();
  const { data, isLoading } = useQuery({ queryKey: ["shop"], queryFn: () => fetch("/api/shop").then((r) => r.json()) });

  const items = [
    { icon: Store, label: "দোকানের তথ্য", color: "#1B5E20", bg: "#E8F5E9", action: () => openModal("shop_setup") },
    { icon: Shield, label: "অ্যাকাউন্ট ও নিরাপত্তা", color: "#1565C0", bg: "#E3F2FD", action: () => toast.info("শীঘ্রই আসছে") },
    { icon: Database, label: "ব্যাকআপ", color: "#E65100", bg: "#FFF3E0", action: () => openModal("backup") },
    { icon: Download, label: "এক্সপোর্ট", color: "#8E24AA", bg: "#F3E5F5", action: () => openModal("backup") },
    { icon: Bell, label: "নোটিফিকেশন সেটিংস", color: "#F57C00", bg: "#FFF3E0", action: () => toast.info("নোটিফিকেশন চালু আছে") },
    { icon: Globe, label: "ভাষা", color: "#00838F", bg: "#E0F7FA", action: () => toast.info("বাংলা (ডিফল্ট)") },
    { icon: DollarSign, label: "মুদ্রা", color: "#43A047", bg: "#E8F5E9", action: () => toast.info("৳ টাকা (BDT)") },
  ];

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="প্রোফাইল" subtitle="অ্যাকাউন্ট ও সেটিংস" />
      <div className="flex-1 overflow-y-auto scrollbar-thin pb-28">
        {/* Profile header */}
        <div className="bg-gradient-to-br from-[#1B5E20] to-[#2E7D32] text-white px-4 pt-4 pb-8">
          <div className="flex items-center gap-3 max-w-[480px] mx-auto">
            <div className="w-16 h-16 rounded-2xl bg-white/15 backdrop-blur flex items-center justify-center text-3xl">🌿</div>
            <div className="min-w-0">
              <p className="text-base font-bold leading-tight">{COMPANY_NAME}</p>
              <p className="text-white/75 text-[11px] mt-0.5">{COMPANY_TAGLINE}</p>
              <p className="text-white/60 text-[10px] mt-1">{session?.userName} • {data?.shop?.phone || ""}</p>
            </div>
          </div>
        </div>

        {isLoading ? <LoadingState /> : (
          <div className="px-3 -mt-4">
            {/* Stats */}
            <div className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 grid grid-cols-3 gap-2 mb-3">
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">মালিক</p>
                <p className="text-xs font-semibold truncate">{data?.shop?.ownerName || "—"}</p>
              </div>
              <div className="text-center border-x border-border/50">
                <p className="text-[10px] text-muted-foreground">মুদ্রা</p>
                <p className="text-xs font-semibold">৳ BDT</p>
              </div>
              <div className="text-center">
                <p className="text-[10px] text-muted-foreground">ভার্সন</p>
                <p className="text-xs font-semibold">v1.0.0</p>
              </div>
            </div>

            {/* Settings list */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden mb-3">
              {items.map((it, i) => (
                <button key={it.label} onClick={it.action} className={`w-full flex items-center gap-3 px-4 py-3 ${i > 0 ? "border-t border-border/50" : ""} active:bg-muted/50 transition`}>
                  <span className="w-9 h-9 rounded-xl flex items-center justify-center shrink-0" style={{ background: it.bg }}><it.icon className="w-4 h-4" style={{ color: it.color }} /></span>
                  <span className="flex-1 text-left text-sm font-medium text-foreground">{it.label}</span>
                  <ChevronRight className="w-4 h-4 text-muted-foreground" />
                </button>
              ))}
            </div>

            {/* Dark mode toggle */}
            <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden mb-3">
              <button onClick={toggleDarkMode} className="w-full flex items-center gap-3 px-4 py-3.5">
                <span className="w-9 h-9 rounded-xl bg-[#1A237E] flex items-center justify-center"><Moon className="w-4 h-4 text-white" /></span>
                <span className="flex-1 text-left text-sm font-medium">ডার্ক মোড</span>
                <div className={`w-11 h-6 rounded-full p-0.5 transition ${darkMode ? "bg-primary" : "bg-muted"}`}>
                  <div className={`w-5 h-5 rounded-full bg-white shadow transition-transform ${darkMode ? "translate-x-5" : ""}`} />
                </div>
              </button>
            </div>

            {/* Logout */}
            <button onClick={() => { if (confirm("লগআউট করতে চান?")) logout(); }} className="w-full bg-white dark:bg-card rounded-2xl border border-red-200 flex items-center justify-center gap-2 py-3.5 text-sm font-semibold text-red-600 active:scale-[0.98] mb-3">
              <LogOut className="w-4 h-4" /> লগআউট
            </button>

            <p className="text-center text-[10px] text-muted-foreground pb-2">
              © {new Date().getFullYear()} {COMPANY_NAME}
              <br />সর্বস্বত্ব সংরক্ষিত
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

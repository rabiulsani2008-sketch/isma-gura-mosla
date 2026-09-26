"use client";

import { useEffect, useRef } from "react";
import { useAppStore } from "@/store/use-app-store";
import { BottomNav } from "@/components/mobile/bottom-nav";
import { DashboardScreen } from "@/components/screens/dashboard-screen";
import { TransactionsScreen } from "@/components/screens/transactions-screen";
import { StockScreen } from "@/components/screens/stock-screen";
import { ReportsScreen } from "@/components/screens/reports-screen";
import { ProfileScreen } from "@/components/screens/profile-screen";
import { ModalHost } from "@/components/mobile/modal-host";
import { QuickActionFab } from "@/components/mobile/quick-action-fab";

export function AppShell() {
  const { activeTab } = useAppStore();
  const scrollRef = useRef<HTMLDivElement>(null);

  // Scroll to top whenever the active tab changes
  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTo(0, 0);
    }
    // Also scroll the window/body to top as fallback
    window.scrollTo(0, 0);
  }, [activeTab]);

  return (
    <div className="mobile-shell flex flex-col min-h-screen">
      <div ref={scrollRef} className="flex-1 flex flex-col overflow-hidden" key={activeTab}>
        {activeTab === "home" && <DashboardScreen />}
        {activeTab === "transactions" && <TransactionsScreen />}
        {activeTab === "stock" && <StockScreen />}
        {activeTab === "reports" && <ReportsScreen />}
        {activeTab === "profile" && <ProfileScreen />}
      </div>
      <QuickActionFab />
      <BottomNav />
      <ModalHost />
    </div>
  );
}

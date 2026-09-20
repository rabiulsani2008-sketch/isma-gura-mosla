"use client";

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

  return (
    <div className="mobile-shell flex flex-col min-h-screen">
      <div className="flex-1 flex flex-col overflow-hidden">
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

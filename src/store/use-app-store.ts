"use client";

import { create } from "zustand";

export type TabKey = "home" | "transactions" | "stock" | "reports" | "profile";

export type ModalKey =
  | null
  | "sale"
  | "purchase"
  | "expense"
  | "receive_payment"
  | "pay_payment"
  | "add_product"
  | "edit_product"
  | "add_customer"
  | "add_supplier"
  | "stock_adjustment"
  | "stock_history"
  | "invoice"
  | "customer_details"
  | "supplier_details"
  | "sale_history"
  | "shop_setup"
  | "backup"
  | "notifications"
  | "transactions_filter";

interface Session {
  shopId: string;
  userId: string;
  shopName: string;
  userName: string;
}

interface AppState {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;

  activeModal: ModalKey;
  openModal: (m: ModalKey) => void;
  closeModal: () => void;

  modalPayload: any;
  setModalPayload: (p: any) => void;

  session: Session | null;
  setSession: (s: Session | null) => void;
  logout: () => void;

  phase: "splash" | "auth" | "app";
  setPhase: (p: AppState["phase"]) => void;

  refreshTick: number;
  bumpRefresh: () => void;

  darkMode: boolean;
  toggleDarkMode: () => void;
  setDarkMode: (v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: "home",
  setActiveTab: (t) => set({ activeTab: t }),

  activeModal: null,
  openModal: (m) => set({ activeModal: m }),
  closeModal: () => set({ activeModal: null, modalPayload: null }),

  modalPayload: null,
  setModalPayload: (p) => set({ modalPayload: p }),

  session: null,
  setSession: (s) => set({ session: s }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isma_client_session");
    }
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ session: null, phase: "auth", activeTab: "home", activeModal: null });
  },

  phase: "splash",
  setPhase: (p) => set({ phase: p }),

  refreshTick: 0,
  bumpRefresh: () => set({ refreshTick: get().refreshTick + 1 }),

  darkMode: false,
  toggleDarkMode: () => {
    const next = !get().darkMode;
    set({ darkMode: next });
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", next);
      localStorage.setItem("isma_dark", next ? "1" : "0");
    }
  },
  setDarkMode: (v) => {
    set({ darkMode: v });
    if (typeof window !== "undefined") {
      document.documentElement.classList.toggle("dark", v);
      localStorage.setItem("isma_dark", v ? "1" : "0");
    }
  },
}));

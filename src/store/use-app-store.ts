"use client";

import { create } from "zustand";
import type { Lang } from "@/lib/i18n";

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
  | "transactions_filter"
  | "register"
  | "change_password"
  | "members"
  | "language"
  | "account_security";

interface Session {
  shopId: string;
  userId: string;
  shopName: string;
  userName: string;
  role: string;
}

interface AppState {
  activeTab: TabKey;
  setActiveTab: (t: TabKey) => void;

  // In-app navigation stack (for back button). Each entry is a tab or modal.
  navStack: (TabKey | "modal")[];
  pushNav: (entry: TabKey | "modal") => void;
  goBack: () => void;
  canGoBack: () => boolean;

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

  language: Lang;
  setLanguage: (l: Lang) => void;

  // Notification settings (persisted)
  notifLowStock: boolean;
  notifCustomerDue: boolean;
  notifSupplierDue: boolean;
  notifDaily: boolean;
  setNotif: (key: "notifLowStock" | "notifCustomerDue" | "notifSupplierDue" | "notifDaily", v: boolean) => void;
}

export const useAppStore = create<AppState>((set, get) => ({
  activeTab: "home",
  setActiveTab: (t) => {
    const stack = get().navStack;
    // Keep a lightweight back stack: push previous tab unless it's the same
    if (stack[stack.length - 1] !== t && stack[stack.length - 1] !== "modal") {
      set({ activeTab: t, navStack: [...stack, t].slice(-20) });
    } else {
      set({ activeTab: t });
    }
  },

  navStack: [],
  pushNav: (entry) => set({ navStack: [...get().navStack, entry].slice(-20) }),
  goBack: () => {
    const state = get();
    // Priority 1: close open modal
    if (state.activeModal) {
      state.closeModal();
      return;
    }
    // Priority 2: go to previous tab
    const stack = [...state.navStack];
    if (stack.length > 1) {
      stack.pop();
      const prev = stack[stack.length - 1];
      if (prev !== "modal") {
        set({ navStack: stack, activeTab: prev as TabKey });
        return;
      }
    }
    // Priority 3: if not home, go home
    if (state.activeTab !== "home") {
      set({ activeTab: "home", navStack: ["home"] });
      return;
    }
    // Priority 4: on home, do nothing (don't exit app)
  },
  canGoBack: () => {
    const s = get();
    return !!s.activeModal || s.navStack.length > 1 || s.activeTab !== "home";
  },

  activeModal: null,
  openModal: (m) => {
    const stack = get().navStack;
    set({ activeModal: m, navStack: [...stack, "modal"].slice(-20) });
  },
  closeModal: () => {
    const stack = [...get().navStack];
    // remove trailing "modal" entries
    while (stack.length && stack[stack.length - 1] === "modal") stack.pop();
    set({ activeModal: null, modalPayload: null, navStack: stack });
  },

  modalPayload: null,
  setModalPayload: (p) => set({ modalPayload: p }),

  session: null,
  setSession: (s) => set({ session: s }),
  logout: () => {
    if (typeof window !== "undefined") {
      localStorage.removeItem("isma_client_session");
    }
    fetch("/api/auth/logout", { method: "POST" }).catch(() => {});
    set({ session: null, phase: "auth", activeTab: "home", activeModal: null, navStack: [] });
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

  language: "bn",
  setLanguage: (l) => {
    set({ language: l });
    if (typeof window !== "undefined") {
      localStorage.setItem("isma_lang", l);
      document.documentElement.lang = l === "bn" ? "bn" : "en";
    }
  },

  notifLowStock: true,
  notifCustomerDue: true,
  notifSupplierDue: true,
  notifDaily: false,
  setNotif: (key, v) => {
    set({ [key]: v } as any);
    if (typeof window !== "undefined") {
      localStorage.setItem(`isma_${key}`, v ? "1" : "0");
    }
  },
}));

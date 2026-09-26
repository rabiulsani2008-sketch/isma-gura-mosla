"use client";

import { create } from "zustand";

export interface CartItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  costPrice: number;
  quantity: number;
  available: number;
  imageUrl?: string | null;
}

interface SaleCartState {
  items: CartItem[];
  customerId: string | null;
  customerName: string;
  paymentMethod: string;
  discount: number;
  paidAmount: number | "";

  addItem: (item: CartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  setUnitPrice: (productId: string, price: number) => void;
  setCustomer: (id: string | null, name: string) => void;
  setPaymentMethod: (m: string) => void;
  setDiscount: (d: number) => void;
  setPaidAmount: (a: number | "") => void;
  clear: () => void;

  subtotal: () => number;
  total: () => number;
  due: () => number;
}

export const useSaleCart = create<SaleCartState>((set, get) => ({
  items: [],
  customerId: null,
  customerName: "",
  paymentMethod: "নগদ",
  discount: 0,
  paidAmount: "",

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      if (existing.quantity + 1 > item.available) return;
      set({
        items: items.map((i) =>
          i.productId === item.productId ? { ...i, quantity: i.quantity + 1 } : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },
  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),
  setQuantity: (productId, qty) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId
          ? { ...i, quantity: Math.max(0.001, Math.min(qty, i.available)) }
          : i
      ),
    }),
  setUnitPrice: (productId, price) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, unitPrice: Math.max(0, price) } : i
      ),
    }),
  setCustomer: (id, name) => set({ customerId: id, customerName: name }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setDiscount: (d) => set({ discount: Math.max(0, d) }),
  setPaidAmount: (a) => set({ paidAmount: a }),
  clear: () =>
    set({
      items: [],
      customerId: null,
      customerName: "",
      paymentMethod: "নগদ",
      discount: 0,
      paidAmount: "",
    }),

  subtotal: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  total: () => Math.max(0, get().subtotal() - get().discount),
  due: () => {
    const paid = typeof get().paidAmount === "number" ? get().paidAmount : 0;
    return Math.max(0, get().total() - paid);
  },
}));

// ===== Purchase Cart =====

interface PurchaseCartItem {
  productId: string;
  name: string;
  unit: string;
  unitPrice: number;
  quantity: number;
  available: number;
}

interface PurchaseCartState {
  items: PurchaseCartItem[];
  supplierId: string | null;
  supplierName: string;
  paymentMethod: string;
  paidAmount: number | "";

  addItem: (item: PurchaseCartItem) => void;
  removeItem: (productId: string) => void;
  setQuantity: (productId: string, qty: number) => void;
  setUnitPrice: (productId: string, price: number) => void;
  setSupplier: (id: string | null, name: string) => void;
  setPaymentMethod: (m: string) => void;
  setPaidAmount: (a: number | "") => void;
  clear: () => void;

  total: () => number;
  due: () => number;
}

export const usePurchaseCart = create<PurchaseCartState>((set, get) => ({
  items: [],
  supplierId: null,
  supplierName: "",
  paymentMethod: "নগদ",
  paidAmount: "",

  addItem: (item) => {
    const items = get().items;
    const existing = items.find((i) => i.productId === item.productId);
    if (existing) {
      set({
        items: items.map((i) =>
          i.productId === item.productId
            ? { ...i, quantity: i.quantity + 1 }
            : i
        ),
      });
    } else {
      set({ items: [...items, { ...item, quantity: 1 }] });
    }
  },
  removeItem: (productId) =>
    set({ items: get().items.filter((i) => i.productId !== productId) }),
  setQuantity: (productId, qty) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, quantity: Math.max(0.001, qty) } : i
      ),
    }),
  setUnitPrice: (productId, price) =>
    set({
      items: get().items.map((i) =>
        i.productId === productId ? { ...i, unitPrice: Math.max(0, price) } : i
      ),
    }),
  setSupplier: (id, name) => set({ supplierId: id, supplierName: name }),
  setPaymentMethod: (m) => set({ paymentMethod: m }),
  setPaidAmount: (a) => set({ paidAmount: a }),
  clear: () =>
    set({
      items: [],
      supplierId: null,
      supplierName: "",
      paymentMethod: "নগদ",
      paidAmount: "",
    }),

  total: () => get().items.reduce((s, i) => s + i.unitPrice * i.quantity, 0),
  due: () => {
    const paid = typeof get().paidAmount === "number" ? get().paidAmount : 0;
    return Math.max(0, get().total() - paid);
  },
}));

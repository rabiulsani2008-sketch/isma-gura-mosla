"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, Loader2, UserPlus } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { usePurchaseCart } from "@/store/use-cart";
import { useAppStore } from "@/store/use-app-store";
import { formatTk, toBnDigits } from "@/lib/format";
import { PAYMENT_METHODS } from "@/lib/constants";
import { toast } from "sonner";

async function fetchProducts() {
  const r = await fetch("/api/products");
  return r.json();
}
async function fetchSuppliers() {
  const r = await fetch("/api/suppliers");
  return r.json();
}

export function PurchaseModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [showCart, setShowCart] = useState(false);
  const [showSupPicker, setShowSupPicker] = useState(false);
  const [supSearch, setSupSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: prodData } = useQuery({ queryKey: ["products", search], queryFn: fetchProducts, enabled: open });
  const { data: supData } = useQuery({ queryKey: ["suppliers"], queryFn: fetchSuppliers, enabled: open });
  const qc = useQueryClient();
  const cart = usePurchaseCart();
  const { bumpRefresh, openModal } = useAppStore();

  const products = prodData?.products || [];
  const suppliers = (supData?.suppliers || []).filter((s: any) => !supSearch || s.name.includes(supSearch) || s.phone.includes(supSearch));

  const addToCart = (p: any) => {
    cart.addItem({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      unitPrice: p.purchasePrice,
      quantity: 1,
      available: 9999,
    });
    toast.success(`${p.name} যোগ হয়েছে`);
  };

  const submit = async () => {
    if (cart.items.length === 0) return toast.error("কার্টে অন্তত একটি পণ্য দিন");
    setSubmitting(true);
    try {
      const res = await fetch("/api/purchases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
          supplierId: cart.supplierId,
          paidAmount: typeof cart.paidAmount === "number" ? cart.paidAmount : cart.total(),
          paymentMethod: cart.paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ক্রয় ব্যর্থ");
      toast.success("ক্রয় সফলভাবে সংরক্ষণ হয়েছে।");
      cart.clear();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      bumpRefresh();
      onClose();
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalSheet
      open={open}
      onClose={() => { cart.clear(); onClose(); }}
      title="পণ্য ক্রয়"
      subtitle={`কার্টে ${toBnDigits(cart.items.length)} পণ্য • ${formatTk(cart.total())}`}
      fullScreen
      footer={
        cart.items.length > 0 ? (
          <div className="flex gap-2">
            <button onClick={() => setShowCart((v) => !v)} className="flex-1 border border-primary text-primary font-semibold py-3 rounded-xl text-sm">
              {showCart ? "পণ্য বাছাই" : `কার্ট (${toBnDigits(cart.items.length)})`}
            </button>
            <button onClick={submit} disabled={submitting} className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-60">
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "কেনা সংরক্ষণ করুন"}
            </button>
          </div>
        ) : <p className="text-center text-xs text-muted-foreground py-2">পণ্য বাছাই করতে + বোতামে ট্যাপ করুন</p>
      }
    >
      {!showCart ? (
        <div className="p-4 space-y-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder="পণ্যের নাম লিখুন..." className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary" />
          </div>
          <div className="space-y-2">
            {products.length === 0 ? <p className="text-center text-sm text-muted-foreground py-8">কোনো পণ্য পাওয়া যায়নি</p> : products.map((p: any) => (
              <div key={p.id} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 flex items-center gap-3">
                <div className="w-12 h-12 rounded-xl bg-[#E3F2FD] flex items-center justify-center text-xl">📦</div>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-semibold truncate">{p.name}</p>
                  <p className="text-[11px] text-muted-foreground">ক্রয়: {formatTk(p.purchasePrice)}/{p.unit}</p>
                  <p className="text-[10px] text-muted-foreground">বর্তমান স্টক: {toBnDigits(p.stockQuantity)} {p.unit}</p>
                </div>
                <button onClick={() => addToCart(p)} className="w-9 h-9 rounded-full bg-[#1976D2] text-white flex items-center justify-center active:scale-90">
                  <Plus className="w-5 h-5" />
                </button>
              </div>
            ))}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">সরবরাহকারী</label>
            {!showSupPicker ? (
              <div className="flex gap-2">
                <button onClick={() => setShowSupPicker(true)} className="flex-1 bg-white dark:bg-card border border-input rounded-xl px-3 py-2.5 text-left text-sm">
                  {cart.supplierName || "সরবরাহকারী নির্বাচন করুন"}
                </button>
                <button onClick={() => { onClose(); openModal("add_supplier"); }} className="bg-primary text-primary-foreground rounded-xl px-3 flex items-center gap-1 text-xs font-medium">
                  <UserPlus className="w-4 h-4" /> নতুন
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-card border border-input rounded-xl overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input autoFocus value={supSearch} onChange={(e) => setSupSearch(e.target.value)} placeholder="নাম বা ফোন..." className="w-full px-2 py-1.5 text-sm outline-none" />
                </div>
                <div className="max-h-52 overflow-y-auto scrollbar-thin">
                  <button onClick={() => { cart.setSupplier(null, "সাধারণ"); setShowSupPicker(false); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b border-border">সাধারণ ক্রয়</button>
                  {suppliers.map((s: any) => (
                    <button key={s.id} onClick={() => { cart.setSupplier(s.id, s.name); setShowSupPicker(false); }} className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b border-border">
                      <p className="font-medium">{s.name}</p>
                      <p className="text-[11px] text-muted-foreground">{s.phone}{s.due > 0 ? ` • দেনা: ${formatTk(s.due)}` : ""}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          <div className="space-y-2">
            {cart.items.map((it) => (
              <div key={it.productId} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <p className="text-sm font-semibold">{it.name}</p>
                  <button onClick={() => cart.removeItem(it.productId)} className="text-red-500 p-1"><Trash2 className="w-4 h-4" /></button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => cart.setQuantity(it.productId, it.quantity - 1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Minus className="w-3.5 h-3.5" /></button>
                    <input type="number" value={it.quantity} onChange={(e) => cart.setQuantity(it.productId, Number(e.target.value) || 1)} className="w-12 text-center text-sm bg-background rounded-lg py-1 border border-input outline-none" />
                    <button onClick={() => cart.setQuantity(it.productId, it.quantity + 1)} className="w-7 h-7 rounded-lg bg-muted flex items-center justify-center"><Plus className="w-3.5 h-3.5" /></button>
                    <span className="text-[11px] text-muted-foreground ml-1">{it.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">৳</span>
                    <input type="number" value={it.unitPrice} onChange={(e) => cart.setUnitPrice(it.productId, Number(e.target.value) || 0)} className="w-16 text-right text-sm bg-background rounded-lg py-1 border border-input outline-none" />
                  </div>
                </div>
                <p className="text-right text-sm font-semibold text-[#1565C0] mt-1">{formatTk(it.unitPrice * it.quantity)}</p>
              </div>
            ))}
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-3.5 border border-border/50">
            <div className="flex justify-between text-base font-bold">
              <span>মোট ক্রয়</span>
              <span className="text-[#1565C0]">{formatTk(cart.total())}</span>
            </div>
          </div>

          <div className="bg-white dark:bg-card rounded-2xl p-3.5 border border-border/50 space-y-3">
            <div>
              <label className="text-xs font-medium mb-1.5 block">পরিশোধ পদ্ধতি</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button key={m} onClick={() => cart.setPaymentMethod(m === "বাকিতে" ? "বাকি" : m)} className={`py-2 rounded-lg text-[11px] font-medium ${cart.paymentMethod === (m === "বাকিতে" ? "বাকি" : m) ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{m}</button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium mb-1.5 block">পরিশোধিত টাকা</label>
              <input type="number" value={cart.paidAmount} onChange={(e) => cart.setPaidAmount(e.target.value === "" ? "" : Number(e.target.value))} placeholder={String(cart.total())} className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary" />
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => cart.setPaidAmount(cart.total())} className="flex-1 bg-[#E8F5E9] text-primary text-[11px] font-medium py-1.5 rounded-lg">পুরো পরিশোধ</button>
                <button onClick={() => cart.setPaidAmount(0)} className="flex-1 bg-[#FFEBEE] text-red-600 text-[11px] font-medium py-1.5 rounded-lg">বাকিতে</button>
              </div>
            </div>
            {cart.due() > 0 && (
              <div className="flex justify-between text-sm bg-amber-50 dark:bg-amber-950/30 px-3 py-2 rounded-lg">
                <span className="text-amber-700 dark:text-amber-400">বকেয়া</span>
                <span className="font-bold text-amber-700 dark:text-amber-400">{formatTk(cart.due())}</span>
              </div>
            )}
          </div>
        </div>
      )}
    </ModalSheet>
  );
}

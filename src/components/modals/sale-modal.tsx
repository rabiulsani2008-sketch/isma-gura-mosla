"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Minus, Trash2, ShoppingCart, Loader2, UserPlus } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useSaleCart } from "@/store/use-cart";
import { useAppStore } from "@/store/use-app-store";
import { formatTk, toBnDigits } from "@/lib/format";
import { CATEGORIES, PAYMENT_METHODS } from "@/lib/constants";
import { toast } from "sonner";

async function fetchProducts() {
  const r = await fetch("/api/products");
  return r.json();
}
async function fetchCustomers() {
  const r = await fetch("/api/customers");
  return r.json();
}

export function SaleModal({ open, onClose }: { open: boolean; onClose: () => void }) {
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("সব");
  const [showCart, setShowCart] = useState(false);
  const [showCustPicker, setShowCustPicker] = useState(false);
  const [custSearch, setCustSearch] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const { data: prodData } = useQuery({ queryKey: ["products", search, cat], queryFn: fetchProducts, enabled: open });
  const { data: custData } = useQuery({ queryKey: ["customers"], queryFn: fetchCustomers, enabled: open });
  const qc = useQueryClient();
  const cart = useSaleCart();
  const { bumpRefresh, openModal, setModalPayload } = useAppStore();

  const products = (prodData?.products || []).filter((p: any) =>
    cat === "সব" ? true : p.category?.name === cat
  );
  const customers = (custData?.customers || []).filter((c: any) =>
    !custSearch || c.name.includes(custSearch) || c.phone.includes(custSearch)
  );

  const addToCart = (p: any) => {
    if (p.stockQuantity <= 0) {
      toast.error(`${p.name}: স্টক শেষ`);
      return;
    }
    cart.addItem({
      productId: p.id,
      name: p.name,
      unit: p.unit,
      unitPrice: p.sellingPrice,
      costPrice: p.purchasePrice,
      quantity: 1,
      available: p.stockQuantity,
      imageUrl: p.imageUrl,
    });
    toast.success(`${p.name} কার্টে যোগ হয়েছে`);
  };

  const submit = async () => {
    if (cart.items.length === 0) {
      toast.error("কার্টে অন্তত একটি পণ্য দিন");
      return;
    }
    setSubmitting(true);
    try {
      const res = await fetch("/api/sales", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          items: cart.items.map((i) => ({ productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice })),
          customerId: cart.customerId,
          discount: cart.discount,
          paidAmount: typeof cart.paidAmount === "number" ? cart.paidAmount : cart.total(),
          paymentMethod: cart.paymentMethod,
        }),
      });
      const data = await res.json();
      if (!res.ok) {
        toast.error(data.error || "বিক্রি ব্যর্থ হয়েছে");
        return;
      }
      toast.success("বিক্রি সফলভাবে সংরক্ষণ হয়েছে।");
      // Open invoice
      const saleId = data.sale.id;
      cart.clear();
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["transactions"] });
      bumpRefresh();
      onClose();
      setModalPayload({ saleId });
      openModal("invoice");
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
      title="বিক্রি করুন"
      subtitle={`কার্টে ${toBnDigits(cart.items.length)} পণ্য • ${formatTk(cart.total())}`}
      fullScreen
      footer={
        cart.items.length > 0 ? (
          <div className="flex gap-2">
            <button
              onClick={() => setShowCart((v) => !v)}
              className="flex-1 border border-primary text-primary font-semibold py-3 rounded-xl text-sm"
            >
              {showCart ? "পণ্য বাছাই" : `কার্ট দেখুন (${toBnDigits(cart.items.length)})`}
            </button>
            <button
              onClick={submit}
              disabled={submitting}
              className="flex-1 bg-primary text-primary-foreground font-semibold py-3 rounded-xl text-sm flex items-center justify-center gap-1.5 disabled:opacity-60"
            >
              {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "বিক্রি সম্পন্ন করুন"}
            </button>
          </div>
        ) : (
          <p className="text-center text-xs text-muted-foreground py-2">পণ্য বাছাই করতে + বোতামে ট্যাপ করুন</p>
        )
      }
    >
      {!showCart ? (
        <div className="p-4 space-y-3">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="পণ্যের নাম লিখুন..."
              className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary"
            />
          </div>
          {/* Categories */}
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar">
            {["সব", ...CATEGORIES].map((c) => (
              <button
                key={c}
                onClick={() => setCat(c)}
                className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap transition ${
                  cat === c ? "bg-primary text-primary-foreground" : "bg-white dark:bg-card border border-border text-muted-foreground"
                }`}
              >
                {c}
              </button>
            ))}
          </div>
          {/* Products */}
          <div className="space-y-2">
            {products.length === 0 ? (
              <p className="text-center text-sm text-muted-foreground py-8">কোনো পণ্য পাওয়া যায়নি</p>
            ) : (
              products.map((p: any) => (
                <div key={p.id} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50 flex items-center gap-3">
                  <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-xl shrink-0">
                    🌿
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-semibold text-foreground truncate">{p.name}</p>
                    <p className="text-[11px] text-muted-foreground">
                      {formatTk(p.sellingPrice)}/{p.unit}
                    </p>
                    <p className={`text-[10px] ${p.stockQuantity <= 0 ? "text-red-500" : p.stockQuantity <= p.minimumStock ? "text-amber-500" : "text-muted-foreground"}`}>
                      স্টক: {toBnDigits(p.stockQuantity)} {p.unit}
                    </p>
                  </div>
                  <button
                    onClick={() => addToCart(p)}
                    disabled={p.stockQuantity <= 0}
                    className="w-9 h-9 rounded-full bg-primary text-primary-foreground flex items-center justify-center active:scale-90 transition disabled:opacity-40"
                  >
                    <Plus className="w-5 h-5" />
                  </button>
                </div>
              ))
            )}
          </div>
        </div>
      ) : (
        <div className="p-4 space-y-4">
          {/* Customer */}
          <div>
            <label className="text-xs font-medium text-foreground mb-1.5 block">গ্রাহক</label>
            {!showCustPicker ? (
              <div className="flex gap-2">
                <button
                  onClick={() => setShowCustPicker(true)}
                  className="flex-1 bg-white dark:bg-card border border-input rounded-xl px-3 py-2.5 text-left text-sm text-foreground"
                >
                  {cart.customerName || "গ্রাহক নির্বাচন করুন"}
                </button>
                <button
                  onClick={() => { onClose(); openModal("add_customer"); }}
                  className="bg-primary text-primary-foreground rounded-xl px-3 flex items-center gap-1 text-xs font-medium"
                >
                  <UserPlus className="w-4 h-4" /> নতুন
                </button>
              </div>
            ) : (
              <div className="bg-white dark:bg-card border border-input rounded-xl overflow-hidden">
                <div className="p-2 border-b border-border">
                  <input
                    autoFocus
                    value={custSearch}
                    onChange={(e) => setCustSearch(e.target.value)}
                    placeholder="নাম বা ফোন লিখুন..."
                    className="w-full px-2 py-1.5 text-sm outline-none"
                  />
                </div>
                <div className="max-h-52 overflow-y-auto scrollbar-thin">
                  <button
                    onClick={() => { cart.setCustomer(null, "নগদ গ্রাহক"); setShowCustPicker(false); }}
                    className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b border-border"
                  >
                    নগদ গ্রাহক (Walk-in)
                  </button>
                  {customers.map((c: any) => (
                    <button
                      key={c.id}
                      onClick={() => { cart.setCustomer(c.id, c.name); setShowCustPicker(false); }}
                      className="w-full text-left px-3 py-2.5 text-sm hover:bg-muted border-b border-border"
                    >
                      <p className="font-medium text-foreground">{c.name}</p>
                      <p className="text-[11px] text-muted-foreground">{c.phone}{c.due > 0 ? ` • বকেয়া: ${formatTk(c.due)}` : ""}</p>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>

          {/* Cart items */}
          <div className="space-y-2">
            {cart.items.map((it) => (
              <div key={it.productId} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
                <div className="flex items-start justify-between gap-2">
                  <div className="min-w-0">
                    <p className="text-sm font-semibold text-foreground">{it.name}</p>
                    <p className="text-[11px] text-muted-foreground">{formatTk(it.unitPrice)}/{it.unit}</p>
                  </div>
                  <button onClick={() => cart.removeItem(it.productId)} className="text-red-500 p-1">
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
                <div className="mt-2 flex items-center justify-between gap-2">
                  <div className="flex items-center gap-1.5">
                    <button onClick={() => cart.setQuantity(it.productId, Math.max(0.001, it.quantity - 1))} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-90 shrink-0">
                      <Minus className="w-3.5 h-3.5" />
                    </button>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      value={it.quantity}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "");
                        const n = parseFloat(cleaned);
                        cart.setQuantity(it.productId, isNaN(n) || n <= 0 ? 1 : n);
                      }}
                      className="w-14 text-center text-sm bg-background rounded-lg py-1.5 border border-input outline-none focus:border-primary"
                    />
                    <button onClick={() => cart.setQuantity(it.productId, it.quantity + 1)} className="w-8 h-8 rounded-lg bg-muted flex items-center justify-center active:scale-90 shrink-0">
                      <Plus className="w-3.5 h-3.5" />
                    </button>
                    <span className="text-[11px] text-muted-foreground ml-1">{it.unit}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <span className="text-[10px] text-muted-foreground">৳</span>
                    <input
                      type="text"
                      inputMode="decimal"
                      pattern="[0-9.]*"
                      value={it.unitPrice}
                      onChange={(e) => {
                        const cleaned = e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "");
                        const n = parseFloat(cleaned);
                        cart.setUnitPrice(it.productId, isNaN(n) ? 0 : n);
                      }}
                      className="w-16 text-right text-sm bg-background rounded-lg py-1.5 border border-input outline-none focus:border-primary"
                    />
                  </div>
                </div>
                <p className="text-right text-sm font-semibold text-primary mt-1">{formatTk(it.unitPrice * it.quantity)}</p>
              </div>
            ))}
          </div>

          {/* Summary */}
          <div className="bg-white dark:bg-card rounded-2xl p-3.5 border border-border/50 space-y-2">
            <div className="flex justify-between text-sm">
              <span className="text-muted-foreground">সাবটোটাল</span>
              <span className="font-medium">{formatTk(cart.subtotal())}</span>
            </div>
            <div className="flex justify-between text-sm items-center">
              <span className="text-muted-foreground">ছাড়</span>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={cart.discount || ""}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "");
                  const n = parseFloat(cleaned);
                  cart.setDiscount(isNaN(n) ? 0 : n);
                }}
                placeholder="0"
                className="w-24 text-right text-sm bg-background rounded-lg py-1 border border-input outline-none focus:border-primary"
              />
            </div>
            <div className="flex justify-between text-base font-bold pt-1 border-t border-border">
              <span>মোট</span>
              <span className="text-primary">{formatTk(cart.total())}</span>
            </div>
          </div>

          {/* Payment */}
          <div className="bg-white dark:bg-card rounded-2xl p-3.5 border border-border/50 space-y-3">
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">পরিশোধ পদ্ধতি</label>
              <div className="grid grid-cols-4 gap-1.5">
                {PAYMENT_METHODS.map((m) => (
                  <button
                    key={m}
                    onClick={() => cart.setPaymentMethod(m)}
                    className={`py-2 rounded-lg text-[11px] font-medium transition ${
                      cart.paymentMethod === m ? "bg-primary text-primary-foreground" : "bg-muted text-foreground"
                    }`}
                  >
                    {m}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-medium text-foreground mb-1.5 block">পরিশোধিত টাকা</label>
              <input
                type="text"
                inputMode="decimal"
                pattern="[0-9.]*"
                value={cart.paidAmount}
                onChange={(e) => {
                  const cleaned = e.target.value.replace(/,/g, ".").replace(/[^\d.]/g, "");
                  if (cleaned === "") cart.setPaidAmount("");
                  else { const n = parseFloat(cleaned); cart.setPaidAmount(isNaN(n) ? 0 : n); }
                }}
                placeholder={String(cart.total())}
                className="w-full px-3 py-2.5 rounded-xl border border-input bg-background text-base outline-none focus:border-primary"
              />
              <div className="flex gap-1.5 mt-2">
                <button onClick={() => cart.setPaidAmount(cart.total())} className="flex-1 bg-[#E8F5E9] text-primary text-[11px] font-medium py-1.5 rounded-lg active:scale-95 transition">পুরো পরিশোধ</button>
                <button onClick={() => cart.setPaidAmount(0)} className="flex-1 bg-[#FFEBEE] text-red-600 text-[11px] font-medium py-1.5 rounded-lg active:scale-95 transition">বাকিতে</button>
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

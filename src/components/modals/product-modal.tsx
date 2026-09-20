"use client";

import { useState, useEffect } from "react";
import { useQueryClient } from "@tanstack/react-query";
import { Loader2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { CATEGORIES, UNITS } from "@/lib/constants";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";

export function ProductModal({ open, product, onClose }: { open: boolean; product: any; onClose: () => void }) {
  const isEdit = !!product;
  const [name, setName] = useState("");
  const [category, setCategory] = useState<string>(CATEGORIES[0]);
  const [unit, setUnit] = useState<string>("kg");
  const [purchasePrice, setPurchasePrice] = useState("");
  const [sellingPrice, setSellingPrice] = useState("");
  const [stock, setStock] = useState("");
  const [minStock, setMinStock] = useState("");
  const [description, setDescription] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const qc = useQueryClient();
  const { bumpRefresh } = useAppStore();

  useEffect(() => {
    if (product) {
      setName(product.name || "");
      setCategory(product.category?.name || CATEGORIES[0]);
      setUnit(product.unit || "kg");
      setPurchasePrice(String(product.purchasePrice ?? ""));
      setSellingPrice(String(product.sellingPrice ?? ""));
      setStock(String(product.stockQuantity ?? ""));
      setMinStock(String(product.minimumStock ?? ""));
      setDescription(product.description || "");
    } else {
      setName(""); setCategory(CATEGORIES[0]); setUnit("kg");
      setPurchasePrice(""); setSellingPrice(""); setStock(""); setMinStock(""); setDescription("");
    }
  }, [product, open]);

  const submit = async () => {
    if (!name.trim()) return toast.error("দয়া করে পণ্যের নাম দিন");
    if (!sellingPrice || Number(sellingPrice) < 0) return toast.error("বিক্রয় মূল্য সঠিক নয়");
    setSubmitting(true);
    try {
      const body = { name, category, unit, purchasePrice: Number(purchasePrice) || 0, sellingPrice: Number(sellingPrice), stockQuantity: Number(stock) || 0, minimumStock: Number(minStock) || 0, description };
      const url = isEdit ? `/api/products/${product.id}` : "/api/products";
      const res = await fetch(url, { method: isEdit ? "PUT" : "POST", headers: { "Content-Type": "application/json" }, body: JSON.stringify(body) });
      const data = await res.json();
      if (!res.ok) return toast.error(data.error || "ব্যর্থ");
      toast.success(isEdit ? "পণ্য আপডেট হয়েছে।" : "পণ্য সফলভাবে যোগ হয়েছে।");
      qc.invalidateQueries({ queryKey: ["products"] });
      qc.invalidateQueries({ queryKey: ["dashboard"] });
      bumpRefresh();
      onClose();
    } catch {
      toast.error("নেটওয়ার্ক সমস্যা");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <ModalSheet open={open} onClose={onClose} title={isEdit ? "পণ্য সম্পাদনা" : "পণ্য যোগ করুন"} subtitle="পণ্যের বিস্তারিত তথ্য" footer={
      <button onClick={submit} disabled={submitting} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2 disabled:opacity-60">
        {submitting ? <Loader2 className="w-4 h-4 animate-spin" /> : "পণ্য সংরক্ষণ করুন"}
      </button>
    }>
      <div className="p-4 space-y-4">
        <div className="flex justify-center">
          <div className="w-20 h-20 rounded-2xl bg-[#E8F5E9] flex items-center justify-center text-4xl">🌿</div>
        </div>
        <Field label="পণ্যের নাম *"><input value={name} onChange={(e) => setName(e.target.value)} placeholder="যেমন: জিরা" className={inputCls} /></Field>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ক্যাটাগরি">
            <select value={category} onChange={(e) => setCategory(e.target.value)} className={inputCls}>
              {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
            </select>
          </Field>
          <Field label="একক">
            <select value={unit} onChange={(e) => setUnit(e.target.value)} className={inputCls}>
              {UNITS.map((u) => <option key={u} value={u}>{u}</option>)}
            </select>
          </Field>
        </div>
        <div className="grid grid-cols-2 gap-3">
          <Field label="ক্রয় মূল্য (৳)"><input type="number" value={purchasePrice} onChange={(e) => setPurchasePrice(e.target.value)} placeholder="0" className={inputCls} /></Field>
          <Field label="বিক্রয় মূল্য (৳) *"><input type="number" value={sellingPrice} onChange={(e) => setSellingPrice(e.target.value)} placeholder="0" className={inputCls} /></Field>
        </div>
        {!isEdit && (
          <div className="grid grid-cols-2 gap-3">
            <Field label="প্রাথমিক স্টক"><input type="number" value={stock} onChange={(e) => setStock(e.target.value)} placeholder="0" className={inputCls} /></Field>
            <Field label="ন্যূনতম স্টক"><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" className={inputCls} /></Field>
          </div>
        )}
        {isEdit && (
          <Field label="ন্যূনতম স্টক"><input type="number" value={minStock} onChange={(e) => setMinStock(e.target.value)} placeholder="0" className={inputCls} /></Field>
        )}
        <Field label="বিবরণ (ঐচ্ছিক)"><textarea value={description} onChange={(e) => setDescription(e.target.value)} rows={2} placeholder="পণ্যের বিবরণ..." className={`${inputCls} resize-none`} /></Field>
        {!isEdit && Number(sellingPrice) > 0 && Number(purchasePrice) > 0 && (
          <div className="bg-[#F3E5F5] rounded-xl p-3 text-center">
            <p className="text-[11px] text-muted-foreground">প্রতি একক লাভ</p>
            <p className="text-lg font-bold text-[#6A1B9A]">৳ {(Number(sellingPrice) - Number(purchasePrice)).toFixed(2)}</p>
          </div>
        )}
      </div>
    </ModalSheet>
  );
}

const inputCls = "w-full px-3 py-2.5 rounded-xl border border-input bg-white dark:bg-card text-sm outline-none focus:border-primary";

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <label className="text-xs font-medium mb-1.5 block">{label}</label>
      {children}
    </div>
  );
}

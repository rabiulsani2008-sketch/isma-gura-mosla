"use client";

import { useState } from "react";
import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Search, Plus, Edit3, History, Package, AlertTriangle, Users, Truck, Phone } from "lucide-react";
import { AppHeader } from "@/components/mobile/app-header";
import { LoadingState, EmptyState, ErrorState } from "@/components/shared/states";
import { CATEGORIES } from "@/lib/constants";
import { formatTk, toBnDigits } from "@/lib/format";
import { useAppStore } from "@/store/use-app-store";
import { toast } from "sonner";

async function fetchStock(params: { search: string; category: string }) {
  const q = new URLSearchParams();
  if (params.search) q.set("search", params.search);
  if (params.category && params.category !== "সব") q.set("category", params.category);
  const r = await fetch(`/api/stock?${q}`);
  return r.json();
}
async function fetchCustomers() { return fetch("/api/customers").then((r) => r.json()); }
async function fetchSuppliers() { return fetch("/api/suppliers").then((r) => r.json()); }

export function StockScreen() {
  const [view, setView] = useState<"products" | "customers" | "suppliers">("products");
  const [search, setSearch] = useState("");
  const [cat, setCat] = useState("সব");
  const { openModal, setModalPayload, refreshTick } = useAppStore();
  const qc = useQueryClient();

  const { data: stockData, isLoading, isError, refetch } = useQuery({ queryKey: ["stock", search, cat, refreshTick], queryFn: () => fetchStock({ search, category: cat }), enabled: view === "products" });
  const { data: custData } = useQuery({ queryKey: ["customers", refreshTick], queryFn: fetchCustomers, enabled: view === "customers" });
  const { data: supData } = useQuery({ queryKey: ["suppliers", refreshTick], queryFn: fetchSuppliers, enabled: view === "suppliers" });

  return (
    <div className="flex-1 flex flex-col">
      <AppHeader title="স্টক" subtitle="পণ্য, গ্রাহক ও সরবরাহকারী" />
      {/* Sub-tabs */}
      <div className="px-3 pt-3 bg-white dark:bg-card border-b border-border">
        <div className="flex gap-1.5 mb-2.5">
          {[
            { k: "products", l: "পণ্য", i: Package },
            { k: "customers", l: "গ্রাহক", i: Users },
            { k: "suppliers", l: "সরবরাহকারী", i: Truck },
          ].map((t) => (
            <button key={t.k} onClick={() => { setView(t.k as any); setSearch(""); }} className={`flex-1 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1 ${view === t.k ? "bg-primary text-primary-foreground" : "bg-muted"}`}>
              <t.i className="w-3.5 h-3.5" /> {t.l}
            </button>
          ))}
        </div>
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input value={search} onChange={(e) => setSearch(e.target.value)} placeholder={view === "products" ? "পণ্য খুঁজুন..." : view === "customers" ? "গ্রাহক খুঁজুন..." : "সরবরাহকারী খুঁজুন..."} className="w-full pl-9 pr-3 py-2.5 rounded-xl border border-input bg-background text-sm outline-none focus:border-primary" />
        </div>
        {view === "products" && (
          <div className="flex gap-1.5 overflow-x-auto no-scrollbar py-2.5">
            {["সব", ...CATEGORIES].map((c) => (
              <button key={c} onClick={() => setCat(c)} className={`px-3 py-1.5 rounded-full text-xs font-medium whitespace-nowrap ${cat === c ? "bg-primary text-primary-foreground" : "bg-muted"}`}>{c}</button>
            ))}
          </div>
        )}
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-thin pb-28">
        {view === "products" && (
          <>
            {/* Summary */}
            {stockData?.summary && (
              <div className="p-3 grid grid-cols-3 gap-2">
                <div className="bg-white dark:bg-card rounded-xl p-2.5 border border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">মোট পণ্য</p>
                  <p className="text-base font-bold">{toBnDigits(stockData.summary.totalProducts)}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl p-2.5 border border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">স্টক মূল্য</p>
                  <p className="text-xs font-bold">{formatTk(stockData.summary.totalStockValue)}</p>
                </div>
                <div className="bg-white dark:bg-card rounded-xl p-2.5 border border-border/50 text-center">
                  <p className="text-[10px] text-muted-foreground">কম স্টক</p>
                  <p className="text-base font-bold text-amber-600">{toBnDigits(stockData.summary.lowStockCount)}</p>
                </div>
              </div>
            )}

            {isLoading ? <LoadingState /> : isError ? <ErrorState message="লোড করা যায়নি" onRetry={refetch} /> : (
              (stockData?.products?.length || 0) === 0 ? <EmptyState icon={Package} title="কোনো পণ্য নেই" description="+ বোতামে ট্যাপ করে পণ্য যোগ করুন" action={<button onClick={() => openModal("add_product")} className="bg-primary text-primary-foreground px-5 py-2 rounded-lg text-sm font-medium">পণ্য যোগ করুন</button>} /> : (
                <div className="px-3 space-y-2">
                  {stockData.products.map((p: any) => {
                    const status = p.stockQuantity <= 0 ? "শেষ" : p.stockQuantity <= p.minimumStock ? "কম" : "ভালো";
                    const statusColor = p.stockQuantity <= 0 ? "text-red-600 bg-red-50" : p.stockQuantity <= p.minimumStock ? "text-amber-600 bg-amber-50" : "text-[#1B5E20] bg-[#E8F5E9]";
                    return (
                      <div key={p.id} className="bg-white dark:bg-card rounded-2xl p-3 border border-border/50">
                        <div className="flex items-center gap-3">
                          <div className="w-12 h-12 rounded-xl bg-[#E8F5E9] flex items-center justify-center text-xl shrink-0">🌿</div>
                          <div className="flex-1 min-w-0">
                            <div className="flex items-center gap-2">
                              <p className="text-sm font-semibold truncate">{p.name}</p>
                              <span className={`text-[9px] px-1.5 py-0.5 rounded-full font-medium ${statusColor}`}>{status}</span>
                            </div>
                            <p className="text-[11px] text-muted-foreground">{p.category?.name || "অন্যান্য"} • স্টক: {toBnDigits(p.stockQuantity)} {p.unit}</p>
                            <div className="flex gap-3 mt-0.5 text-[10px] text-muted-foreground">
                              <span>ক্রয়: {formatTk(p.purchasePrice)}</span>
                              <span>বিক্রয়: {formatTk(p.sellingPrice)}</span>
                            </div>
                          </div>
                        </div>
                        <div className="flex gap-1.5 mt-2.5">
                          <button onClick={() => { setModalPayload(p); openModal("stock_adjustment"); }} className="flex-1 bg-[#FFF3E0] text-[#E65100] py-1.5 rounded-lg text-[11px] font-medium">স্টক সমন্বয়</button>
                          <button onClick={() => { setModalPayload(p); openModal("stock_history"); }} className="flex-1 bg-[#E3F2FD] text-[#1565C0] py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"><History className="w-3 h-3" /> ইতিহাস</button>
                          <button onClick={() => { setModalPayload(p); openModal("edit_product"); }} className="flex-1 bg-[#E8F5E9] text-primary py-1.5 rounded-lg text-[11px] font-medium flex items-center justify-center gap-1"><Edit3 className="w-3 h-3" /> সম্পাদনা</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )
            )}
          </>
        )}

        {view === "customers" && (
          <>
            <div className="p-3">
              <button onClick={() => openModal("add_customer")} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> নতুন গ্রাহক</button>
            </div>
            {(custData?.customers || []).length === 0 ? <EmptyState icon={Users} title="কোনো গ্রাহক নেই" /> : (
              <div className="px-3 space-y-2">
                {(custData?.customers || []).filter((c: any) => !search || c.name.includes(search) || c.phone.includes(search)).map((c: any) => (
                  <button key={c.id} onClick={() => { setModalPayload({ id: c.id }); openModal("customer_details"); }} className="w-full text-left bg-white dark:bg-card rounded-2xl p-3 border border-border/50 active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#E8F5E9] flex items-center justify-center text-lg shrink-0">👤</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{c.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {c.phone}</p>
                        <div className="flex gap-3 mt-0.5 text-[10px]">
                          <span className="text-muted-foreground">বিক্রি: {formatTk(c.totalSales)}</span>
                          {c.due > 0 ? <span className="text-red-600 font-medium">বকেয়া: {formatTk(c.due)}</span> : <span className="text-[#1B5E20]">পরিশোধিত</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}

        {view === "suppliers" && (
          <>
            <div className="p-3">
              <button onClick={() => openModal("add_supplier")} className="w-full bg-primary text-primary-foreground py-2.5 rounded-xl text-sm font-semibold flex items-center justify-center gap-1.5"><Plus className="w-4 h-4" /> নতুন সরবরাহকারী</button>
            </div>
            {(supData?.suppliers || []).length === 0 ? <EmptyState icon={Truck} title="কোনো সরবরাহকারী নেই" /> : (
              <div className="px-3 space-y-2">
                {(supData?.suppliers || []).filter((s: any) => !search || s.name.includes(search) || s.phone.includes(search)).map((s: any) => (
                  <button key={s.id} onClick={() => { setModalPayload({ id: s.id }); openModal("supplier_details"); }} className="w-full text-left bg-white dark:bg-card rounded-2xl p-3 border border-border/50 active:scale-[0.98]">
                    <div className="flex items-center gap-3">
                      <div className="w-11 h-11 rounded-full bg-[#FFEBEE] flex items-center justify-center text-lg shrink-0">🚚</div>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-semibold truncate">{s.name}</p>
                        <p className="text-[11px] text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {s.phone}</p>
                        <div className="flex gap-3 mt-0.5 text-[10px]">
                          <span className="text-muted-foreground">ক্রয়: {formatTk(s.totalPurchases)}</span>
                          {s.due > 0 ? <span className="text-red-600 font-medium">দেনা: {formatTk(s.due)}</span> : <span className="text-[#1B5E20]">পরিশোধিত</span>}
                        </div>
                      </div>
                    </div>
                  </button>
                ))}
              </div>
            )}
          </>
        )}
      </div>

      {/* Floating add button for products */}
      {view === "products" && (
        <button onClick={() => openModal("add_product")} className="fixed bottom-[80px] right-4 w-12 h-12 rounded-full bg-primary text-primary-foreground shadow-lg flex items-center justify-center active:scale-90 z-20" aria-label="পণ্য যোগ" style={{ marginRight: "max(0px, calc((100vw - 480px) / 2))" }}>
          <Plus className="w-6 h-6" />
        </button>
      )}
    </div>
  );
}

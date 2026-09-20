"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, MapPin, ArrowUpFromLine, Receipt, Trash2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { formatTk, formatBnDateTime } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { toast } from "sonner";

export function SupplierDetailsModal({ open, supplierId, onClose }: { open: boolean; supplierId?: string; onClose: () => void }) {
  const { openModal, setModalPayload } = useAppStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["supplier-details", supplierId],
    queryFn: () => fetch(`/api/suppliers/${supplierId}`).then((r) => r.json()),
    enabled: open && !!supplierId,
  });

  const del = async () => {
    if (!confirm("এই সরবরাহকারী মুছে ফেলতে চান?")) return;
    const res = await fetch(`/api/suppliers/${supplierId}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || "মুছা যায়নি");
    toast.success("সরবরাহকারী মুছে ফেলা হয়েছে");
    qc.invalidateQueries({ queryKey: ["suppliers"] });
    onClose();
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="সরবরাহকারীর বিস্তারিত" subtitle={data?.supplier?.name} fullScreen footer={
      data?.supplier && (
        <button onClick={() => { setModalPayload({ id: supplierId }); openModal("pay_payment"); }} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          <ArrowUpFromLine className="w-4 h-4" /> টাকা পরিশোধ করুন
        </button>
      )
    }>
      {isLoading ? <LoadingState /> : !data?.supplier ? <EmptyState icon={Receipt} title="পাওয়া যায়নি" /> : (
        <div className="p-4 space-y-4">
          <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#FFEBEE] flex items-center justify-center text-2xl">🚚</div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold">{data.supplier.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {data.supplier.phone}</p>
                {data.supplier.address && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {data.supplier.address}</p>}
              </div>
            </div>
            <button onClick={del} className="w-full mt-3 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> মুছুন</button>
          </div>

          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">মোট ক্রয়</p>
              <p className="text-sm font-bold mt-1">{formatTk(data.summary.totalPurchases)}</p>
            </div>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">মোট পরিশোধ</p>
              <p className="text-sm font-bold text-[#1B5E20] mt-1">{formatTk(data.summary.totalPaid)}</p>
            </div>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">বর্তমান দেনা</p>
              <p className={`text-sm font-bold mt-1 ${data.summary.due > 0 ? "text-red-600" : "text-[#1B5E20]"}`}>{formatTk(data.summary.due)}</p>
            </div>
          </div>

          <div>
            <h3 className="text-sm font-bold mb-2 flex items-center gap-1.5"><Receipt className="w-4 h-4 text-primary" /> লেনদেন ইতিহাস</h3>
            <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden">
              {data.purchases.length === 0 && data.payments.length === 0 ? <EmptyState icon={Receipt} title="কোনো লেনদেন নেই" /> : (
                <div>
                  {data.purchases.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                      <span className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center text-[10px] font-bold text-[#1565C0]">ক</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">ক্রয় • {p.invoiceNumber}</p>
                        <p className="text-[10px] text-muted-foreground">{formatBnDateTime(p.purchaseDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold">{formatTk(p.totalAmount)}</p>
                        {p.dueAmount > 0 && <p className="text-[10px] text-red-500">দেনা {formatTk(p.dueAmount)}</p>}
                      </div>
                    </div>
                  ))}
                  {data.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                      <span className="w-8 h-8 rounded-lg bg-[#F3E5F5] flex items-center justify-center text-[10px] font-bold text-[#8E24AA]">দ</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">দেনা পরিশোধ</p>
                        <p className="text-[10px] text-muted-foreground">{formatBnDateTime(p.paymentDate)} • {p.paymentMethod}</p>
                      </div>
                      <p className="text-xs font-bold text-[#C62828]">−{formatTk(p.amount)}</p>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </ModalSheet>
  );
}

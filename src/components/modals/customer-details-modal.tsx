"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Phone, MapPin, ArrowDownToLine, Receipt, Loader2, Trash2, Edit3 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { useAppStore } from "@/store/use-app-store";
import { formatTk, formatBnDateTime, toBnDigits } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";
import { toast } from "sonner";

export function CustomerDetailsModal({ open, customerId, onClose }: { open: boolean; customerId?: string; onClose: () => void }) {
  const { openModal, setModalPayload } = useAppStore();
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["customer-details", customerId],
    queryFn: () => fetch(`/api/customers/${customerId}`).then((r) => r.json()),
    enabled: open && !!customerId,
  });

  const del = async () => {
    if (!confirm("এই গ্রাহক মুছে ফেলতে চান?")) return;
    const res = await fetch(`/api/customers/${customerId}`, { method: "DELETE" });
    const d = await res.json();
    if (!res.ok) return toast.error(d.error || "মুছা যায়নি");
    toast.success("গ্রাহক মুছে ফেলা হয়েছে");
    qc.invalidateQueries({ queryKey: ["customers"] });
    onClose();
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="গ্রাহকের বিস্তারিত" subtitle={data?.customer?.name} fullScreen footer={
      data?.customer && (
        <button onClick={() => { setModalPayload({ id: customerId }); openModal("receive_payment"); }} className="w-full bg-primary text-primary-foreground font-semibold py-3 rounded-xl flex items-center justify-center gap-2">
          <ArrowDownToLine className="w-4 h-4" /> টাকা নিন
        </button>
      )
    }>
      {isLoading ? <LoadingState /> : !data?.customer ? <EmptyState icon={Receipt} title="পাওয়া যায়নি" /> : (
        <div className="p-4 space-y-4">
          {/* Profile */}
          <div className="bg-white dark:bg-card rounded-2xl p-4 border border-border/50">
            <div className="flex items-center gap-3">
              <div className="w-14 h-14 rounded-full bg-[#E8F5E9] flex items-center justify-center text-2xl">👤</div>
              <div className="flex-1 min-w-0">
                <p className="text-base font-bold text-foreground">{data.customer.name}</p>
                <p className="text-xs text-muted-foreground flex items-center gap-1"><Phone className="w-3 h-3" /> {data.customer.phone}</p>
                {data.customer.address && <p className="text-[11px] text-muted-foreground flex items-center gap-1 mt-0.5"><MapPin className="w-3 h-3" /> {data.customer.address}</p>}
              </div>
            </div>
            <div className="flex gap-2 mt-3">
              <button onClick={del} className="flex-1 border border-red-200 text-red-600 py-2 rounded-lg text-xs font-medium flex items-center justify-center gap-1"><Trash2 className="w-3.5 h-3.5" /> মুছুন</button>
            </div>
          </div>

          {/* Summary */}
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">মোট বিক্রি</p>
              <p className="text-sm font-bold text-foreground mt-1">{formatTk(data.summary.totalSales)}</p>
            </div>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">মোট পরিশোধ</p>
              <p className="text-sm font-bold text-[#1B5E20] mt-1">{formatTk(data.summary.totalPaid)}</p>
            </div>
            <div className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 text-center">
              <p className="text-[10px] text-muted-foreground">বর্তমান পাওনা</p>
              <p className={`text-sm font-bold mt-1 ${data.summary.due > 0 ? "text-red-600" : "text-[#1B5E20]"}`}>{formatTk(data.summary.due)}</p>
            </div>
          </div>

          {/* Transactions */}
          <div>
            <h3 className="text-sm font-bold text-foreground mb-2 flex items-center gap-1.5"><Receipt className="w-4 h-4 text-primary" /> লেনদেন ইতিহাস</h3>
            <div className="bg-white dark:bg-card rounded-2xl border border-border/50 overflow-hidden">
              {data.sales.length === 0 && data.payments.length === 0 ? <EmptyState icon={Receipt} title="কোনো লেনদেন নেই" /> : (
                <div>
                  {data.sales.map((s: any) => (
                    <div key={s.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                      <span className="w-8 h-8 rounded-lg bg-[#E8F5E9] flex items-center justify-center text-[10px] font-bold text-[#1B5E20]">বি</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium truncate">বিক্রি • {s.invoiceNumber}</p>
                        <p className="text-[10px] text-muted-foreground">{formatBnDateTime(s.saleDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-xs font-bold text-foreground">{formatTk(s.totalAmount)}</p>
                        {s.dueAmount > 0 && <p className="text-[10px] text-red-500">বকেয়া {formatTk(s.dueAmount)}</p>}
                      </div>
                    </div>
                  ))}
                  {data.payments.map((p: any) => (
                    <div key={p.id} className="flex items-center gap-2 px-3 py-2.5 border-b border-border/50">
                      <span className="w-8 h-8 rounded-lg bg-[#E3F2FD] flex items-center justify-center text-[10px] font-bold text-[#1565C0]">প</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-xs font-medium">পাওনা পরিশোধ</p>
                        <p className="text-[10px] text-muted-foreground">{formatBnDateTime(p.paymentDate)} • {p.paymentMethod}</p>
                      </div>
                      <p className="text-xs font-bold text-[#1B5E20]">+{formatTk(p.amount)}</p>
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

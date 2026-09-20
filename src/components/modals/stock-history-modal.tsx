"use client";

import { useQuery } from "@tanstack/react-query";
import { ArrowUpCircle, ArrowDownCircle, Edit3 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { formatBnDateTime, toBnDigits } from "@/lib/format";
import { LoadingState, EmptyState } from "@/components/shared/states";

export function StockHistoryModal({ open, product, onClose }: { open: boolean; product: any; onClose: () => void }) {
  const { data, isLoading } = useQuery({
    queryKey: ["stock-history", product?.id],
    queryFn: () => fetch(`/api/stock/${product?.id}`).then((r) => r.json()),
    enabled: open && !!product,
  });

  if (!product) return null;

  return (
    <ModalSheet open={open} onClose={onClose} title="স্টক ইতিহাস" subtitle={product.name} fullScreen>
      {isLoading ? <LoadingState /> : (
        (data?.movements?.length || 0) === 0 ? <EmptyState icon={Edit3} title="কোনো ইতিহাস নেই" /> : (
          <div className="p-4 space-y-2">
            {data.movements.map((m: any) => {
              const positive = m.quantity > 0;
              const typeMap: any = { purchase: "ক্রয়", sale: "বিক্রি", adjustment: "সমন্বয়", return: "ফেরত" };
              return (
                <div key={m.id} className="bg-white dark:bg-card rounded-xl p-3 border border-border/50 flex items-center gap-3">
                  {positive ? <ArrowUpCircle className="w-9 h-9 text-[#1B5E20]" /> : <ArrowDownCircle className="w-9 h-9 text-[#C62828]" />}
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium">{typeMap[m.type] || m.type} • {m.reference || "-"}</p>
                    <p className="text-[11px] text-muted-foreground">{formatBnDateTime(m.createdAt)}</p>
                  </div>
                  <span className={`text-sm font-bold ${positive ? "text-[#1B5E20]" : "text-[#C62828]"}`}>
                    {positive ? "+" : ""}{toBnDigits(m.quantity)} {product.unit}
                  </span>
                </div>
              );
            })}
          </div>
        )
      )}
    </ModalSheet>
  );
}

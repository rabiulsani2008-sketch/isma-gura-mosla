"use client";

import { useQuery, useQueryClient } from "@tanstack/react-query";
import { Download, Printer, Share2, Loader2 } from "lucide-react";
import { ModalSheet } from "@/components/mobile/modal-sheet";
import { formatTk, formatBnDateTime, toBnDigits, formatBnDate } from "@/lib/format";
import { COMPANY_NAME, COMPANY_TAGLINE } from "@/lib/constants";
import { toast } from "sonner";

export function InvoiceModal({ open, saleId, onClose }: { open: boolean; saleId?: string; onClose: () => void }) {
  const qc = useQueryClient();
  const { data, isLoading } = useQuery({
    queryKey: ["invoice", saleId],
    queryFn: () => fetch(`/api/invoice/${saleId}`).then((r) => r.json()),
    enabled: open && !!saleId,
    staleTime: 0,
  });

  const handleShare = async () => {
    if (!data?.sale) return;
    const s = data.sale;
    const lines = [
      `${COMPANY_NAME}`,
      COMPANY_TAGLINE,
      ``,
      `ইনভয়েস: ${s.invoiceNumber}`,
      `তারিখ: ${formatBnDateTime(s.saleDate)}`,
      `গ্রাহক: ${s.customer?.name || "নগদ গ্রাহক"}`,
      ``,
      `পণ্য    পরিমাণ    দাম    মোট`,
      ...s.items.map((it: any) => `${it.product.name}    ${toBnDigits(it.quantity)}${it.product.unit}    ${formatTk(it.unitPrice)}    ${formatTk(it.total)}`),
      ``,
      `সাবটোটাল: ${formatTk(s.subtotal)}`,
      s.discount > 0 ? `ছাড়: ${formatTk(s.discount)}` : "",
      `মোট: ${formatTk(s.totalAmount)}`,
      `পরিশোধিত: ${formatTk(s.paidAmount)}`,
      s.dueAmount > 0 ? `বকেয়া: ${formatTk(s.dueAmount)}` : "",
      `পদ্ধতি: ${s.paymentMethod}`,
    ].filter(Boolean).join("\n");
    try {
      if (navigator.share) {
        await navigator.share({ title: `ইনভয়েস ${s.invoiceNumber}`, text: lines });
      } else {
        await navigator.clipboard.writeText(lines);
        toast.success("ইনভয়েস কপি হয়েছে");
      }
    } catch { /* user cancelled */ }
  };

  const handlePrint = () => {
    window.print();
  };

  const handlePdf = () => {
    // Generate a printable HTML invoice in a new window for save-as-PDF
    if (!data?.sale) return;
    const s = data.sale;
    const w = window.open("", "_blank");
    if (!w) { toast.error("পপআপ ব্লক করা হয়েছে"); return; }
    w.document.write(`
      <html><head><title>${s.invoiceNumber}</title>
      <style>
        body { font-family: 'Hind Siliguri', sans-serif; padding: 24px; color: #1c1c1c; }
        .h { text-align:center; color:#1B5E20; }
        .h h1 { font-size: 20px; margin: 4px 0; }
        .meta { display:flex; justify-content:space-between; font-size:12px; margin: 16px 0; }
        table { width:100%; border-collapse:collapse; margin:12px 0; font-size:13px; }
        th, td { border-bottom:1px solid #eee; padding:8px; text-align:left; }
        th { background:#E8F5E9; }
        .t { text-align:right; }
        .tot { margin-top:16px; text-align:right; font-size:14px; }
        .tot div { margin:4px 0; }
        .big { font-size:18px; font-weight:bold; color:#1B5E20; }
      </style></head><body>
      <div class="h">
        <img src="${window.location.origin}/logo.svg" alt="logo" style="width:64px;height:64px;margin:0 auto 8px;display:block" />
        <h1>${COMPANY_NAME}</h1>
        <p>${COMPANY_TAGLINE}</p>
      </div>
      <div class="meta">
        <div>ইনভয়েস: <b>${s.invoiceNumber}</b><br/>তারিখ: ${formatBnDateTime(s.saleDate)}</div>
        <div>গ্রাহক: <b>${s.customer?.name || "নগদ গ্রাহক"}</b><br/>${s.customer?.phone || ""}</div>
      </div>
      <table>
        <thead><tr><th>পণ্য</th><th>পরিমাণ</th><th>দাম</th><th class="t">মোট</th></tr></thead>
        <tbody>
          ${s.items.map((it:any) => `<tr><td>${it.product.name}</td><td>${toBnDigits(it.quantity)} ${it.product.unit}</td><td>${formatTk(it.unitPrice)}</td><td class="t">${formatTk(it.total)}</td></tr>`).join("")}
        </tbody>
      </table>
      <div class="tot">
        <div>সাবটোটাল: ${formatTk(s.subtotal)}</div>
        ${s.discount > 0 ? `<div>ছাড়: -${formatTk(s.discount)}</div>` : ""}
        <div class="big">মোট: ${formatTk(s.totalAmount)}</div>
        <div>পরিশোধিত: ${formatTk(s.paidAmount)}</div>
        ${s.dueAmount > 0 ? `<div style="color:#C62828"><b>বকেয়া: ${formatTk(s.dueAmount)}</b></div>` : ""}
        <div>পদ্ধতি: ${s.paymentMethod}</div>
      </div>
      <p style="text-align:center;margin-top:32px;color:#666;font-size:11px">ধন্যবাদ! আবার আসবেন।</p>
      <script>window.onload=()=>{window.print()}</script>
      </body></html>`);
    w.document.close();
  };

  return (
    <ModalSheet open={open} onClose={onClose} title="ইনভয়েস / রসিদ" subtitle={data?.sale?.invoiceNumber} fullScreen footer={
      data?.sale && (
        <div className="flex gap-2">
          <button onClick={handlePdf} className="flex-1 bg-primary text-primary-foreground py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"><Download className="w-4 h-4" /> PDF</button>
          <button onClick={handlePrint} className="flex-1 border border-primary text-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"><Printer className="w-4 h-4" /> প্রিন্ট</button>
          <button onClick={handleShare} className="flex-1 border border-primary text-primary py-2.5 rounded-xl text-xs font-semibold flex items-center justify-center gap-1.5"><Share2 className="w-4 h-4" /> শেয়ার</button>
        </div>
      )
    }>
      {isLoading || !data?.sale ? <div className="flex justify-center py-16"><Loader2 className="w-7 h-7 animate-spin text-primary" /></div> : (
        <div className="p-4">
          <div className="bg-white dark:bg-card rounded-2xl border border-border/50 p-5">
            {/* Header */}
            <div className="text-center border-b border-dashed border-border pb-4">
              <div className="w-16 h-16 rounded-full bg-white mx-auto mb-2 overflow-hidden flex items-center justify-center p-1">
                { }
                <img src="/logo.svg" alt="logo" className="w-full h-full object-contain" />
              </div>
              <h2 className="text-base font-bold text-primary mt-1.5 leading-tight">{COMPANY_NAME}</h2>
              <p className="text-[10px] text-muted-foreground">{COMPANY_TAGLINE}</p>
              <p className="text-[10px] text-muted-foreground mt-1">{data.sale.shop?.address}</p>
            </div>
            {/* Meta */}
            <div className="py-3 grid grid-cols-2 gap-2 text-xs border-b border-dashed border-border">
              <div>
                <p className="text-muted-foreground">ইনভয়েস নং</p>
                <p className="font-bold text-foreground">{data.sale.invoiceNumber}</p>
              </div>
              <div className="text-right">
                <p className="text-muted-foreground">তারিখ</p>
                <p className="font-bold text-foreground">{formatBnDate(data.sale.saleDate)}</p>
              </div>
              <div className="col-span-2">
                <p className="text-muted-foreground">গ্রাহক</p>
                <p className="font-bold text-foreground">{data.sale.customer?.name || "নগদ গ্রাহক"}</p>
                {data.sale.customer?.phone && <p className="text-[11px] text-muted-foreground">{data.sale.customer.phone}</p>}
              </div>
            </div>
            {/* Items */}
            <div className="py-3 border-b border-dashed border-border">
              <div className="grid grid-cols-12 gap-1 text-[10px] font-bold text-muted-foreground pb-1.5">
                <div className="col-span-5">পণ্য</div>
                <div className="col-span-2 text-center">পরিমাণ</div>
                <div className="col-span-2 text-right">দাম</div>
                <div className="col-span-3 text-right">মোট</div>
              </div>
              {data.sale.items.map((it: any) => (
                <div key={it.id} className="grid grid-cols-12 gap-1 text-xs py-1.5">
                  <div className="col-span-5 text-foreground">{it.product.name}</div>
                  <div className="col-span-2 text-center text-muted-foreground">{toBnDigits(it.quantity)} {it.product.unit}</div>
                  <div className="col-span-2 text-right text-muted-foreground">{formatTk(it.unitPrice)}</div>
                  <div className="col-span-3 text-right font-medium text-foreground">{formatTk(it.total)}</div>
                </div>
              ))}
            </div>
            {/* Totals */}
            <div className="py-3 space-y-1.5 text-sm">
              <div className="flex justify-between text-muted-foreground"><span>সাবটোটাল</span><span>{formatTk(data.sale.subtotal)}</span></div>
              {data.sale.discount > 0 && <div className="flex justify-between text-muted-foreground"><span>ছাড়</span><span>−{formatTk(data.sale.discount)}</span></div>}
              <div className="flex justify-between font-bold text-base text-primary pt-1.5 border-t border-border"><span>মোট</span><span>{formatTk(data.sale.totalAmount)}</span></div>
              <div className="flex justify-between text-muted-foreground"><span>পরিশোধিত</span><span>{formatTk(data.sale.paidAmount)}</span></div>
              {data.sale.dueAmount > 0 && <div className="flex justify-between text-red-600 font-bold"><span>বকেয়া</span><span>{formatTk(data.sale.dueAmount)}</span></div>}
              <div className="flex justify-between text-muted-foreground text-xs"><span>পদ্ধতি</span><span>{data.sale.paymentMethod}</span></div>
            </div>
            <p className="text-center text-[10px] text-muted-foreground pt-3 border-t border-dashed border-border">ধন্যবাদ! আবার আসবেন।</p>
          </div>
        </div>
      )}
    </ModalSheet>
  );
}

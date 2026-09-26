import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const shopId = session.shopId;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "today";
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const now = new Date();
  let start: Date;
  let end: Date = now;
  switch (range) {
    case "today":
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
      break;
    case "week": {
      const day = now.getDay();
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate() - day);
      break;
    }
    case "month":
      start = new Date(now.getFullYear(), now.getMonth(), 1);
      break;
    case "six_months":
      start = new Date(now.getFullYear(), now.getMonth() - 5, 1);
      break;
    case "year":
      start = new Date(now.getFullYear(), 0, 1);
      break;
    case "custom":
      start = from ? new Date(from) : new Date(now.getFullYear(), now.getMonth(), 1);
      end = to ? new Date(new Date(to).getTime() + 86400000) : now;
      break;
    default:
      start = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  }

  const dateRange = { gte: start, lt: end };

  const salesAgg = await db.sale.aggregate({ where: { shopId, saleDate: dateRange }, _sum: { totalAmount: true, discount: true } });
  const purchasesAgg = await db.purchase.aggregate({ where: { shopId, purchaseDate: dateRange }, _sum: { totalAmount: true } });
  const expensesAgg = await db.expense.aggregate({ where: { shopId, expenseDate: dateRange }, _sum: { amount: true } });

  // Cost of goods sold + gross profit
  const saleItems = await db.saleItem.findMany({
    where: { sale: { shopId, saleDate: dateRange } },
    select: { quantity: true, unitPrice: true, costPrice: true },
  });
  const cogs = saleItems.reduce((s, si) => s + si.costPrice * si.quantity, 0);
  const salesRevenue = saleItems.reduce((s, si) => s + si.unitPrice * si.quantity, 0);
  const grossProfit = salesRevenue - cogs - (salesAgg._sum.discount ?? 0);
  const netProfit = grossProfit - (expensesAgg._sum.amount ?? 0);

  // Customer + supplier dues (total current, not range-bound)
  const customers = await db.customer.findMany({ where: { shopId } });
  let customerDue = customers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  const custSalesAgg = await db.sale.groupBy({ by: ["customerId"], where: { shopId, customerId: { not: null } }, _sum: { totalAmount: true, paidAmount: true } });
  for (const r of custSalesAgg) customerDue += (r._sum.totalAmount ?? 0) - (r._sum.paidAmount ?? 0);
  const custPay = await db.payment.aggregate({ where: { shopId, type: "customer_payment" }, _sum: { amount: true } });
  customerDue -= custPay._sum.amount ?? 0;

  const suppliers = await db.supplier.findMany({ where: { shopId } });
  let supplierDue = suppliers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  const supPurAgg = await db.purchase.groupBy({ by: ["supplierId"], where: { shopId, supplierId: { not: null } }, _sum: { totalAmount: true, paidAmount: true } });
  for (const r of supPurAgg) supplierDue += (r._sum.totalAmount ?? 0) - (r._sum.paidAmount ?? 0);
  const supPay = await db.payment.aggregate({ where: { shopId, type: "supplier_payment" }, _sum: { amount: true } });
  supplierDue -= supPay._sum.amount ?? 0;

  // Chart series (group by day/week/month depending on range)
  const series: { label: string; sales: number; purchase: number; expense: number; profit: number }[] = [];
  const buckets: { start: Date; label: string }[] = [];
  if (range === "today") {
    // hourly
    for (let h = 0; h < 24; h += 4) {
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h);
      buckets.push({ start: s, label: `${h}:00` });
    }
  } else if (range === "week") {
    const days = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
    for (let i = 0; i < 7; i++) {
      const s = new Date(start.getTime() + i * 86400000);
      buckets.push({ start: s, label: days[s.getDay()] });
    }
  } else if (range === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 0; i < daysInMonth; i += 2) {
      const s = new Date(now.getFullYear(), now.getMonth(), i + 1);
      buckets.push({ start: s, label: `${i + 1}` });
    }
  } else if (range === "six_months") {
    const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
    for (let i = 0; i < 6; i++) {
      const m = now.getMonth() - 5 + i;
      const d = new Date(now.getFullYear(), m, 1);
      buckets.push({ start: d, label: months[d.getMonth()] });
    }
  } else {
    // year — monthly
    const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1);
      buckets.push({ start: d, label: months[i] });
    }
  }

  for (let i = 0; i < buckets.length; i++) {
    const bStart = buckets[i].start;
    const bEnd = i + 1 < buckets.length ? buckets[i + 1].start : end;
    const r = { gte: bStart, lt: bEnd };
    const [s, p, e] = await Promise.all([
      db.sale.aggregate({ where: { shopId, saleDate: r }, _sum: { totalAmount: true } }),
      db.purchase.aggregate({ where: { shopId, purchaseDate: r }, _sum: { totalAmount: true } }),
      db.expense.aggregate({ where: { shopId, expenseDate: r }, _sum: { amount: true } }),
    ]);
    const items = await db.saleItem.findMany({ where: { sale: { shopId, saleDate: r } }, select: { quantity: true, unitPrice: true, costPrice: true } });
    const gp = items.reduce((acc, si) => acc + (si.unitPrice - si.costPrice) * si.quantity, 0);
    series.push({
      label: buckets[i].label,
      sales: s._sum.totalAmount ?? 0,
      purchase: p._sum.totalAmount ?? 0,
      expense: e._sum.amount ?? 0,
      profit: gp - (e._sum.amount ?? 0),
    });
  }

  // Best selling products (by revenue in range)
  const bestSellersRaw = await db.saleItem.findMany({
    where: { sale: { shopId, saleDate: dateRange } },
    include: { product: true },
  });
  const bestMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const si of bestSellersRaw) {
    const cur = bestMap.get(si.productId) || { name: si.product.name, qty: 0, revenue: 0 };
    cur.qty += si.quantity;
    cur.revenue += si.unitPrice * si.quantity;
    bestMap.set(si.productId, cur);
  }
  const bestSellers = [...bestMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top customers
  const topCustRaw = await db.sale.findMany({
    where: { shopId, saleDate: dateRange, customerId: { not: null } },
    include: { customer: true },
  });
  const topCustMap = new Map<string, { name: string; total: number; count: number }>();
  for (const s of topCustRaw) {
    if (!s.customerId) continue;
    const cur = topCustMap.get(s.customerId) || { name: s.customer?.name || "", total: 0, count: 0 };
    cur.total += s.totalAmount;
    cur.count += 1;
    topCustMap.set(s.customerId, cur);
  }
  const topCustomers = [...topCustMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  // Top suppliers
  const topSupRaw = await db.purchase.findMany({
    where: { shopId, purchaseDate: dateRange, supplierId: { not: null } },
    include: { supplier: true },
  });
  const topSupMap = new Map<string, { name: string; total: number; count: number }>();
  for (const p of topSupRaw) {
    if (!p.supplierId) continue;
    const cur = topSupMap.get(p.supplierId) || { name: p.supplier?.name || "", total: 0, count: 0 };
    cur.total += p.totalAmount;
    cur.count += 1;
    topSupMap.set(p.supplierId, cur);
  }
  const topSuppliers = [...topSupMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  // Low stock
  const lowStock = await db.product.findMany({
    where: { shopId, stockQuantity: { lte: db.product.fields.minimumStock } },
    take: 10,
    orderBy: { stockQuantity: "asc" },
  });

  return NextResponse.json({
    summary: {
      totalSales: salesAgg._sum.totalAmount ?? 0,
      totalPurchases: purchasesAgg._sum.totalAmount ?? 0,
      totalExpenses: expensesAgg._sum.amount ?? 0,
      grossProfit,
      netProfit,
      customerDue,
      supplierDue,
    },
    series,
    bestSellers,
    topCustomers,
    topSuppliers,
    lowStock,
    range: { start, end },
  });
}

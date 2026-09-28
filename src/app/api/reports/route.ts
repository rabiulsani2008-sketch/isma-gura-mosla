import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: Request) => {
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

  // Fetch ALL data in ONE parallel batch — no loops, no sequential queries
  const [
    salesAgg, purchasesAgg, expensesAgg,
    saleItemsForProfit,
    allCustomers, customerSalesAgg, custPayments,
    allSuppliers, supplierPurchasesAgg, supPayments,
    lowStock,
    allSaleItems, allSales, allPurchases, allExpenses,
  ] = await Promise.all([
    db.sale.aggregate({ where: { shopId, saleDate: dateRange }, _sum: { totalAmount: true, discount: true } }),
    db.purchase.aggregate({ where: { shopId, purchaseDate: dateRange }, _sum: { totalAmount: true } }),
    db.expense.aggregate({ where: { shopId, expenseDate: dateRange }, _sum: { amount: true } }),
    db.saleItem.findMany({ where: { sale: { shopId, saleDate: dateRange } }, select: { quantity: true, unitPrice: true, costPrice: true } }),
    db.customer.findMany({ where: { shopId }, select: { openingDue: true } }),
    db.sale.groupBy({ by: ["customerId"], where: { shopId, customerId: { not: null } }, _sum: { totalAmount: true, paidAmount: true } }),
    db.payment.aggregate({ where: { shopId, type: "customer_payment" }, _sum: { amount: true } }),
    db.supplier.findMany({ where: { shopId }, select: { openingDue: true } }),
    db.purchase.groupBy({ by: ["supplierId"], where: { shopId, supplierId: { not: null } }, _sum: { totalAmount: true, paidAmount: true } }),
    db.payment.aggregate({ where: { shopId, type: "supplier_payment" }, _sum: { amount: true } }),
    db.product.findMany({ where: { shopId, stockQuantity: { lte: db.product.fields.minimumStock } }, take: 10, orderBy: { stockQuantity: "asc" } }),
    // For series + best sellers — fetch once, group in JS
    db.saleItem.findMany({ where: { sale: { shopId, saleDate: dateRange } }, include: { product: true, sale: { select: { saleDate: true } } } }),
    db.sale.findMany({ where: { shopId, saleDate: dateRange, customerId: { not: null } }, include: { customer: true } }),
    db.purchase.findMany({ where: { shopId, purchaseDate: dateRange, supplierId: { not: null } }, include: { supplier: true } }),
    db.expense.findMany({ where: { shopId, expenseDate: dateRange }, select: { amount: true, expenseDate: true } }),
  ]);

  // Profit calc
  const cogs = saleItemsForProfit.reduce((s, si) => s + si.costPrice * si.quantity, 0);
  const salesRevenue = saleItemsForProfit.reduce((s, si) => s + si.unitPrice * si.quantity, 0);
  const grossProfit = salesRevenue - cogs - (salesAgg._sum.discount ?? 0);
  const netProfit = grossProfit - (expensesAgg._sum.amount ?? 0);

  // Dues
  let customerDue = allCustomers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  for (const r of customerSalesAgg) customerDue += (r._sum.totalAmount ?? 0) - (r._sum.paidAmount ?? 0);
  customerDue -= custPayments._sum.amount ?? 0;

  let supplierDue = allSuppliers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  for (const r of supplierPurchasesAgg) supplierDue += (r._sum.totalAmount ?? 0) - (r._sum.paidAmount ?? 0);
  supplierDue -= supPayments._sum.amount ?? 0;

  // Build series — group in JS, no DB queries
  const series: { label: string; sales: number; purchase: number; expense: number; profit: number }[] = [];
  const buckets: { start: Date; end: Date; label: string }[] = [];
  if (range === "today") {
    for (let h = 0; h < 24; h += 4) {
      const s = new Date(start.getFullYear(), start.getMonth(), start.getDate(), h);
      buckets.push({ start: s, end: new Date(s.getTime() + 4 * 3600000), label: `${h}:00` });
    }
  } else if (range === "week") {
    const dayNames = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
    for (let i = 0; i < 7; i++) {
      const s = new Date(start.getTime() + i * 86400000);
      buckets.push({ start: s, end: new Date(s.getTime() + 86400000), label: dayNames[s.getDay()] });
    }
  } else if (range === "month") {
    const daysInMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).getDate();
    for (let i = 0; i < daysInMonth; i += 2) {
      const s = new Date(now.getFullYear(), now.getMonth(), i + 1);
      buckets.push({ start: s, end: new Date(s.getTime() + 2 * 86400000), label: `${i + 1}` });
    }
  } else if (range === "six_months") {
    const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
    for (let i = 0; i < 6; i++) {
      const d = new Date(now.getFullYear(), now.getMonth() - 5 + i, 1);
      buckets.push({ start: d, end: new Date(now.getFullYear(), now.getMonth() - 5 + i + 1, 1), label: months[d.getMonth()] });
    }
  } else {
    const months = ["জানু", "ফেব্রু", "মার্চ", "এপ্রিল", "মে", "জুন", "জুলাই", "আগস্ট", "সেপ্ট", "অক্টো", "নভে", "ডিসে"];
    for (let i = 0; i < 12; i++) {
      const d = new Date(now.getFullYear(), i, 1);
      buckets.push({ start: d, end: new Date(now.getFullYear(), i + 1, 1), label: months[i] });
    }
  }

  for (const b of buckets) {
    const inRange = (d: Date) => d >= b.start && d < b.end;
    const sales = allSaleItems
      .filter((si) => inRange(si.sale.saleDate))
      .reduce((s, si) => s + si.unitPrice * si.quantity, 0);
    const purchase = allPurchases
      .filter((p) => inRange(p.purchaseDate))
      .reduce((s, p) => s + p.totalAmount, 0);
    const expense = allExpenses
      .filter((e) => inRange(e.expenseDate))
      .reduce((s, e) => s + e.amount, 0);
    const gross = allSaleItems
      .filter((si) => inRange(si.sale.saleDate))
      .reduce((s, si) => s + (si.unitPrice - si.costPrice) * si.quantity, 0);
    series.push({ label: b.label, sales, purchase, expense, profit: gross - expense });
  }

  // Best sellers — group in JS
  const bestMap = new Map<string, { name: string; qty: number; revenue: number }>();
  for (const si of allSaleItems) {
    const cur = bestMap.get(si.productId) || { name: si.product.name, qty: 0, revenue: 0 };
    cur.qty += si.quantity;
    cur.revenue += si.unitPrice * si.quantity;
    bestMap.set(si.productId, cur);
  }
  const bestSellers = [...bestMap.values()].sort((a, b) => b.revenue - a.revenue).slice(0, 5);

  // Top customers
  const topCustMap = new Map<string, { name: string; total: number; count: number }>();
  for (const s of allSales) {
    if (!s.customerId) continue;
    const cur = topCustMap.get(s.customerId) || { name: s.customer?.name || "", total: 0, count: 0 };
    cur.total += s.totalAmount;
    cur.count += 1;
    topCustMap.set(s.customerId, cur);
  }
  const topCustomers = [...topCustMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

  // Top suppliers
  const topSupMap = new Map<string, { name: string; total: number; count: number }>();
  for (const p of allPurchases) {
    if (!p.supplierId) continue;
    const cur = topSupMap.get(p.supplierId) || { name: p.supplier?.name || "", total: 0, count: 0 };
    cur.total += p.totalAmount;
    cur.count += 1;
    topSupMap.set(p.supplierId, cur);
  }
  const topSuppliers = [...topSupMap.values()].sort((a, b) => b.total - a.total).slice(0, 5);

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
});

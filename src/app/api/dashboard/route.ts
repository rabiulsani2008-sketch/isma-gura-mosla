import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const shopId = session.shopId;

  const now = new Date();
  const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate());
  const endOfToday = new Date(startOfToday.getTime() + 24 * 60 * 60 * 1000);

  // Today's sales (totalAmount sum)
  const todaySales = await db.sale.aggregate({
    where: { shopId, saleDate: { gte: startOfToday, lt: endOfToday } },
    _sum: { totalAmount: true },
  });
  // Today's purchases
  const todayPurchases = await db.purchase.aggregate({
    where: { shopId, purchaseDate: { gte: startOfToday, lt: endOfToday } },
    _sum: { totalAmount: true },
  });
  // Today's expenses
  const todayExpenses = await db.expense.aggregate({
    where: { shopId, expenseDate: { gte: startOfToday, lt: endOfToday } },
    _sum: { amount: true },
  });
  // Today's profit: sum over sale_items of (unitPrice - costPrice)*qty, for sales today
  const todaySaleItems = await db.saleItem.findMany({
    where: { sale: { shopId, saleDate: { gte: startOfToday, lt: endOfToday } } },
    select: { quantity: true, unitPrice: true, costPrice: true, sale: { select: { discount: true, totalAmount: true, subtotal: true } } },
  });
  let grossProfit = 0;
  for (const si of todaySaleItems) {
    grossProfit += (si.unitPrice - si.costPrice) * si.quantity;
  }
  // Approximate discount apportionment
  const todaySubtotal = todaySaleItems.reduce((s, si) => s + si.unitPrice * si.quantity, 0);
  if (todaySubtotal > 0) {
    const discountRatio = todaySaleItems[0]?.sale?.discount ?? 0;
    // use aggregate discount from sales
  }
  const todayDiscountAgg = await db.sale.aggregate({
    where: { shopId, saleDate: { gte: startOfToday, lt: endOfToday } },
    _sum: { discount: true },
  });
  grossProfit -= todayDiscountAgg._sum.discount ?? 0;
  const netProfit = grossProfit - (todayExpenses._sum.amount ?? 0);

  // Customer due (total)
  const customers = await db.customer.findMany({ where: { shopId } });
  let customerDue = customers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  const customerSalesAgg = await db.sale.groupBy({
    by: ["customerId"],
    where: { shopId, customerId: { not: null } },
    _sum: { totalAmount: true, paidAmount: true },
  });
  for (const row of customerSalesAgg) {
    customerDue += (row._sum.totalAmount ?? 0) - (row._sum.paidAmount ?? 0);
  }
  // customer payments reduce due
  const custPayments = await db.payment.aggregate({
    where: { shopId, type: "customer_payment" },
    _sum: { amount: true },
  });
  customerDue -= custPayments._sum.amount ?? 0;

  // Supplier due
  const suppliers = await db.supplier.findMany({ where: { shopId } });
  let supplierDue = suppliers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  const supplierPurchasesAgg = await db.purchase.groupBy({
    by: ["supplierId"],
    where: { shopId, supplierId: { not: null } },
    _sum: { totalAmount: true, paidAmount: true },
  });
  for (const row of supplierPurchasesAgg) {
    supplierDue += (row._sum.totalAmount ?? 0) - (row._sum.paidAmount ?? 0);
  }
  const supPayments = await db.payment.aggregate({
    where: { shopId, type: "supplier_payment" },
    _sum: { amount: true },
  });
  supplierDue -= supPayments._sum.amount ?? 0;

  // Low stock products
  const lowStockProducts = await db.product.findMany({
    where: { shopId, stockQuantity: { lte: db.product.fields.minimumStock } },
    take: 10,
    orderBy: { stockQuantity: "asc" },
  });

  // Recent transactions
  const recentTx = await db.transaction.findMany({
    where: { shopId },
    orderBy: { createdAt: "desc" },
    take: 8,
  });

  // Stock value
  const allProducts = await db.product.findMany({ where: { shopId }, select: { stockQuantity: true, purchasePrice: true } });
  const stockValue = allProducts.reduce((s, p) => s + p.stockQuantity * p.purchasePrice, 0);
  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter((p) => p.stockQuantity <= 0).length;

  // 7-day sales series for chart (batch queries, group in JS to avoid N+1)
  const dayMs = 24 * 60 * 60 * 1000;
  const weekStart = new Date(startOfToday.getTime() - 6 * dayMs);
  const [weekSales, weekPurchases, weekExpenses, weekSaleItems] = await Promise.all([
    db.sale.findMany({ where: { shopId, saleDate: { gte: weekStart, lt: endOfToday } }, select: { totalAmount: true, saleDate: true } }),
    db.purchase.findMany({ where: { shopId, purchaseDate: { gte: weekStart, lt: endOfToday } }, select: { totalAmount: true, purchaseDate: true } }),
    db.expense.findMany({ where: { shopId, expenseDate: { gte: weekStart, lt: endOfToday } }, select: { amount: true, expenseDate: true } }),
    db.saleItem.findMany({ where: { sale: { shopId, saleDate: { gte: weekStart, lt: endOfToday } } }, select: { quantity: true, unitPrice: true, costPrice: true, sale: { select: { saleDate: true } } } }),
  ]);
  const salesSeries: { label: string; sales: number; purchase: number; expense: number; profit: number }[] = [];
  const days = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
  for (let i = 6; i >= 0; i--) {
    const dStart = new Date(startOfToday.getTime() - i * dayMs);
    const dEnd = new Date(dStart.getTime() + dayMs);
    const inRange = (d: Date) => d >= dStart && d < dEnd;
    const sales = weekSales.filter((s) => inRange(s.saleDate)).reduce((sum, s) => sum + s.totalAmount, 0);
    const purchase = weekPurchases.filter((p) => inRange(p.purchaseDate)).reduce((sum, p) => sum + p.totalAmount, 0);
    const expense = weekExpenses.filter((e) => inRange(e.expenseDate)).reduce((sum, e) => sum + e.amount, 0);
    const items = weekSaleItems.filter((si) => inRange(si.sale.saleDate));
    const gross = items.reduce((s, si) => s + (si.unitPrice - si.costPrice) * si.quantity, 0);
    salesSeries.push({
      label: days[dStart.getDay()],
      sales,
      purchase,
      expense,
      profit: gross - expense,
    });
  }

  return NextResponse.json({
    today: {
      sales: todaySales._sum.totalAmount ?? 0,
      purchases: todayPurchases._sum.totalAmount ?? 0,
      expenses: todayExpenses._sum.amount ?? 0,
      grossProfit,
      netProfit,
    },
    dues: {
      customerDue,
      supplierDue,
    },
    stock: {
      totalProducts,
      stockValue,
      lowStockCount,
    },
    lowStockProducts,
    recentTransactions: recentTx,
    salesSeries,
  });
});

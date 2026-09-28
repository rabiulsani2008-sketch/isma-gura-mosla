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
  const endOfToday = new Date(startOfToday.getTime() + 86400000);
  const todayRange = { gte: startOfToday, lt: endOfToday };
  const weekStart = new Date(startOfToday.getTime() - 6 * 86400000);
  const weekRange = { gte: weekStart, lt: endOfToday };

  // Run ALL queries in parallel — single round-trip instead of 10+ sequential
  const [
    todaySales,
    todayPurchases,
    todayExpenses,
    todayDiscountAgg,
    todaySaleItems,
    allCustomers,
    customerSalesAgg,
    custPayments,
    allSuppliers,
    supplierPurchasesAgg,
    supPayments,
    lowStockProducts,
    recentTx,
    allProducts,
    weekSales,
    weekPurchases,
    weekExpenses,
    weekSaleItems,
  ] = await Promise.all([
    db.sale.aggregate({ where: { shopId, saleDate: todayRange }, _sum: { totalAmount: true } }),
    db.purchase.aggregate({ where: { shopId, purchaseDate: todayRange }, _sum: { totalAmount: true } }),
    db.expense.aggregate({ where: { shopId, expenseDate: todayRange }, _sum: { amount: true } }),
    db.sale.aggregate({ where: { shopId, saleDate: todayRange }, _sum: { discount: true } }),
    db.saleItem.findMany({
      where: { sale: { shopId, saleDate: todayRange } },
      select: { quantity: true, unitPrice: true, costPrice: true },
    }),
    db.customer.findMany({ where: { shopId }, select: { openingDue: true } }),
    db.sale.groupBy({
      by: ["customerId"],
      where: { shopId, customerId: { not: null } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    db.payment.aggregate({ where: { shopId, type: "customer_payment" }, _sum: { amount: true } }),
    db.supplier.findMany({ where: { shopId }, select: { openingDue: true } }),
    db.purchase.groupBy({
      by: ["supplierId"],
      where: { shopId, supplierId: { not: null } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    db.payment.aggregate({ where: { shopId, type: "supplier_payment" }, _sum: { amount: true } }),
    db.product.findMany({
      where: { shopId, stockQuantity: { lte: db.product.fields.minimumStock } },
      take: 10,
      orderBy: { stockQuantity: "asc" },
    }),
    db.transaction.findMany({ where: { shopId }, orderBy: { createdAt: "desc" }, take: 8 }),
    db.product.findMany({ where: { shopId }, select: { stockQuantity: true, purchasePrice: true } }),
    db.sale.findMany({ where: { shopId, saleDate: weekRange }, select: { totalAmount: true, saleDate: true } }),
    db.purchase.findMany({ where: { shopId, purchaseDate: weekRange }, select: { totalAmount: true, purchaseDate: true } }),
    db.expense.findMany({ where: { shopId, expenseDate: weekRange }, select: { amount: true, expenseDate: true } }),
    db.saleItem.findMany({
      where: { sale: { shopId, saleDate: weekRange } },
      select: { quantity: true, unitPrice: true, costPrice: true, sale: { select: { saleDate: true } } },
    }),
  ]);

  // Compute profit
  let grossProfit = todaySaleItems.reduce((s, si) => s + (si.unitPrice - si.costPrice) * si.quantity, 0);
  grossProfit -= todayDiscountAgg._sum.discount ?? 0;
  const netProfit = grossProfit - (todayExpenses._sum.amount ?? 0);

  // Compute dues
  let customerDue = allCustomers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  for (const row of customerSalesAgg) {
    customerDue += (row._sum.totalAmount ?? 0) - (row._sum.paidAmount ?? 0);
  }
  customerDue -= custPayments._sum.amount ?? 0;

  let supplierDue = allSuppliers.reduce((s, c) => s + (c.openingDue ?? 0), 0);
  for (const row of supplierPurchasesAgg) {
    supplierDue += (row._sum.totalAmount ?? 0) - (row._sum.paidAmount ?? 0);
  }
  supplierDue -= supPayments._sum.amount ?? 0;

  // Stock value
  const stockValue = allProducts.reduce((s, p) => s + p.stockQuantity * p.purchasePrice, 0);
  const totalProducts = allProducts.length;
  const lowStockCount = allProducts.filter((p) => p.stockQuantity <= 0).length;

  // 7-day series
  const dayMs = 86400000;
  const days = ["রবি", "সোম", "মঙ্গল", "বুধ", "বৃহ", "শুক্র", "শনি"];
  const salesSeries = [];
  for (let i = 6; i >= 0; i--) {
    const dStart = new Date(startOfToday.getTime() - i * dayMs);
    const dEnd = new Date(dStart.getTime() + dayMs);
    const inRange = (d: Date) => d >= dStart && d < dEnd;
    const sales = weekSales.filter((s) => inRange(s.saleDate)).reduce((sum, s) => sum + s.totalAmount, 0);
    const purchase = weekPurchases.filter((p) => inRange(p.purchaseDate)).reduce((sum, p) => sum + p.totalAmount, 0);
    const expense = weekExpenses.filter((e) => inRange(e.expenseDate)).reduce((sum, e) => sum + e.amount, 0);
    const items = weekSaleItems.filter((si) => inRange(si.sale.saleDate));
    const gross = items.reduce((s, si) => s + (si.unitPrice - si.costPrice) * si.quantity, 0);
    salesSeries.push({ label: days[dStart.getDay()], sales, purchase, expense, profit: gross - expense });
  }

  return NextResponse.json({
    today: {
      sales: todaySales._sum.totalAmount ?? 0,
      purchases: todayPurchases._sum.totalAmount ?? 0,
      expenses: todayExpenses._sum.amount ?? 0,
      grossProfit,
      netProfit,
    },
    dues: { customerDue, supplierDue },
    stock: { totalProducts, stockValue, lowStockCount },
    lowStockProducts,
    recentTransactions: recentTx,
    salesSeries,
  });
});

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

// GET /api/backup — export full shop data as JSON
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const shopId = session.shopId;

  const [shop, categories, products, customers, suppliers, sales, purchases, expenses, payments, stockMovements, transactions] = await Promise.all([
    db.shop.findUnique({ where: { id: shopId } }),
    db.category.findMany({ where: { shopId } }),
    db.product.findMany({ where: { shopId } }),
    db.customer.findMany({ where: { shopId } }),
    db.supplier.findMany({ where: { shopId } }),
    db.sale.findMany({ where: { shopId }, include: { items: true } }),
    db.purchase.findMany({ where: { shopId }, include: { items: true } }),
    db.expense.findMany({ where: { shopId } }),
    db.payment.findMany({ where: { shopId } }),
    db.stockMovement.findMany({ where: { shopId } }),
    db.transaction.findMany({ where: { shopId } }),
  ]);

  const data = {
    exportedAt: new Date().toISOString(),
    shop,
    categories,
    products,
    customers,
    suppliers,
    sales,
    purchases,
    expenses,
    payments,
    stockMovements,
    transactions,
  };

  return new NextResponse(JSON.stringify(data, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="backup-${new Date().toISOString().slice(0, 10)}.json"`,
    },
  });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const where: any = { shopId: session.shopId };
  if (search) {
    where.OR = [{ name: { contains: search } }, { phone: { contains: search } }];
  }
  const [suppliers, purchasesAgg, paymentsAgg] = await Promise.all([
    db.supplier.findMany({ where, orderBy: { name: "asc" } }),
    db.purchase.groupBy({
      by: ["supplierId"],
      where: { shopId: session.shopId, supplierId: { not: null } },
      _sum: { totalAmount: true, paidAmount: true },
    }),
    db.payment.groupBy({
      by: ["supplierId"],
      where: { shopId: session.shopId, type: "supplier_payment", supplierId: { not: null } },
      _sum: { amount: true },
    }),
  ]);
  const map = new Map<string, { totalPurchases: number; totalPaid: number }>();
  for (const p of purchasesAgg) {
    if (!p.supplierId) continue;
    const cur = map.get(p.supplierId) || { totalPurchases: 0, totalPaid: 0 };
    cur.totalPurchases += p._sum.totalAmount ?? 0;
    cur.totalPaid += p._sum.paidAmount ?? 0;
    map.set(p.supplierId, cur);
  }
  for (const p of paymentsAgg) {
    if (!p.supplierId) continue;
    const cur = map.get(p.supplierId) || { totalPurchases: 0, totalPaid: 0 };
    cur.totalPaid += p._sum.amount ?? 0;
    map.set(p.supplierId, cur);
  }
  const result = suppliers.map((s) => {
    const agg = map.get(s.id) || { totalPurchases: 0, totalPaid: 0 };
    const due = (s.openingDue ?? 0) + agg.totalPurchases - agg.totalPaid;
    return { ...s, totalPurchases: agg.totalPurchases, totalPaid: agg.totalPaid, due };
  });
  return NextResponse.json({ suppliers: result });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  if (!body.name?.trim()) return NextResponse.json({ error: "নাম দিন" }, { status: 400 });
  if (!body.phone) return NextResponse.json({ error: "মোবাইল নম্বর দিন" }, { status: 400 });
  const supplier = await db.supplier.create({
    data: {
      shopId: session.shopId,
      name: body.name.trim(),
      phone: String(body.phone).trim(),
      address: body.address || null,
      openingDue: Number(body.openingDue) || 0,
    },
  });
  return NextResponse.json({ supplier });
});

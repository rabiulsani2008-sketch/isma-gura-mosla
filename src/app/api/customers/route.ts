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
    where.OR = [
      { name: { contains: search } },
      { phone: { contains: search } },
    ];
  }
  const customers = await db.customer.findMany({
    where,
    orderBy: { name: "asc" },
  });

  // Compute dues + totals
  const salesAgg = await db.sale.groupBy({
    by: ["customerId"],
    where: { shopId: session.shopId, customerId: { not: null } },
    _sum: { totalAmount: true, paidAmount: true },
  });
  const paymentsAgg = await db.payment.groupBy({
    by: ["customerId"],
    where: { shopId: session.shopId, type: "customer_payment", customerId: { not: null } },
    _sum: { amount: true },
  });
  const map = new Map<string, { totalSales: number; totalPaid: number; due: number }>();
  for (const s of salesAgg) {
    if (!s.customerId) continue;
    const cur = map.get(s.customerId) || { totalSales: 0, totalPaid: 0, due: 0 };
    cur.totalSales += s._sum.totalAmount ?? 0;
    cur.totalPaid += s._sum.paidAmount ?? 0;
    map.set(s.customerId, cur);
  }
  for (const p of paymentsAgg) {
    if (!p.customerId) continue;
    const cur = map.get(p.customerId) || { totalSales: 0, totalPaid: 0, due: 0 };
    cur.totalPaid += p._sum.amount ?? 0;
    map.set(p.customerId, cur);
  }
  const result = customers.map((c) => {
    const agg = map.get(c.id) || { totalSales: 0, totalPaid: 0, due: 0 };
    const due = (c.openingDue ?? 0) + agg.totalSales - agg.totalPaid;
    return {
      ...c,
      totalSales: agg.totalSales,
      totalPaid: agg.totalPaid,
      due,
    };
  });
  return NextResponse.json({ customers: result });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  if (!body.name || !body.name.trim()) return NextResponse.json({ error: "নাম দিন" }, { status: 400 });
  if (!body.phone) return NextResponse.json({ error: "মোবাইল নম্বর দিন" }, { status: 400 });
  const customer = await db.customer.create({
    data: {
      shopId: session.shopId,
      name: body.name.trim(),
      phone: String(body.phone).trim(),
      address: body.address || null,
      openingDue: Number(body.openingDue) || 0,
    },
  });
  return NextResponse.json({ customer });
});

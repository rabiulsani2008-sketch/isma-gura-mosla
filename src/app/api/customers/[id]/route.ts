import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const customer = await db.customer.findFirst({ where: { id, shopId: session.shopId } });
  if (!customer) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });

  const sales = await db.sale.findMany({
    where: { customerId: id, shopId: session.shopId },
    include: { items: { include: { product: true } } },
    orderBy: { saleDate: "desc" },
    take: 100,
  });
  const payments = await db.payment.findMany({
    where: { customerId: id, shopId: session.shopId, type: "customer_payment" },
    orderBy: { paymentDate: "desc" },
  });
  const totalSales = sales.reduce((s, x) => s + x.totalAmount, 0);
  const totalPaidSales = sales.reduce((s, x) => s + x.paidAmount, 0);
  const totalPayments = payments.reduce((s, x) => s + x.amount, 0);
  const due = (customer.openingDue ?? 0) + totalSales - totalPaidSales - totalPayments;

  return NextResponse.json({
    customer,
    sales,
    payments,
    summary: { totalSales, totalPaid: totalPaidSales + totalPayments, due },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const customer = await db.customer.update({
    where: { id },
    data: {
      name: body.name?.trim(),
      phone: body.phone,
      address: body.address,
      openingDue: body.openingDue != null ? Number(body.openingDue) : undefined,
    },
  });
  return NextResponse.json({ customer });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const salesCount = await db.sale.count({ where: { customerId: id } });
  if (salesCount > 0) {
    return NextResponse.json({ error: "এই গ্রাহকের বিক্রি আছে, মুছা যাবে না" }, { status: 400 });
  }
  await db.customer.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

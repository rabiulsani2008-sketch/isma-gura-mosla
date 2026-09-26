import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const supplier = await db.supplier.findFirst({ where: { id, shopId: session.shopId } });
  if (!supplier) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  const purchases = await db.purchase.findMany({
    where: { supplierId: id, shopId: session.shopId },
    include: { items: { include: { product: true } } },
    orderBy: { purchaseDate: "desc" },
    take: 100,
  });
  const payments = await db.payment.findMany({
    where: { supplierId: id, shopId: session.shopId, type: "supplier_payment" },
    orderBy: { paymentDate: "desc" },
  });
  const totalPurchases = purchases.reduce((s, x) => s + x.totalAmount, 0);
  const totalPaidPurchases = purchases.reduce((s, x) => s + x.paidAmount, 0);
  const totalPayments = payments.reduce((s, x) => s + x.amount, 0);
  const due = (supplier.openingDue ?? 0) + totalPurchases - totalPaidPurchases - totalPayments;
  return NextResponse.json({
    supplier,
    purchases,
    payments,
    summary: { totalPurchases, totalPaid: totalPaidPurchases + totalPayments, due },
  });
}

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();
  const supplier = await db.supplier.update({
    where: { id },
    data: {
      name: body.name?.trim(),
      phone: body.phone,
      address: body.address,
      openingDue: body.openingDue != null ? Number(body.openingDue) : undefined,
    },
  });
  return NextResponse.json({ supplier });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const count = await db.purchase.count({ where: { supplierId: id } });
  if (count > 0) return NextResponse.json({ error: "এই সরবরাহকারীর ক্রয় আছে, মুছা যাবে না" }, { status: 400 });
  await db.supplier.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // customer_payment | supplier_payment
  const where: any = { shopId: session.shopId };
  if (type) where.type = type;
  const payments = await db.payment.findMany({
    where,
    include: { customer: true, supplier: true },
    orderBy: { paymentDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ payments });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  const type = body.type; // customer_payment | supplier_payment
  if (!type || !["customer_payment", "supplier_payment"].includes(type)) {
    return NextResponse.json({ error: "ভুল পেমেন্ট টাইপ" }, { status: 400 });
  }
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "পরিমাণ ০-এর বেশি হতে হবে" }, { status: 400 });

  if (type === "customer_payment" && !body.customerId) {
    return NextResponse.json({ error: "গ্রাহক নির্বাচন করুন" }, { status: 400 });
  }
  if (type === "supplier_payment" && !body.supplierId) {
    return NextResponse.json({ error: "সরবরাহকারী নির্বাচন করুন" }, { status: 400 });
  }

  const payment = await db.payment.create({
    data: {
      shopId: session.shopId,
      customerId: type === "customer_payment" ? body.customerId : null,
      supplierId: type === "supplier_payment" ? body.supplierId : null,
      amount,
      type,
      paymentMethod: body.paymentMethod || "নগদ",
      note: body.note || null,
      paymentDate: body.paymentDate ? new Date(body.paymentDate) : new Date(),
    },
  });

  const partyName = type === "customer_payment" ? body.customerName : body.supplierName;
  await db.transaction.create({
    data: {
      shopId: session.shopId,
      type,
      paymentId: payment.id,
      description: `${type === "customer_payment" ? "গ্রাহক পাওনা" : "সরবরাহকারী দেনা"} - ${partyName || ""}`,
      amount,
      paymentMethod: body.paymentMethod || "নগদ",
      createdAt: payment.paymentDate,
    },
  });

  return NextResponse.json({ payment });
}

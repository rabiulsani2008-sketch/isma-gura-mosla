import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: any = { shopId: session.shopId };
  if (from || to) {
    where.purchaseDate = {};
    if (from) where.purchaseDate.gte = new Date(from);
    if (to) where.purchaseDate.lt = new Date(new Date(to).getTime() + 86400000);
  }
  const purchases = await db.purchase.findMany({
    where,
    include: { supplier: true, items: { include: { product: true } } },
    orderBy: { purchaseDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ purchases });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const shopId = session.shopId;
  const body = await req.json();
  const items: { productId: string; quantity: number; unitPrice: number }[] = body.items || [];
  if (items.length === 0) return NextResponse.json({ error: "কার্টে অন্তত একটি পণ্য দিন" }, { status: 400 });

  for (const it of items) {
    if (it.quantity <= 0) return NextResponse.json({ error: "পরিমাণ ০-এর বেশি হতে হবে" }, { status: 400 });
    if (it.unitPrice < 0) return NextResponse.json({ error: "ক্রয় মূল্য সঠিক নয়" }, { status: 400 });
  }

  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const paid = Math.min(Number(body.paidAmount) || 0, total);
  const due = total - paid;
  const paymentMethod = body.paymentMethod || "নগদ";

  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const countToday = await db.purchase.count({ where: { shopId, purchaseDate: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } });
  const invoiceNumber = `PUR-${ymd}-${String(countToday + 1).padStart(4, "0")}`;

  const purchase = await db.purchase.create({
    data: {
      shopId,
      supplierId: body.supplierId || null,
      invoiceNumber,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentMethod,
      purchaseDate: new Date(),
    },
  });

  for (const it of items) {
    await db.purchaseItem.create({
      data: { purchaseId: purchase.id, productId: it.productId, quantity: it.quantity, unitPrice: it.unitPrice, total: it.unitPrice * it.quantity },
    });
    await db.stockMovement.create({
      data: { shopId, productId: it.productId, type: "purchase", quantity: it.quantity, reference: invoiceNumber },
    });
    // Increase stock + update product purchase price to latest
    await db.product.update({
      where: { id: it.productId },
      data: { stockQuantity: { increment: it.quantity }, purchasePrice: it.unitPrice },
    });
  }

  await db.transaction.create({
    data: { shopId, type: "purchase", purchaseId: purchase.id, description: `ক্রয় - ${invoiceNumber}`, amount: total, paymentMethod, createdAt: new Date() },
  });

  return NextResponse.json({ purchase, invoiceNumber });
});

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");

  const where: any = { shopId: session.shopId };
  if (from || to) {
    where.saleDate = {};
    if (from) where.saleDate.gte = new Date(from);
    if (to) where.saleDate.lt = new Date(new Date(to).getTime() + 86400000);
  }

  const sales = await db.sale.findMany({
    where,
    include: {
      customer: true,
      items: { include: { product: true } },
    },
    orderBy: { saleDate: "desc" },
    take: 200,
  });
  return NextResponse.json({ sales });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const shopId = session.shopId;
  const body = await req.json();

  const items: { productId: string; name: string; quantity: number; unitPrice: number; costPrice: number }[] = body.items || [];
  if (items.length === 0) {
    return NextResponse.json({ error: "কার্টে অন্তত একটি পণ্য দিন" }, { status: 400 });
  }

  // Validate stock availability + capture cost price
  for (const it of items) {
    const p = await db.product.findFirst({ where: { id: it.productId, shopId } });
    if (!p) return NextResponse.json({ error: `পণ্য পাওয়া যায়নি` }, { status: 400 });
    if (it.quantity > p.stockQuantity) {
      return NextResponse.json({ error: `${p.name}: পর্যাপ্ত স্টক নেই (আছে ${p.stockQuantity} ${p.unit})` }, { status: 400 });
    }
    it.costPrice = p.purchasePrice; // snapshot
  }

  const subtotal = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const discount = Math.min(Number(body.discount) || 0, subtotal);
  const total = Math.max(0, subtotal - discount);
  const paid = Math.min(Number(body.paidAmount) || 0, total);
  const due = total - paid;
  const paymentMethod = body.paymentMethod || "নগদ";

  // Generate invoice number
  const today = new Date();
  const ymd = `${today.getFullYear()}${String(today.getMonth() + 1).padStart(2, "0")}${String(today.getDate()).padStart(2, "0")}`;
  const countToday = await db.sale.count({ where: { shopId, saleDate: { gte: new Date(today.getFullYear(), today.getMonth(), today.getDate()) } } });
  const invoiceNumber = `INV-${ymd}-${String(countToday + 1).padStart(4, "0")}`;

  const sale = await db.sale.create({
    data: {
      shopId,
      customerId: body.customerId || null,
      invoiceNumber,
      subtotal,
      discount,
      totalAmount: total,
      paidAmount: paid,
      dueAmount: due,
      paymentMethod,
      saleDate: new Date(),
    },
  });

  // Create sale items + reduce stock + stock movement
  for (const it of items) {
    await db.saleItem.create({
      data: {
        saleId: sale.id,
        productId: it.productId,
        quantity: it.quantity,
        unitPrice: it.unitPrice,
        costPrice: it.costPrice,
        total: it.unitPrice * it.quantity,
      },
    });
    await db.stockMovement.create({
      data: { shopId, productId: it.productId, type: "sale", quantity: -it.quantity, reference: invoiceNumber },
    });
    await db.product.update({
      where: { id: it.productId },
      data: { stockQuantity: { decrement: it.quantity } },
    });
  }

  // Ledger transaction
  await db.transaction.create({
    data: {
      shopId,
      type: "sale",
      saleId: sale.id,
      description: `বিক্রি - ${invoiceNumber}`,
      amount: total,
      paymentMethod,
      createdAt: new Date(),
    },
  });

  return NextResponse.json({ sale, invoiceNumber });
}

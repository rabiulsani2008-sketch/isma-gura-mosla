import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const body = await req.json();

  let categoryId: string | null = null;
  if (body.category) {
    let cat = await db.category.findFirst({ where: { shopId: session.shopId, name: body.category } });
    if (!cat) cat = await db.category.create({ data: { shopId: session.shopId, name: body.category } });
    categoryId = cat.id;
  }

  const product = await db.product.update({
    where: { id },
    data: {
      name: body.name?.trim(),
      categoryId,
      unit: body.unit,
      purchasePrice: body.purchasePrice != null ? Number(body.purchasePrice) : undefined,
      sellingPrice: body.sellingPrice != null ? Number(body.sellingPrice) : undefined,
      minimumStock: body.minimumStock != null ? Number(body.minimumStock) : undefined,
      imageUrl: body.imageUrl,
      description: body.description,
    },
    include: { category: true },
  });
  return NextResponse.json({ product });
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  // Check no sales/purchases reference it
  const count = await db.saleItem.count({ where: { productId: id } });
  if (count > 0) {
    return NextResponse.json({ error: "এই পণ্যের বিক্রি আছে, মুছা যাবে না" }, { status: 400 });
  }
  await db.product.delete({ where: { id } });
  return NextResponse.json({ ok: true });
}

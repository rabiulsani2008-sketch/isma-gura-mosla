import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const search = searchParams.get("search") || "";
  const category = searchParams.get("category") || "";

  const where: any = { shopId: session.shopId };
  if (search) where.name = { contains: search };
  if (category && category !== "সব") where.category = { name: category };

  const products = await db.product.findMany({
    where,
    include: { category: true },
    orderBy: { name: "asc" },
  });
  return NextResponse.json({ products });
}

export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();

  if (!body.name || !body.name.trim()) {
    return NextResponse.json({ error: "দয়া করে পণ্যের নাম দিন" }, { status: 400 });
  }
  if (body.sellingPrice == null || Number(body.sellingPrice) < 0) {
    return NextResponse.json({ error: "বিক্রয় মূল্য সঠিক নয়" }, { status: 400 });
  }

  // Find or create category
  let category: { id: string } | null = null;
  if (body.category) {
    category = await db.category.findFirst({ where: { shopId: session.shopId, name: body.category } });
    if (!category) {
      category = await db.category.create({ data: { shopId: session.shopId, name: body.category } });
    }
  }

  const existing = await db.product.findFirst({ where: { shopId: session.shopId, name: body.name.trim() } });
  if (existing) {
    return NextResponse.json({ error: "এই নামের পণ্য ইতিমধ্যে আছে" }, { status: 400 });
  }

  const openingStock = Number(body.stockQuantity) || 0;

  const product = await db.product.create({
    data: {
      shopId: session.shopId,
      categoryId: category?.id,
      name: body.name.trim(),
      unit: body.unit || "kg",
      purchasePrice: Number(body.purchasePrice) || 0,
      sellingPrice: Number(body.sellingPrice) || 0,
      stockQuantity: openingStock,
      minimumStock: Number(body.minimumStock) || 0,
      imageUrl: body.imageUrl || null,
      description: body.description || null,
    },
    include: { category: true },
  });

  // Opening stock movement
  if (openingStock !== 0) {
    await db.stockMovement.create({
      data: {
        shopId: session.shopId,
        productId: product.id,
        type: "adjustment",
        quantity: openingStock,
        reference: "Opening stock",
      },
    });
  }

  return NextResponse.json({ product });
}

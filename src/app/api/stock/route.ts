import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: Request) => {
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

  const totalStockValue = products.reduce((s, p) => s + p.stockQuantity * p.purchasePrice, 0);
  const lowStockCount = products.filter((p) => p.stockQuantity <= p.minimumStock && p.minimumStock > 0).length;
  const zeroStockCount = products.filter((p) => p.stockQuantity <= 0).length;

  return NextResponse.json({
    products,
    summary: {
      totalProducts: products.length,
      totalStockValue,
      lowStockCount,
      zeroStockCount,
    },
  });
});

// Stock adjustment
export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  const { productId, newQuantity, note } = body;
  if (!productId) return NextResponse.json({ error: "পণ্য দিন" }, { status: 400 });
  const product = await db.product.findFirst({ where: { id: productId, shopId: session.shopId } });
  if (!product) return NextResponse.json({ error: "পণ্য পাওয়া যায়নি" }, { status: 404 });

  const delta = Number(newQuantity) - product.stockQuantity;
  await db.product.update({ where: { id: productId }, data: { stockQuantity: Number(newQuantity) } });
  await db.stockMovement.create({
    data: {
      shopId: session.shopId,
      productId,
      type: "adjustment",
      quantity: delta,
      reference: note || "Manual adjustment",
    },
  });
  return NextResponse.json({ ok: true, product: { ...product, stockQuantity: Number(newQuantity) } });
});

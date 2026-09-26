import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type"); // sale|purchase|expense|customer_payment|supplier_payment | all
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const search = searchParams.get("search") || "";

  const where: any = { shopId: session.shopId };
  if (type && type !== "all") where.type = type;
  if (from || to) {
    where.createdAt = {};
    if (from) where.createdAt.gte = new Date(from);
    if (to) where.createdAt.lt = new Date(new Date(to).getTime() + 86400000);
  }
  if (search) where.description = { contains: search };

  const transactions = await db.transaction.findMany({
    where,
    orderBy: { createdAt: "desc" },
    take: 300,
  });
  return NextResponse.json({ transactions });
}

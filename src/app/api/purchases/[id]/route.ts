import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function GET(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { id } = await params;
  const purchase = await db.purchase.findFirst({
    where: { id, shopId: session.shopId },
    include: { supplier: true, items: { include: { product: true } }, shop: true },
  });
  if (!purchase) return NextResponse.json({ error: "পাওয়া যায়নি" }, { status: 404 });
  return NextResponse.json({ purchase });
}

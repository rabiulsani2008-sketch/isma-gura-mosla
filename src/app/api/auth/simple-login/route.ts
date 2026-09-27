import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (req: Request) => {
  const { shopCode } = await req.json();

  if (!shopCode || !shopCode.trim()) {
    return NextResponse.json({ error: "শপ কোড দিন" }, { status: 400 });
  }

  const code = shopCode.trim().toUpperCase();
  const shop = await db.shop.findUnique({ where: { shopCode: code } });

  if (!shop) {
    return NextResponse.json({ error: "ভুল শপ কোড। আবার চেষ্টা করুন।" }, { status: 401 });
  }

  await setSession({
    shopId: shop.id,
    userId: "shared",
    shopName: shop.name,
    userName: shop.ownerName || "Shop User",
    role: "owner",
  });

  return NextResponse.json({
    ok: true,
    session: {
      shopId: shop.id,
      userId: "shared",
      shopName: shop.name,
      userName: shop.ownerName || "Shop User",
      role: "owner",
    },
  });
});

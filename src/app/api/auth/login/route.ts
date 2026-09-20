import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";

export async function POST(req: Request) {
  const { phone, pin } = await req.json();
  if (!phone || !pin) {
    return NextResponse.json({ error: "মোবাইল নম্বর ও PIN দিন" }, { status: 400 });
  }
  const user = await db.user.findFirst({
    where: { phone: String(phone).trim() },
    include: { shop: true },
  });
  if (!user || user.pin !== String(pin)) {
    return NextResponse.json({ error: "মোবাইল নম্বর বা PIN ভুল হয়েছে" }, { status: 401 });
  }
  await setSession({
    shopId: user.shopId,
    userId: user.id,
    shopName: user.shop.name,
    userName: user.name,
  });
  return NextResponse.json({
    ok: true,
    session: {
      shopId: user.shopId,
      userId: user.id,
      shopName: user.shop.name,
      userName: user.name,
    },
  });
}

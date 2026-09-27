import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { verifyPassword } from "@/lib/password";
import { apiHandler } from "@/lib/api-handler";

export const POST = apiHandler(async (req: Request) => {
  const { phone, password } = await req.json();
  if (!phone || !password) {
    return NextResponse.json({ error: "PHONE_PASSWORD_REQUIRED" }, { status: 400 });
  }
  const user = await db.user.findFirst({
    where: { phone: String(phone).trim() },
    include: { shop: true },
  });
  if (!user || !verifyPassword(String(password), user.passwordHash)) {
    return NextResponse.json({ error: "LOGIN_FAILED" }, { status: 401 });
  }
  await setSession({
    shopId: user.shopId,
    userId: user.id,
    shopName: user.shop.name,
    userName: user.name,
    role: user.role,
  });
  return NextResponse.json({
    ok: true,
    session: {
      shopId: user.shopId,
      userId: user.id,
      shopName: user.shop.name,
      userName: user.name,
      role: user.role,
    },
  });
});

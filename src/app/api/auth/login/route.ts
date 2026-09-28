import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { verifyPassword, hashPassword } from "@/lib/password";
import { apiHandler } from "@/lib/api-handler";

/**
 * SIMPLE LOGIN: phone + password
 * Same account works on ANY device — no device locking.
 * Multiple devices can login with the same phone+password simultaneously.
 */
export const POST = apiHandler(async (req: Request) => {
  const { phone, password } = await req.json();

  if (!phone || !password) {
    return NextResponse.json({ error: "মোবাইল নম্বর ও পাসওয়ার্ড দিন" }, { status: 400 });
  }

  // Find shop by phone number
  const shop = await db.shop.findFirst({ where: { phone: String(phone).trim() } });

  if (!shop) {
    return NextResponse.json({ error: "এই নম্বরে কোনো দোকান নেই। নতুন অ্যাকাউন্ট তৈরি করুন।" }, { status: 401 });
  }

  // Check password — shop's passwordHash field
  // For backward compat: if no password set yet, use default "1234" for demo shop
  const storedHash = (shop as any).passwordHash;
  let valid = false;
  if (storedHash) {
    valid = verifyPassword(String(password), storedHash);
  } else if (String(password) === "1234") {
    // Demo shop: set the password hash now
    valid = true;
    await db.shop.update({
      where: { id: shop.id },
      data: { passwordHash: hashPassword("1234") } as any,
    });
  }

  if (!valid) {
    return NextResponse.json({ error: "ভুল পাসওয়ার্ড" }, { status: 401 });
  }

  await setSession({
    shopId: shop.id,
    userId: shop.phone,
    shopName: shop.name,
    userName: shop.ownerName,
    role: "owner",
  });

  return NextResponse.json({
    ok: true,
    session: {
      shopId: shop.id,
      userId: shop.phone,
      shopName: shop.name,
      userName: shop.ownerName,
      role: "owner",
    },
  });
});

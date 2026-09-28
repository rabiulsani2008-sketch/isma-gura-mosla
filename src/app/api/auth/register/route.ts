import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { hashPassword, generateShopCode } from "@/lib/password";
import { apiHandler } from "@/lib/api-handler";

/**
 * SIMPLE REGISTER: phone + password + shop name
 * Same account works on ANY device — login with phone+password anywhere.
 * No shop codes to share, no member management.
 */
export const POST = apiHandler(async (req: Request) => {
  const { phone, password, shopName, ownerName } = await req.json();

  if (!phone || !phone.trim()) {
    return NextResponse.json({ error: "মোবাইল নম্বর দিন" }, { status: 400 });
  }
  if (!password || password.length < 4) {
    return NextResponse.json({ error: "পাসওয়ার্ড কমপক্ষে ৪ অঙ্কের হতে হবে" }, { status: 400 });
  }
  if (!shopName || !shopName.trim()) {
    return NextResponse.json({ error: "দোকানের নাম দিন" }, { status: 400 });
  }

  // Check if phone already used
  const existing = await db.shop.findFirst({ where: { phone: phone.trim() } });
  if (existing) {
    return NextResponse.json({ error: "এই নম্বরে একটি দোকান আছে। লগইন করুন।" }, { status: 400 });
  }

  // Generate a shop code (internal, not shown to user)
  let shopCode = generateShopCode();
  let tries = 0;
  while (await db.shop.findUnique({ where: { shopCode } })) {
    shopCode = generateShopCode();
    if (++tries > 20) break;
  }

  const shop = await db.shop.create({
    data: {
      name: shopName.trim(),
      ownerName: (ownerName || shopName).trim(),
      phone: phone.trim(),
      passwordHash: hashPassword(password),
      address: "",
      shopCode,
      tagline: "গুণগত মান, বিশ্বাস আমাদের",
    },
  });

  // Seed default categories
  await db.$transaction(
    ["মসলা", "গুঁড়া মসলা", "শুকনা মসলা", "অন্যান্য"].map((name) =>
      db.category.create({ data: { shopId: shop.id, name } })
    )
  );

  await setSession({
    shopId: shop.id,
    userId: phone.trim(),
    shopName: shop.name,
    userName: shop.ownerName,
    role: "owner",
  });

  return NextResponse.json({
    ok: true,
    session: {
      shopId: shop.id,
      userId: phone.trim(),
      shopName: shop.name,
      userName: shop.ownerName,
      role: "owner",
    },
  });
});

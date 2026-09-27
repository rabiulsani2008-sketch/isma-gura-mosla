import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";
import { generateShopCode } from "@/lib/password";

/**
 * SUPER SIMPLE SHOP CREATION — just enter shop name, get a code to share.
 * No accounts, no passwords, no phone numbers.
 *
 * POST /api/auth/create-shop
 * Body: { shopName: "...", ownerName: "..." }
 */
export const POST = apiHandler(async (req: Request) => {
  const { shopName, ownerName } = await req.json();

  if (!shopName || !shopName.trim()) {
    return NextResponse.json({ error: "দোকানের নাম দিন" }, { status: 400 });
  }

  // Generate unique shop code
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
      phone: "00000000000", // not used in simple mode
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

  // Auto-login
  await setSession({
    shopId: shop.id,
    userId: "shared",
    shopName: shop.name,
    userName: shop.ownerName,
    role: "owner",
  });

  return NextResponse.json({
    ok: true,
    shopCode,
    session: {
      shopId: shop.id,
      userId: "shared",
      shopName: shop.name,
      userName: shop.ownerName,
      role: "owner",
    },
  });
});

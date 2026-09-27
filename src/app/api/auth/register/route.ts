import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { setSession } from "@/lib/auth";
import { hashPassword, generateShopCode } from "@/lib/password";
import { apiHandler } from "@/lib/api-handler";

interface Body {
  name: string;
  phone: string;
  password: string;
  shopName?: string;
  shopCode?: string; // if joining existing shop
  ownerName?: string;
  address?: string;
}

// POST /api/auth/register
// - With shopCode: join existing shop as staff
// - Without shopCode: create new shop as owner
export const POST = apiHandler(async (req: Request) => {
  const body = (await req.json()) as Body;

  if (!body.name?.trim()) return NextResponse.json({ error: "NAME_REQUIRED" }, { status: 400 });
  if (!body.phone?.trim()) return NextResponse.json({ error: "PHONE_REQUIRED" }, { status: 400 });
  if (!body.password || body.password.length < 4)
    return NextResponse.json({ error: "PASSWORD_SHORT" }, { status: 400 });

  const phone = body.phone.trim();

  // Join existing shop
  if (body.shopCode) {
    const shop = await db.shop.findUnique({ where: { shopCode: body.shopCode.trim().toUpperCase() } });
    if (!shop) return NextResponse.json({ error: "INVALID_SHOP_CODE" }, { status: 400 });

    const existingUser = await db.user.findFirst({ where: { shopId: shop.id, phone } });
    if (existingUser) return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });

    const user = await db.user.create({
      data: {
        shopId: shop.id,
        name: body.name.trim(),
        phone,
        passwordHash: hashPassword(body.password),
        role: "staff",
      },
    });

    await setSession({
      shopId: shop.id,
      userId: user.id,
      shopName: shop.name,
      userName: user.name,
      role: user.role,
    });

    return NextResponse.json({
      ok: true,
      session: { shopId: shop.id, userId: user.id, shopName: shop.name, userName: user.name, role: user.role },
    });
  }

  // Create new shop
  if (!body.shopName?.trim()) return NextResponse.json({ error: "SHOP_NAME_REQUIRED" }, { status: 400 });

  // Ensure phone is unique across all users
  const phoneUsed = await db.user.findFirst({ where: { phone } });
  if (phoneUsed) return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });

  let shopCode = generateShopCode();
  let tries = 0;
  while (await db.shop.findUnique({ where: { shopCode } })) {
    shopCode = generateShopCode();
    if (++tries > 20) break;
  }

  const shop = await db.shop.create({
    data: {
      name: body.shopName.trim(),
      ownerName: body.ownerName?.trim() || body.name.trim(),
      phone,
      address: body.address?.trim() || "",
      shopCode,
      tagline: "গুণগত মান, বিশ্বাস আমাদের",
    },
  });

  const user = await db.user.create({
    data: {
      shopId: shop.id,
      name: body.name.trim(),
      phone,
      passwordHash: hashPassword(body.password),
      role: "owner",
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
    userId: user.id,
    shopName: shop.name,
    userName: user.name,
    role: user.role,
  });

  return NextResponse.json({
    ok: true,
    shopCode,
    session: { shopId: shop.id, userId: user.id, shopName: shop.name, userName: user.name, role: user.role },
  });
});

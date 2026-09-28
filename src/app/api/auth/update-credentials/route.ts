import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";
import { apiHandler } from "@/lib/api-handler";

/**
 * Update phone number and/or password.
 *
 * IMPORTANT: This ONLY updates the login credentials (phone + password).
 * It does NOT touch any shop data — products, sales, customers, suppliers,
 * expenses, transactions, stock — everything stays 100% the same.
 *
 * Current password is OPTIONAL (private app, no security needed).
 *
 * POST /api/auth/update-credentials
 * Body: { newPhone?, newPassword? }
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { newPhone, newPassword } = await req.json();

  const shop = await db.shop.findUnique({ where: { id: session.shopId } });
  if (!shop) {
    return NextResponse.json({ error: "দোকান পাওয়া যায়নি" }, { status: 404 });
  }

  // Prepare update data — ONLY credentials, never touch business data
  const updateData: any = {};

  // Update phone if provided and different
  if (newPhone && newPhone.trim() && newPhone.trim() !== shop.phone) {
    const existing = await db.shop.findFirst({
      where: { phone: newPhone.trim(), id: { not: shop.id } },
    });
    if (existing) {
      return NextResponse.json({ error: "এই নম্বর অন্য দোকানে ব্যবহৃত হচ্ছে" }, { status: 400 });
    }
    updateData.phone = newPhone.trim();
  }

  // Update password if provided
  if (newPassword) {
    if (newPassword.length < 4) {
      return NextResponse.json({ error: "নতুন পাসওয়ার্ড কমপক্ষে ৪ অঙ্কের হতে হবে" }, { status: 400 });
    }
    updateData.passwordHash = hashPassword(newPassword);
  }

  if (Object.keys(updateData).length === 0) {
    return NextResponse.json({ error: "কিছু পরিবর্তন করুন" }, { status: 400 });
  }

  // ONLY update the Shop's phone + passwordHash — nothing else
  await db.shop.update({ where: { id: shop.id }, data: updateData });

  return NextResponse.json({
    ok: true,
    phone: updateData.phone || shop.phone,
    message: "শুধু লগইন তথ্য আপডেট হয়েছে। আপনার সব ডেটা আগের মতোই আছে।",
  });
});

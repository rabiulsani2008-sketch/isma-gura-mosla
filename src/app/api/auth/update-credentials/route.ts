import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword, verifyPassword } from "@/lib/password";
import { apiHandler } from "@/lib/api-handler";

/**
 * Update phone number and/or password.
 * Requires current password for security.
 *
 * POST /api/auth/update-credentials
 * Body: { currentPassword, newPhone?, newPassword? }
 */
export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });

  const { currentPassword, newPhone, newPassword } = await req.json();

  if (!currentPassword) {
    return NextResponse.json({ error: "বর্তমান পাসওয়ার্ড দিন" }, { status: 400 });
  }

  // Find the shop
  const shop = await db.shop.findUnique({ where: { id: session.shopId } });
  if (!shop) {
    return NextResponse.json({ error: "দোকান পাওয়া যায়নি" }, { status: 404 });
  }

  // Verify current password
  const storedHash = (shop as any).passwordHash;
  let valid = false;
  if (storedHash) {
    valid = verifyPassword(currentPassword, storedHash);
  } else if (currentPassword === "1234") {
    valid = true;
  }

  if (!valid) {
    return NextResponse.json({ error: "বর্তমান পাসওয়ার্ড ভুল" }, { status: 400 });
  }

  // Prepare update data
  const updateData: any = {};

  // Update phone if provided and different
  if (newPhone && newPhone.trim() && newPhone.trim() !== shop.phone) {
    // Check if phone is used by another shop
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

  await db.shop.update({ where: { id: shop.id }, data: updateData });

  return NextResponse.json({ ok: true, phone: updateData.phone || shop.phone });
});

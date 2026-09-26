import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { hashPassword } from "@/lib/password";

// GET /api/members — list shop members
export async function GET() {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const users = await db.user.findMany({
    where: { shopId: session.shopId },
    orderBy: { createdAt: "asc" },
    select: { id: true, name: true, phone: true, role: true, createdAt: true },
  });
  const shop = await db.shop.findUnique({ where: { id: session.shopId }, select: { shopCode: true } });
  return NextResponse.json({ users, shopCode: shop?.shopCode });
}

// POST /api/members — add a new staff member to this shop
export async function POST(req: Request) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { name, phone, password } = await req.json();
  if (!name?.trim()) return NextResponse.json({ error: "Name required" }, { status: 400 });
  if (!phone?.trim()) return NextResponse.json({ error: "Phone required" }, { status: 400 });
  if (!password || password.length < 4) return NextResponse.json({ error: "PASSWORD_SHORT" }, { status: 400 });

  const phoneUsed = await db.user.findFirst({ where: { phone: phone.trim() } });
  if (phoneUsed) return NextResponse.json({ error: "PHONE_EXISTS" }, { status: 400 });

  const user = await db.user.create({
    data: {
      shopId: session.shopId,
      name: name.trim(),
      phone: phone.trim(),
      passwordHash: hashPassword(password),
      role: "staff",
    },
    select: { id: true, name: true, phone: true, role: true, createdAt: true },
  });
  return NextResponse.json({ user });
}

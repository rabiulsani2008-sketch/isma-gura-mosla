import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async () => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const shop = await db.shop.findUnique({ where: { id: session.shopId } });
  return NextResponse.json({ shop });
});

export const PUT = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  const shop = await db.shop.update({
    where: { id: session.shopId },
    data: {
      name: body.name,
      ownerName: body.ownerName,
      phone: body.phone,
      address: body.address,
      tagline: body.tagline,
      language: body.language,
    },
  });
  return NextResponse.json({ shop });
});

import { NextResponse } from "next/server";
import { db } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { apiHandler } from "@/lib/api-handler";

export const GET = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const from = searchParams.get("from");
  const to = searchParams.get("to");
  const where: any = { shopId: session.shopId };
  if (from || to) {
    where.expenseDate = {};
    if (from) where.expenseDate.gte = new Date(from);
    if (to) where.expenseDate.lt = new Date(new Date(to).getTime() + 86400000);
  }
  const expenses = await db.expense.findMany({ where, orderBy: { expenseDate: "desc" }, take: 200 });
  return NextResponse.json({ expenses });
});

export const POST = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const body = await req.json();
  if (!body.category) return NextResponse.json({ error: "খরচের ধরন নির্বাচন করুন" }, { status: 400 });
  const amount = Number(body.amount);
  if (!amount || amount <= 0) return NextResponse.json({ error: "পরিমাণ ০-এর বেশি হতে হবে" }, { status: 400 });

  const expense = await db.expense.create({
    data: {
      shopId: session.shopId,
      category: body.category,
      amount,
      note: body.note || null,
      expenseDate: body.expenseDate ? new Date(body.expenseDate) : new Date(),
    },
  });
  await db.transaction.create({
    data: {
      shopId: session.shopId,
      type: "expense",
      expenseId: expense.id,
      description: `খরচ - ${body.category}`,
      amount,
      paymentMethod: "নগদ",
      createdAt: expense.expenseDate,
    },
  });
  return NextResponse.json({ expense });
});

export const DELETE = apiHandler(async (req: Request) => {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: "UNAUTHORIZED" }, { status: 401 });
  const { searchParams } = new URL(req.url);
  const id = searchParams.get("id");
  if (!id) return NextResponse.json({ error: "ID দিন" }, { status: 400 });
  await db.expense.delete({ where: { id } });
  return NextResponse.json({ ok: true });
});

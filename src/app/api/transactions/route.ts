import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET /api/transactions - list transactions with optional filters
export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const channel = searchParams.get("channel");
  const category = searchParams.get("category");
  const month = searchParams.get("month"); // format: "2026-03"

  // Build dynamic where clause based on filters
  const where: Record<string, unknown> = { userId: result.userId };
  if (type) where.type = type;
  if (channel) where.channel = channel;
  if (category) where.category = category;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
    include: { creditCard: { select: { bankName: true, cardNumber: true } } },
  });

  return NextResponse.json(transactions);
}

// POST /api/transactions - create a new transaction
export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { type, category, channel, amount, note, date, creditCardId } = body;

  if (!type || !category || !channel || !amount || !date) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
      { status: 400 }
    );
  }

  const transaction = await prisma.transaction.create({
    data: {
      userId: result.userId,
      type,
      category,
      channel,
      amount: parseFloat(amount),
      note: note || "",
      date: new Date(date),
      creditCardId: creditCardId || null,
    },
  });

  // If expense via credit card, update card balance
  if (type === "expense" && creditCardId) {
    await prisma.creditCard.update({
      where: { id: creditCardId },
      data: { balance: { increment: parseFloat(amount) } },
    });
  }

  return NextResponse.json(transaction, { status: 201 });
}

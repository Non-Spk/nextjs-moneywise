import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { searchParams } = new URL(req.url);
  const type = searchParams.get("type");
  const channel = searchParams.get("channel");
  const category = searchParams.get("category");
  const month = searchParams.get("month");
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where: Record<string, unknown> = { userId: result.userId };
  if (type) where.type = type;
  if (channel) where.channel = channel;
  if (category) where.category = category;
  if (month) {
    const [y, m] = month.split("-").map(Number);
    where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
  }

  const [transactions, total] = await Promise.all([
    prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
      include: { creditCard: { select: { bankName: true, cardNumber: true } } },
      skip,
      take: limit,
    }),
    prisma.transaction.count({ where }),
  ]);

  return NextResponse.json({
    data: transactions,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();

  // Batch mode: salary breakdown or expense with change
  if (body.items && Array.isArray(body.items)) {
    const groupId = crypto.randomUUID();
    const created = [];

    for (const item of body.items) {
      const { type, category, channel, amount, note, date, creditCardId } = item;
      if (!type || !category || !channel || !amount || !date) continue;

      const tx = await prisma.transaction.create({
        data: {
          userId: result.userId,
          type,
          category,
          channel,
          amount: parseFloat(amount),
          note: note || "",
          date: new Date(date),
          creditCardId: creditCardId || null,
          groupId,
        },
      });

      if (type === "expense" && creditCardId) {
        await prisma.creditCard.update({
          where: { id: creditCardId },
          data: { balance: { increment: parseFloat(amount) } },
        });
      }

      created.push(tx);
    }

    return NextResponse.json(created, { status: 201 });
  }

  // Single transaction mode
  const { type, category, channel, amount, note, date, creditCardId } = body;

  if (!type || !category || !channel || !amount || !date) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
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

  if (type === "expense" && creditCardId) {
    await prisma.creditCard.update({
      where: { id: creditCardId },
      data: { balance: { increment: parseFloat(amount) } },
    });
  }

  return NextResponse.json(transaction, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { clampLimit, clampPage, sanitizeString, parseAmount } from "@/lib/validation";

const MAX_BATCH_SIZE = 20;

export async function GET(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { searchParams } = new URL(req.url);
    const type = searchParams.get("type");
    const channel = searchParams.get("channel");
    const category = searchParams.get("category");
    const month = searchParams.get("month");
    const page = clampPage(parseInt(searchParams.get("page") || "1"));
    const limit = clampLimit(parseInt(searchParams.get("limit") || "50"));
    const skip = (page - 1) * limit;

    const where: Record<string, unknown> = { userId: result.userId };
    if (type && (type === "income" || type === "expense")) where.type = type;
    if (channel) where.channel = sanitizeString(channel, 50);
    if (category) where.category = sanitizeString(category, 100);
    if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
        where.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
      }
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
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();

    // Batch mode
    if (body.items && Array.isArray(body.items)) {
      if (body.items.length > MAX_BATCH_SIZE) {
        return NextResponse.json(
          { error: `ส่งได้สูงสุด ${MAX_BATCH_SIZE} รายการต่อครั้ง` },
          { status: 400 }
        );
      }

      const groupId = crypto.randomUUID();
      const created = [];

      for (const item of body.items) {
        const type = sanitizeString(item.type, 20);
        const category = sanitizeString(item.category, 100);
        const channel = sanitizeString(item.channel, 50);
        const amount = parseAmount(item.amount);
        const note = sanitizeString(item.note, 500);
        const date = item.date;
        const creditCardId = item.creditCardId || null;

        if (!type || !category || !channel || !amount || !date) continue;
        if (type !== "income" && type !== "expense") continue;

        // Verify credit card ownership if provided
        if (creditCardId) {
          const card = await prisma.creditCard.findFirst({
            where: { id: creditCardId, userId: result.userId },
          });
          if (!card) continue;
        }

        const tx = await prisma.transaction.create({
          data: {
            userId: result.userId,
            type,
            category,
            channel,
            amount,
            note,
            date: new Date(date),
            creditCardId,
            groupId,
          },
        });

        if (type === "expense" && creditCardId) {
          await prisma.creditCard.update({
            where: { id: creditCardId },
            data: { balance: { increment: amount } },
          });
        }

        created.push(tx);
      }

      return NextResponse.json(created, { status: 201 });
    }

    // Single transaction
    const type = sanitizeString(body.type, 20);
    const category = sanitizeString(body.category, 100);
    const channel = sanitizeString(body.channel, 50);
    const amount = parseAmount(body.amount);
    const note = sanitizeString(body.note, 500);
    const creditCardId = body.creditCardId || null;

    if (!type || !category || !channel || !amount || !body.date) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
    }

    // Verify credit card ownership
    if (creditCardId) {
      const card = await prisma.creditCard.findFirst({
        where: { id: creditCardId, userId: result.userId },
      });
      if (!card) {
        return NextResponse.json({ error: "ไม่พบบัตรเครดิต" }, { status: 404 });
      }
    }

    const transaction = await prisma.transaction.create({
      data: {
        userId: result.userId,
        type,
        category,
        channel,
        amount,
        note,
        date: new Date(body.date),
        creditCardId,
      },
    });

    if (type === "expense" && creditCardId) {
      await prisma.creditCard.update({
        where: { id: creditCardId },
        data: { balance: { increment: amount } },
      });
    }

    return NextResponse.json(transaction, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

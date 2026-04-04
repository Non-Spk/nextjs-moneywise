import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString, parseAmount } from "@/lib/validation";

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const cards = await prisma.creditCard.findMany({
      where: { userId: result.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(cards);
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const bankName = sanitizeString(body.bankName, 100);
    const cardNumber = sanitizeString(body.cardNumber, 20);
    const creditLimit = parseAmount(body.creditLimit);
    const dueDate = parseInt(body.dueDate);

    if (!bankName || !cardNumber || !creditLimit || isNaN(dueDate) || dueDate < 1 || dueDate > 31) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const card = await prisma.creditCard.create({
      data: {
        userId: result.userId,
        bankName,
        cardNumber: cardNumber.slice(-4),
        creditLimit,
        balance: parseFloat(body.balance || "0") || 0,
        dueDate,
      },
    });

    return NextResponse.json(card, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

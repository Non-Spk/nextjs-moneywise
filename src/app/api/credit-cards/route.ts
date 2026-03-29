import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET /api/credit-cards
export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const cards = await prisma.creditCard.findMany({
    where: { userId: result.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(cards);
}

// POST /api/credit-cards
export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { bankName, cardNumber, creditLimit, balance, dueDate } =
    await req.json();

  if (!bankName || !cardNumber || !creditLimit || dueDate === undefined) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
      { status: 400 }
    );
  }

  const card = await prisma.creditCard.create({
    data: {
      userId: result.userId,
      bankName,
      cardNumber: cardNumber.slice(-4), // store only last 4 digits
      creditLimit: parseFloat(creditLimit),
      balance: parseFloat(balance || "0"),
      dueDate: parseInt(dueDate),
    },
  });

  return NextResponse.json(card, { status: 201 });
}

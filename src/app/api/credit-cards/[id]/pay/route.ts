import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// POST /api/credit-cards/[id]/pay - pay off credit card balance
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();
  const { amount, channel, date } = body;

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "กรุณาระบุจำนวนเงิน" }, { status: 400 });
  }

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: result.userId },
  });

  if (!card) {
    return NextResponse.json({ error: "ไม่พบบัตรเครดิต" }, { status: 404 });
  }

  const payAmount = Math.min(parseFloat(amount), card.balance);

  // Decrement card balance
  const updated = await prisma.creditCard.update({
    where: { id },
    data: { balance: { decrement: payAmount } },
  });

  // Create expense transaction for the payment
  await prisma.transaction.create({
    data: {
      userId: result.userId,
      type: "expense",
      category: "credit_card_payment",
      channel: channel || "transfer",
      amount: payAmount,
      note: `ชำระหนี้ ${card.bankName} *${card.cardNumber}`,
      date: new Date(date || new Date()),
      creditCardId: id,
    },
  });

  return NextResponse.json(updated);
}

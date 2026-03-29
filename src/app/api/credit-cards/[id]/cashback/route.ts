import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// POST /api/credit-cards/[id]/cashback - apply cashback to reduce balance
export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();
  const { amount, date } = body;

  if (!amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "กรุณาระบุจำนวนเงิน" }, { status: 400 });
  }

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: result.userId },
  });

  if (!card) {
    return NextResponse.json({ error: "ไม่พบบัตรเครดิต" }, { status: 404 });
  }

  const cashbackAmount = Math.min(parseFloat(amount), card.balance);

  // Decrement card balance
  const updated = await prisma.creditCard.update({
    where: { id },
    data: { balance: { decrement: cashbackAmount } },
  });

  // Create income transaction for the cashback
  await prisma.transaction.create({
    data: {
      userId: result.userId,
      type: "income",
      category: "cashback",
      channel: "credit",
      amount: cashbackAmount,
      note: `Cashback ${card.bankName} *${card.cardNumber}`,
      date: new Date(date || new Date()),
      creditCardId: id,
    },
  });

  return NextResponse.json(updated);
}

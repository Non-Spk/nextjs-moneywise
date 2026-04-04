import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { parseAmount } from "@/lib/validation";

export async function POST(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { id } = await params;
    const body = await req.json();
    const amount = parseAmount(body.amount);

    if (!amount) {
      return NextResponse.json({ error: "กรุณาระบุจำนวนเงิน" }, { status: 400 });
    }

    const card = await prisma.creditCard.findFirst({
      where: { id, userId: result.userId },
    });

    if (!card) {
      return NextResponse.json({ error: "ไม่พบบัตรเครดิต" }, { status: 404 });
    }

    const cashbackAmount = Math.min(amount, card.balance);

    const updated = await prisma.creditCard.update({
      where: { id },
      data: { balance: { decrement: cashbackAmount } },
    });

    await prisma.transaction.create({
      data: {
        userId: result.userId,
        type: "income",
        category: "cashback",
        channel: "credit",
        amount: cashbackAmount,
        note: `Cashback ${card.bankName} *${card.cardNumber}`,
        date: new Date(body.date || new Date()),
        creditCardId: id,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return safeResponse(err);
  }
}

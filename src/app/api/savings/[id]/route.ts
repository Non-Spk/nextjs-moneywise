import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { parseAmount, sanitizeString } from "@/lib/validation";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { id } = await params;
    const account = await prisma.savingsAccount.findFirst({
      where: { id, userId: result.userId },
    });
    if (!account) {
      return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
    }

    await prisma.savingsAccount.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { id } = await params;
    const body = await req.json();
    const type = sanitizeString(body.type, 20);
    const amount = parseAmount(body.amount);
    const note = sanitizeString(body.note, 500);

    if (!type || !amount || (type !== "deposit" && type !== "withdraw")) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const account = await prisma.savingsAccount.findFirst({
      where: { id, userId: result.userId },
    });
    if (!account) {
      return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
    }

    if (type === "withdraw" && amount > account.balance) {
      return NextResponse.json({ error: "ยอดเงินไม่เพียงพอ" }, { status: 400 });
    }

    const updated = await prisma.savingsAccount.update({
      where: { id },
      data: {
        balance: type === "deposit"
          ? { increment: amount }
          : { decrement: amount },
      },
    });

    await prisma.savingsTransaction.create({
      data: {
        savingsAccountId: id,
        type,
        amount,
        note,
        date: new Date(body.date || new Date()),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: result.userId,
        type: type === "deposit" ? "expense" : "income",
        category: type === "deposit" ? "savings_deposit" : "savings_withdraw",
        channel: "transfer",
        amount,
        note: `${type === "deposit" ? "ฝากออม" : "ถอนออม"} - ${account.name} (${account.bankName})`,
        date: new Date(body.date || new Date()),
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return safeResponse(err);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
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
}

// POST /api/savings/[id] - deposit or withdraw
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();
  const { type, amount, note, date } = body;

  if (!type || !amount || parseFloat(amount) <= 0) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const account = await prisma.savingsAccount.findFirst({
    where: { id, userId: result.userId },
  });
  if (!account) {
    return NextResponse.json({ error: "ไม่พบบัญชี" }, { status: 404 });
  }

  const txAmount = parseFloat(amount);

  if (type === "withdraw" && txAmount > account.balance) {
    return NextResponse.json({ error: "ยอดเงินไม่เพียงพอ" }, { status: 400 });
  }

  // Update balance
  const updated = await prisma.savingsAccount.update({
    where: { id },
    data: {
      balance: type === "deposit"
        ? { increment: txAmount }
        : { decrement: txAmount },
    },
  });

  // Create savings transaction
  await prisma.savingsTransaction.create({
    data: {
      savingsAccountId: id,
      type,
      amount: txAmount,
      note: note || "",
      date: new Date(date || new Date()),
    },
  });

  // Create a corresponding main transaction so dashboard balance reflects savings movement
  // Deposit = money leaves circulating -> expense (savings_deposit)
  // Withdraw = money returns to circulating -> income (savings_withdraw)
  await prisma.transaction.create({
    data: {
      userId: result.userId,
      type: type === "deposit" ? "expense" : "income",
      category: type === "deposit" ? "savings_deposit" : "savings_withdraw",
      channel: "transfer",
      amount: txAmount,
      note: `${type === "deposit" ? "ฝากออม" : "ถอนออม"} - ${account.name} (${account.bankName})`,
      date: new Date(date || new Date()),
    },
  });

  return NextResponse.json(updated);
}

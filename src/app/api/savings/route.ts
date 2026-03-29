import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const accounts = await prisma.savingsAccount.findMany({
    where: { userId: result.userId },
    include: {
      transactions: { orderBy: { date: "desc" }, take: 20 },
    },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(accounts);
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { name, bankName, accountNumber, balance, goal } = body;

  if (!name || !bankName) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const account = await prisma.savingsAccount.create({
    data: {
      userId: result.userId,
      name,
      bankName,
      accountNumber: accountNumber || "",
      balance: parseFloat(balance) || 0,
      goal: goal ? parseFloat(goal) : null,
    },
  });

  // If initial balance > 0, create a deposit transaction
  if (parseFloat(balance) > 0) {
    await prisma.savingsTransaction.create({
      data: {
        savingsAccountId: account.id,
        type: "deposit",
        amount: parseFloat(balance),
        note: "ยอดเริ่มต้น",
        date: new Date(),
      },
    });
  }

  return NextResponse.json(account, { status: 201 });
}

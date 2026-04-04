import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString } from "@/lib/validation";

export async function GET() {
  try {
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
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const name = sanitizeString(body.name, 200);
    const bankName = sanitizeString(body.bankName, 100);
    const accountNumber = sanitizeString(body.accountNumber, 20);

    if (!name || !bankName) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const balance = parseFloat(body.balance) || 0;
    const goal = body.goal ? parseFloat(body.goal) : null;

    const account = await prisma.savingsAccount.create({
      data: {
        userId: result.userId,
        name,
        bankName,
        accountNumber,
        balance: Math.max(0, balance),
        goal,
      },
    });

    if (balance > 0) {
      await prisma.savingsTransaction.create({
        data: {
          savingsAccountId: account.id,
          type: "deposit",
          amount: balance,
          note: "ยอดเริ่มต้น",
          date: new Date(),
        },
      });
    }

    return NextResponse.json(account, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

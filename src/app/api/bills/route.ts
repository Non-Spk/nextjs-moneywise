import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString, parseAmount } from "@/lib/validation";

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const bills = await prisma.bill.findMany({
      where: { userId: result.userId },
      orderBy: { dueDay: "asc" },
    });

    return NextResponse.json(bills);
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
    const amount = parseAmount(body.amount);
    const dueDay = parseInt(body.dueDay);

    if (!name || !amount || isNaN(dueDay) || dueDay < 1 || dueDay > 31) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const bill = await prisma.bill.create({
      data: { userId: result.userId, name, amount, dueDay },
    });

    return NextResponse.json(bill, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

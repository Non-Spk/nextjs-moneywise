import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString, parseAmount } from "@/lib/validation";

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const deductions = await prisma.taxDeduction.findMany({
      where: { userId: result.userId },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(deductions);
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const category = sanitizeString(body.category, 100);
    const name = sanitizeString(body.name, 200);
    const amount = parseAmount(body.amount);
    const maxLimit = parseAmount(body.maxLimit);

    if (!category || !name || !amount || !maxLimit) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const taxYear = parseInt(body.taxYear) || 2568;
    if (taxYear < 2500 || taxYear > 2600) {
      return NextResponse.json({ error: "ปีภาษีไม่ถูกต้อง" }, { status: 400 });
    }

    const deduction = await prisma.taxDeduction.create({
      data: { userId: result.userId, category, name, amount, maxLimit, taxYear },
    });

    return NextResponse.json(deduction, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

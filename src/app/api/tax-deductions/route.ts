import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET /api/tax-deductions
export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const deductions = await prisma.taxDeduction.findMany({
    where: { userId: result.userId },
    orderBy: { createdAt: "desc" },
  });

  return NextResponse.json(deductions);
}

// POST /api/tax-deductions
export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { category, name, amount, maxLimit, taxYear } = await req.json();

  if (!category || !name || amount === undefined || maxLimit === undefined) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
      { status: 400 }
    );
  }

  const deduction = await prisma.taxDeduction.create({
    data: {
      userId: result.userId,
      category,
      name,
      amount: parseFloat(amount),
      maxLimit: parseFloat(maxLimit),
      taxYear: taxYear || 2568,
    },
  });

  return NextResponse.json(deduction, { status: 201 });
}

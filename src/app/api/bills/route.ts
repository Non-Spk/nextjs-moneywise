import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET /api/bills
export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const bills = await prisma.bill.findMany({
    where: { userId: result.userId },
    orderBy: { dueDay: "asc" },
  });

  return NextResponse.json(bills);
}

// POST /api/bills
export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { name, amount, dueDay } = await req.json();

  if (!name || !amount || dueDay === undefined) {
    return NextResponse.json(
      { error: "กรุณากรอกข้อมูลให้ครบถ้วน" },
      { status: 400 }
    );
  }

  const bill = await prisma.bill.create({
    data: {
      userId: result.userId,
      name,
      amount: parseFloat(amount),
      dueDay: parseInt(dueDay),
    },
  });

  return NextResponse.json(bill, { status: 201 });
}

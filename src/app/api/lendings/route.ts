import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const lendings = await prisma.lending.findMany({
    where: { userId: result.userId },
    orderBy: { date: "desc" },
  });

  return NextResponse.json(lendings);
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { borrower, amount, description, date } = body;

  if (!borrower || !amount || !date) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const lending = await prisma.lending.create({
    data: {
      userId: result.userId,
      borrower,
      amount: parseFloat(amount),
      description: description || "",
      date: new Date(date),
    },
  });

  return NextResponse.json(lending, { status: 201 });
}

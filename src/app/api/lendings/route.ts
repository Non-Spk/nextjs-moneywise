import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { searchParams } = new URL(req.url);
  const page = parseInt(searchParams.get("page") || "1");
  const limit = parseInt(searchParams.get("limit") || "50");
  const skip = (page - 1) * limit;

  const where = { userId: result.userId };

  const [lendings, total] = await Promise.all([
    prisma.lending.findMany({
      where,
      orderBy: { date: "desc" },
      skip,
      take: limit,
    }),
    prisma.lending.count({ where }),
  ]);

  return NextResponse.json({
    data: lendings,
    total,
    page,
    limit,
    totalPages: Math.ceil(total / limit),
  });
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

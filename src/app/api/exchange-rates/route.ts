import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET - get all exchange rates for user
export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const rates = await prisma.exchangeRate.findMany({
    where: { userId: result.userId },
    orderBy: { currency: "asc" },
  });
  return NextResponse.json(rates);
}

// POST - create or update exchange rate
export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { currency, rate } = body;

  if (!currency || !rate || parseFloat(rate) <= 0) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const existing = await prisma.exchangeRate.findFirst({
    where: { userId: result.userId, currency },
  });

  let result2;
  if (existing) {
    result2 = await prisma.exchangeRate.update({
      where: { id: existing.id },
      data: { rate: parseFloat(rate), updatedAt: new Date() },
    });
  } else {
    result2 = await prisma.exchangeRate.create({
      data: { userId: result.userId, currency, rate: parseFloat(rate) },
    });
  }

  return NextResponse.json(result2);
}

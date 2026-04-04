import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString } from "@/lib/validation";

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const rates = await prisma.exchangeRate.findMany({
      where: { userId: result.userId },
      orderBy: { currency: "asc" },
    });
    return NextResponse.json(rates);
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const currency = sanitizeString(body.currency, 10).toUpperCase();
    const rate = parseFloat(body.rate);

    if (!currency || !rate || rate <= 0 || !isFinite(rate)) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    if (!/^[A-Z]{3}$/.test(currency)) {
      return NextResponse.json({ error: "รหัสสกุลเงินไม่ถูกต้อง" }, { status: 400 });
    }

    const existing = await prisma.exchangeRate.findFirst({
      where: { userId: result.userId, currency },
    });

    let result2;
    if (existing) {
      result2 = await prisma.exchangeRate.update({
        where: { id: existing.id },
        data: { rate, updatedAt: new Date() },
      });
    } else {
      result2 = await prisma.exchangeRate.create({
        data: { userId: result.userId, currency, rate },
      });
    }

    return NextResponse.json(result2);
  } catch (err) {
    return safeResponse(err);
  }
}

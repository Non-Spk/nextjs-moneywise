import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { clampLimit, clampPage, sanitizeString, parseAmount } from "@/lib/validation";

export async function GET(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { searchParams } = new URL(req.url);
    const page = clampPage(parseInt(searchParams.get("page") || "1"));
    const limit = clampLimit(parseInt(searchParams.get("limit") || "50"));
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
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const borrower = sanitizeString(body.borrower, 200);
    const amount = parseAmount(body.amount);
    const description = sanitizeString(body.description, 500);

    if (!borrower || !amount || !body.date) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    const lending = await prisma.lending.create({
      data: {
        userId: result.userId,
        borrower,
        amount,
        description,
        date: new Date(body.date),
      },
    });

    return NextResponse.json(lending, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

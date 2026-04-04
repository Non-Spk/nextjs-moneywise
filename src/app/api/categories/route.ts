import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString } from "@/lib/validation";

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const categories = await prisma.category.findMany({
      where: { userId: result.userId },
      orderBy: { createdAt: "asc" },
    });

    return NextResponse.json(categories);
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const type = sanitizeString(body.type, 20);
    const value = sanitizeString(body.value, 100);
    const label = sanitizeString(body.label, 100);

    if (!type || !value || !label) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    if (type !== "income" && type !== "expense") {
      return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
    }

    const existing = await prisma.category.findFirst({
      where: { userId: result.userId, type, value },
    });
    if (existing) {
      return NextResponse.json({ error: "หมวดหมู่นี้มีอยู่แล้ว" }, { status: 409 });
    }

    const category = await prisma.category.create({
      data: { userId: result.userId, type, value, label },
    });

    return NextResponse.json(category, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

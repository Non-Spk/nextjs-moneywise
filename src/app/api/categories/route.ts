import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const categories = await prisma.category.findMany({
    where: { userId: result.userId },
    orderBy: { createdAt: "asc" },
  });

  return NextResponse.json(categories);
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { type, value, label } = body;

  if (!type || !value || !label) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  // Check duplicate
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
}

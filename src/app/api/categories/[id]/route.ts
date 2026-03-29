import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();

  const cat = await prisma.category.findFirst({
    where: { id, userId: result.userId },
  });
  if (!cat) {
    return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  }

  const updated = await prisma.category.update({
    where: { id },
    data: {
      ...(body.label && { label: body.label }),
      ...(body.value && { value: body.value }),
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;

  const cat = await prisma.category.findFirst({
    where: { id, userId: result.userId },
  });
  if (!cat) {
    return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
  }

  await prisma.category.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

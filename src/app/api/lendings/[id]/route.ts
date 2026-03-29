import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();

  const lending = await prisma.lending.findFirst({
    where: { id, userId: result.userId },
  });
  if (!lending) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  const updated = await prisma.lending.update({
    where: { id },
    data: {
      isReturned: body.isReturned ?? lending.isReturned,
      returnedAt: body.isReturned ? new Date() : null,
      returnedAmount: body.returnedAmount !== undefined ? parseFloat(body.returnedAmount) : lending.returnedAmount,
    },
  });

  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;

  const lending = await prisma.lending.findFirst({
    where: { id, userId: result.userId },
  });
  if (!lending) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  await prisma.lending.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

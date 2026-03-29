import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();

  const asset = await prisma.physicalAsset.findFirst({ where: { id, userId: result.userId } });
  if (!asset) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const updated = await prisma.physicalAsset.update({
    where: { id },
    data: {
      ...(body.currentValue !== undefined && { currentValue: parseFloat(body.currentValue) }),
      ...(body.name && { name: body.name }),
      ...(body.note !== undefined && { note: body.note }),
    },
  });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const asset = await prisma.physicalAsset.findFirst({ where: { id, userId: result.userId } });
  if (!asset) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  await prisma.physicalAsset.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

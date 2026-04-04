import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString } from "@/lib/validation";

export async function PATCH(req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
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
        ...(body.name && { name: sanitizeString(body.name, 200) }),
        ...(body.note !== undefined && { note: sanitizeString(body.note, 500) }),
      },
    });
    return NextResponse.json(updated);
  } catch (err) {
    return safeResponse(err);
  }
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { id } = await params;
    const asset = await prisma.physicalAsset.findFirst({ where: { id, userId: result.userId } });
    if (!asset) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

    await prisma.physicalAsset.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return safeResponse(err);
  }
}

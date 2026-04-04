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

    const cat = await prisma.category.findFirst({
      where: { id, userId: result.userId },
    });
    if (!cat) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    }

    const updated = await prisma.category.update({
      where: { id },
      data: {
        ...(body.label && { label: sanitizeString(body.label, 100) }),
        ...(body.value && { value: sanitizeString(body.value, 100) }),
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

    const cat = await prisma.category.findFirst({
      where: { id, userId: result.userId },
    });
    if (!cat) {
      return NextResponse.json({ error: "ไม่พบหมวดหมู่" }, { status: 404 });
    }

    await prisma.category.delete({ where: { id } });
    return NextResponse.json({ success: true });
  } catch (err) {
    return safeResponse(err);
  }
}

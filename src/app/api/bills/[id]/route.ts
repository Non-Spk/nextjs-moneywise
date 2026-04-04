import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";

export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { id } = await params;
    const bill = await prisma.bill.findFirst({
      where: { id, userId: result.userId },
    });

    if (!bill) {
      return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 });
    }

    await prisma.bill.delete({ where: { id } });
    return NextResponse.json({ message: "ลบบิลสำเร็จ" });
  } catch (err) {
    return safeResponse(err);
  }
}

export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { id } = await params;
    const { isPaid } = await req.json();

    const bill = await prisma.bill.findFirst({
      where: { id, userId: result.userId },
    });

    if (!bill) {
      return NextResponse.json({ error: "ไม่พบบิล" }, { status: 404 });
    }

    const updated = await prisma.bill.update({
      where: { id },
      data: {
        isPaid: Boolean(isPaid),
        paidAt: isPaid ? new Date() : null,
      },
    });

    return NextResponse.json(updated);
  } catch (err) {
    return safeResponse(err);
  }
}

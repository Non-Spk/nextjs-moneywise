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

    const tx = await prisma.transaction.findFirst({
      where: { id, userId: result.userId },
    });

    if (!tx) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    if (tx.type === "expense" && tx.creditCardId) {
      await prisma.creditCard.update({
        where: { id: tx.creditCardId },
        data: { balance: { decrement: tx.amount } },
      });
    }

    await prisma.transaction.delete({ where: { id } });
    return NextResponse.json({ message: "ลบรายการสำเร็จ" });
  } catch (err) {
    return safeResponse(err);
  }
}

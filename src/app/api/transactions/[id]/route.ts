import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// DELETE /api/transactions/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;

  // Verify ownership before deleting
  const tx = await prisma.transaction.findFirst({
    where: { id, userId: result.userId },
  });

  if (!tx) {
    return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
  }

  // If it was a credit card expense, reverse the balance
  if (tx.type === "expense" && tx.creditCardId) {
    await prisma.creditCard.update({
      where: { id: tx.creditCardId },
      data: { balance: { decrement: tx.amount } },
    });
  }

  await prisma.transaction.delete({ where: { id } });
  return NextResponse.json({ message: "ลบรายการสำเร็จ" });
}

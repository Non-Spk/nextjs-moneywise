import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// DELETE /api/credit-cards/[id]
export async function DELETE(
  _req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const card = await prisma.creditCard.findFirst({
    where: { id, userId: result.userId },
  });

  if (!card) {
    return NextResponse.json({ error: "ไม่พบบัตรเครดิต" }, { status: 404 });
  }

  await prisma.creditCard.delete({ where: { id } });
  return NextResponse.json({ message: "ลบบัตรเครดิตสำเร็จ" });
}

// PATCH /api/credit-cards/[id] - update balance or details
export async function PATCH(
  req: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();

  const card = await prisma.creditCard.findFirst({
    where: { id, userId: result.userId },
  });

  if (!card) {
    return NextResponse.json({ error: "ไม่พบบัตรเครดิต" }, { status: 404 });
  }

  const updated = await prisma.creditCard.update({
    where: { id },
    data: {
      ...(body.balance !== undefined && { balance: parseFloat(body.balance) }),
      ...(body.bankName && { bankName: body.bankName }),
      ...(body.creditLimit && {
        creditLimit: parseFloat(body.creditLimit),
      }),
      ...(body.dueDate !== undefined && { dueDate: parseInt(body.dueDate) }),
    },
  });

  return NextResponse.json(updated);
}

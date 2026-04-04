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
    const deduction = await prisma.taxDeduction.findFirst({
      where: { id, userId: result.userId },
    });

    if (!deduction) {
      return NextResponse.json({ error: "ไม่พบรายการลดหย่อน" }, { status: 404 });
    }

    await prisma.taxDeduction.delete({ where: { id } });
    return NextResponse.json({ message: "ลบรายการสำเร็จ" });
  } catch (err) {
    return safeResponse(err);
  }
}

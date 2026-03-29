import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const assets = await prisma.physicalAsset.findMany({
    where: { userId: result.userId },
    orderBy: { currentValue: "desc" },
  });
  return NextResponse.json(assets);
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { name, type, purchaseValue, currentValue, purchaseDate, note } = body;

  if (!name || !type) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const asset = await prisma.physicalAsset.create({
    data: {
      userId: result.userId,
      name, type,
      purchaseValue: parseFloat(purchaseValue) || 0,
      currentValue: parseFloat(currentValue) || parseFloat(purchaseValue) || 0,
      purchaseDate: purchaseDate ? new Date(purchaseDate) : null,
      note: note || "",
    },
  });
  return NextResponse.json(asset, { status: 201 });
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString } from "@/lib/validation";

const VALID_TYPES = ["gold", "property", "vehicle", "collectible", "other"];

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const assets = await prisma.physicalAsset.findMany({
      where: { userId: result.userId },
      orderBy: { currentValue: "desc" },
    });
    return NextResponse.json(assets);
  } catch (err) {
    return safeResponse(err);
  }
}

export async function POST(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const body = await req.json();
    const name = sanitizeString(body.name, 200);
    const type = sanitizeString(body.type, 50);
    const note = sanitizeString(body.note, 500);

    if (!name || !type) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
    }

    const asset = await prisma.physicalAsset.create({
      data: {
        userId: result.userId,
        name, type,
        purchaseValue: parseFloat(body.purchaseValue) || 0,
        currentValue: parseFloat(body.currentValue) || parseFloat(body.purchaseValue) || 0,
        purchaseDate: body.purchaseDate ? new Date(body.purchaseDate) : null,
        note,
      },
    });
    return NextResponse.json(asset, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

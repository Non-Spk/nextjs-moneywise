import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// POST /api/investments/[id] - buy more, sell, or update value
export async function POST(req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const body = await req.json();
  const { type, amount, units, pricePerUnit, note, date } = body;

  const inv = await prisma.investment.findFirst({
    where: { id, userId: result.userId },
  });
  if (!inv) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  const txAmount = parseFloat(amount) || 0;
  const txUnits = parseFloat(units) || 0;
  const txDate = new Date(date || new Date());

  if (type === "buy") {
    await prisma.investment.update({
      where: { id },
      data: {
        costBasis: { increment: txAmount },
        currentValue: { increment: txAmount },
        units: { increment: txUnits },
      },
    });
    await prisma.transaction.create({
      data: {
        userId: result.userId, type: "expense", category: "investment_buy",
        channel: "transfer", amount: txAmount, note: `ซื้อเพิ่ม ${inv.name}`, date: txDate,
      },
    });
  } else if (type === "sell") {
    const sellUnits = Math.min(txUnits, inv.units);
    const costPerUnit = inv.units > 0 ? inv.costBasis / inv.units : 0;
    const costReduction = costPerUnit * sellUnits;

    await prisma.investment.update({
      where: { id },
      data: {
        costBasis: { decrement: costReduction },
        currentValue: { decrement: Math.min(txAmount, inv.currentValue) },
        units: { decrement: sellUnits },
      },
    });
    await prisma.transaction.create({
      data: {
        userId: result.userId, type: "income", category: "investment_sell",
        channel: "transfer", amount: txAmount, note: `ขาย ${inv.name}`, date: txDate,
      },
    });
  } else if (type === "value_update") {
    await prisma.investment.update({
      where: { id },
      data: { currentValue: txAmount },
    });
  }

  await prisma.investmentTransaction.create({
    data: {
      investmentId: id, type, amount: txAmount, units: txUnits,
      pricePerUnit: parseFloat(pricePerUnit) || 0, note: note || "", date: txDate,
    },
  });

  const updated = await prisma.investment.findUnique({ where: { id } });
  return NextResponse.json(updated);
}

export async function DELETE(_req: Request, { params }: { params: Promise<{ id: string }> }) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { id } = await params;
  const inv = await prisma.investment.findFirst({ where: { id, userId: result.userId } });
  if (!inv) return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });

  await prisma.investment.delete({ where: { id } });
  return NextResponse.json({ success: true });
}

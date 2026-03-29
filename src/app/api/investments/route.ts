import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

export async function GET() {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const investments = await prisma.investment.findMany({
    where: { userId: result.userId },
    include: { transactions: { orderBy: { date: "desc" }, take: 10 } },
    orderBy: { updatedAt: "desc" },
  });

  return NextResponse.json(investments);
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { name, type, amount, units, pricePerUnit, note, date, currency, exchangeRate } = body;

  if (!name || !type || !amount) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const cost = parseFloat(amount);
  const u = parseFloat(units) || 0;
  const cur = currency || "THB";
  const rate = parseFloat(exchangeRate) || 1;

  const investment = await prisma.investment.create({
    data: {
      userId: result.userId,
      name, type,
      currency: cur,
      exchangeRate: rate,
      costBasis: cost,
      currentValue: cost,
      units: u,
      note: note || "",
    },
  });

  // Create initial buy transaction
  await prisma.investmentTransaction.create({
    data: {
      investmentId: investment.id,
      type: "buy",
      amount: cost,
      units: u,
      pricePerUnit: parseFloat(pricePerUnit) || (u > 0 ? cost / u : 0),
      note: "ซื้อครั้งแรก",
      date: new Date(date || new Date()),
    },
  });

  // Create main transaction (expense in THB)
  await prisma.transaction.create({
    data: {
      userId: result.userId,
      type: "expense",
      category: "investment_buy",
      channel: "transfer",
      amount: cost * rate, // convert to THB
      note: `ซื้อ ${name}${cur !== "THB" ? ` (${cost} ${cur} @ ${rate})` : ""}`,
      date: new Date(date || new Date()),
    },
  });

  return NextResponse.json(investment, { status: 201 });
}

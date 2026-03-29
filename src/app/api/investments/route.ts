import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

async function getRate(userId: string, currency: string): Promise<number> {
  if (currency === "THB") return 1;
  const rate = await prisma.exchangeRate.findFirst({
    where: { userId, currency },
  });
  return rate?.rate || 1;
}

export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const investments = await prisma.investment.findMany({
    where: { userId: result.userId },
    include: { transactions: { orderBy: { date: "desc" }, take: 10 } },
    orderBy: { updatedAt: "desc" },
  });

  // Attach current exchange rate to each investment
  const rates = await prisma.exchangeRate.findMany({ where: { userId: result.userId } });
  const rateMap: Record<string, number> = { THB: 1 };
  for (const r of rates) rateMap[r.currency] = r.rate;

  const withRates = investments.map((inv) => ({
    ...inv,
    currentRate: rateMap[inv.currency] || 1,
  }));

  return NextResponse.json(withRates);
}

export async function POST(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const body = await req.json();
  const { name, type, amount, units, pricePerUnit, note, date, currency } = body;

  if (!name || !type || !amount) {
    return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
  }

  const cost = parseFloat(amount);
  const u = parseFloat(units) || 0;
  const cur = currency || "THB";
  const rate = await getRate(result.userId, cur);

  const investment = await prisma.investment.create({
    data: {
      userId: result.userId,
      name, type, currency: cur,
      costBasis: cost, currentValue: cost, units: u,
      note: note || "",
    },
  });

  await prisma.investmentTransaction.create({
    data: {
      investmentId: investment.id, type: "buy",
      amount: cost, units: u, exchangeRate: rate,
      pricePerUnit: parseFloat(pricePerUnit) || (u > 0 ? cost / u : 0),
      note: "ซื้อครั้งแรก", date: new Date(date || new Date()),
    },
  });

  await prisma.transaction.create({
    data: {
      userId: result.userId, type: "expense", category: "investment_buy",
      channel: "transfer", amount: cost * rate,
      note: `ซื้อ ${name}${cur !== "THB" ? ` (${cost} ${cur} @ ${rate})` : ""}`,
      date: new Date(date || new Date()),
    },
  });

  return NextResponse.json(investment, { status: 201 });
}

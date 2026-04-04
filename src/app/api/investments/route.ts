import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { sanitizeString, parseAmount } from "@/lib/validation";

const VALID_TYPES = ["gold", "stock", "fund", "crypto", "bond", "other"];

async function getRate(userId: string, currency: string): Promise<number> {
  if (currency === "THB") return 1;
  const rate = await prisma.exchangeRate.findFirst({
    where: { userId, currency },
  });
  return rate?.rate || 1;
}

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const investments = await prisma.investment.findMany({
      where: { userId: result.userId },
      include: { transactions: { orderBy: { date: "desc" }, take: 10 } },
      orderBy: { updatedAt: "desc" },
    });

    const rates = await prisma.exchangeRate.findMany({ where: { userId: result.userId } });
    const rateMap: Record<string, number> = { THB: 1 };
    for (const r of rates) rateMap[r.currency] = r.rate;

    const withRates = investments.map((inv) => ({
      ...inv,
      currentRate: rateMap[inv.currency] || 1,
    }));

    return NextResponse.json(withRates);
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
    const amount = parseAmount(body.amount);
    const note = sanitizeString(body.note, 500);
    const cur = sanitizeString(body.currency, 10) || "THB";

    if (!name || !type || !amount) {
      return NextResponse.json({ error: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    if (!VALID_TYPES.includes(type)) {
      return NextResponse.json({ error: "ประเภทไม่ถูกต้อง" }, { status: 400 });
    }

    const u = parseFloat(body.units) || 0;
    const rate = await getRate(result.userId, cur);

    const investment = await prisma.investment.create({
      data: {
        userId: result.userId,
        name, type, currency: cur,
        costBasis: amount, currentValue: amount, units: u,
        note,
      },
    });

    await prisma.investmentTransaction.create({
      data: {
        investmentId: investment.id, type: "buy",
        amount, units: u, exchangeRate: rate,
        pricePerUnit: parseFloat(body.pricePerUnit) || (u > 0 ? amount / u : 0),
        note: "ซื้อครั้งแรก", date: new Date(body.date || new Date()),
      },
    });

    await prisma.transaction.create({
      data: {
        userId: result.userId, type: "expense", category: "investment_buy",
        channel: "transfer", amount: amount * rate,
        note: `ซื้อ ${name}${cur !== "THB" ? ` (${amount} ${cur} @ ${rate})` : ""}`,
        date: new Date(body.date || new Date()),
      },
    });

    return NextResponse.json(investment, { status: 201 });
  } catch (err) {
    return safeResponse(err);
  }
}

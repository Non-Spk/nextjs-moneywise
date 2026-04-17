import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";
import { parseAmount } from "@/lib/validation";

const VALID_CURRENCIES = ["THB", "USD", "EUR", "JPY", "CNY", "GBP", "SGD"];

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const accounts = await prisma.investmentAccount.findMany({
      where: { userId: result.userId },
      orderBy: { currency: "asc" },
    });

    const rates = await prisma.exchangeRate.findMany({ where: { userId: result.userId } });
    const rateMap: Record<string, number> = { THB: 1 };
    for (const r of rates) rateMap[r.currency] = r.rate;

    const withRates = accounts.map((a) => ({
      ...a,
      rate: rateMap[a.currency] || 1,
      balanceTHB: a.balance * (rateMap[a.currency] || 1),
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
    const currency = (body.currency || "").toUpperCase().trim();
    const amount = parseAmount(body.amount) || 0;
    const action = body.action || "deposit"; // "deposit" | "withdraw"

    if (!VALID_CURRENCIES.includes(currency)) {
      return NextResponse.json({ error: "สกุลเงินไม่ถูกต้อง" }, { status: 400 });
    }

    if (amount <= 0) {
      return NextResponse.json({ error: "จำนวนเงินต้องมากกว่า 0" }, { status: 400 });
    }

    // Upsert the account
    let account = await prisma.investmentAccount.findUnique({
      where: { userId_currency: { userId: result.userId, currency } },
    });

    if (!account) {
      account = await prisma.investmentAccount.create({
        data: { userId: result.userId, currency, balance: 0 },
      });
    }

    if (action === "withdraw" && account.balance < amount) {
      return NextResponse.json({ error: "ยอดเงินไม่เพียงพอ" }, { status: 400 });
    }

    const newBalance = action === "withdraw"
      ? account.balance - amount
      : account.balance + amount;

    const updated = await prisma.investmentAccount.update({
      where: { id: account.id },
      data: { balance: newBalance },
    });

    // Record in transactions (THB equivalent)
    let rate = 1;
    if (currency !== "THB") {
      const er = await prisma.exchangeRate.findFirst({ where: { userId: result.userId, currency } });
      rate = er?.rate || 1;
    }
    const amountTHB = amount * rate;
    const foreignNote = currency !== "THB" ? ` (${amount} ${currency} @ ${rate})` : "";

    if (action === "deposit") {
      await prisma.transaction.create({
        data: {
          userId: result.userId,
          type: "expense",
          category: "investment_deposit",
          channel: "transfer",
          amount: amountTHB,
          note: `ฝากเงินเข้าบัญชีลงทุน ${currency}${foreignNote}`,
          date: new Date(),
        },
      });
    } else {
      await prisma.transaction.create({
        data: {
          userId: result.userId,
          type: "income",
          category: "investment_withdraw",
          channel: "transfer",
          amount: amountTHB,
          note: `ถอนเงินจากบัญชีลงทุน ${currency}${foreignNote}`,
          date: new Date(),
        },
      });
    }

    return NextResponse.json(updated, { status: action === "deposit" ? 201 : 200 });
  } catch (err) {
    return safeResponse(err);
  }
}

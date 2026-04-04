import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";

export async function GET(req: Request) {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const { searchParams } = new URL(req.url);
    const month = searchParams.get("month");
    const year = searchParams.get("year");

    const dateFilter: Record<string, unknown> = {};
    if (year && /^\d{4}$/.test(year)) {
      const y = parseInt(year);
      if (y >= 2000 && y <= 2100) {
        dateFilter.date = { gte: new Date(y, 0, 1), lt: new Date(y + 1, 0, 1) };
      }
    } else if (month && /^\d{4}-\d{2}$/.test(month)) {
      const [y, m] = month.split("-").map(Number);
      if (y >= 2000 && y <= 2100 && m >= 1 && m <= 12) {
        dateFilter.date = { gte: new Date(y, m - 1, 1), lt: new Date(y, m, 1) };
      }
    }

    const where = { userId: result.userId, ...dateFilter };

    const transactions = await prisma.transaction.findMany({
      where,
      orderBy: { date: "desc" },
    });

    const INTERNAL_EXPENSE = ["credit_card_payment", "savings_deposit", "investment_buy"];
    const INTERNAL_INCOME = ["cashback", "savings_withdraw", "investment_sell"];

    const totalIncome = transactions
      .filter((t) => t.type === "income" && !INTERNAL_INCOME.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const totalExpense = transactions
      .filter((t) => t.type === "expense" && !INTERNAL_EXPENSE.includes(t.category))
      .reduce((sum, t) => sum + t.amount, 0);

    const balance = totalIncome - totalExpense;

    const expenseByCategory: Record<string, number> = {};
    const incomeByCategory: Record<string, number> = {};

    for (const t of transactions) {
      if (t.type === "expense" && INTERNAL_EXPENSE.includes(t.category)) continue;
      if (t.type === "income" && INTERNAL_INCOME.includes(t.category)) continue;
      const target = t.type === "expense" ? expenseByCategory : incomeByCategory;
      target[t.category] = (target[t.category] || 0) + t.amount;
    }

    const cards = await prisma.creditCard.findMany({
      where: { userId: result.userId },
    });
    const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0);

    const today = new Date();
    const currentDay = today.getDate();
    const bills = await prisma.bill.findMany({
      where: { userId: result.userId, isPaid: false },
    });

    const upcomingBills = bills.filter((b) => {
      const daysUntilDue =
        b.dueDay >= currentDay
          ? b.dueDay - currentDay
          : 30 - currentDay + b.dueDay;
      return daysUntilDue <= 7;
    });

    const lendings = await prisma.lending.findMany({
      where: { userId: result.userId, isReturned: false },
    });
    const totalLent = lendings.reduce((sum, l) => sum + l.amount, 0);
    const lendingByBorrower: Record<string, number> = {};
    for (const l of lendings) {
      lendingByBorrower[l.borrower] = (lendingByBorrower[l.borrower] || 0) + (l.amount - l.returnedAmount);
    }

    const savingsAccounts = await prisma.savingsAccount.findMany({
      where: { userId: result.userId },
    });
    const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);

    const investments = await prisma.investment.findMany({
      where: { userId: result.userId },
    });
    const exchangeRates = await prisma.exchangeRate.findMany({ where: { userId: result.userId } });
    const rateMap: Record<string, number> = { THB: 1 };
    for (const r of exchangeRates) rateMap[r.currency] = r.rate;

    const totalInvestment = investments.reduce((sum, i) => sum + i.currentValue * (rateMap[i.currency] || 1), 0);
    const totalInvestmentCost = investments.reduce((sum, i) => sum + i.costBasis * (rateMap[i.currency] || 1), 0);

    const physicalAssets = await prisma.physicalAsset.findMany({
      where: { userId: result.userId },
    });
    const totalPhysicalAssets = physicalAssets.reduce((sum, a) => sum + a.currentValue, 0);

    const totalCashback = transactions
      .filter((t) => t.type === "income" && t.category === "cashback")
      .reduce((sum, t) => sum + t.amount, 0);

    return NextResponse.json({
      totalIncome,
      totalExpense,
      balance,
      totalDebt,
      totalCashback,
      totalSavings,
      totalInvestment,
      totalInvestmentCost,
      totalPhysicalAssets,
      totalLent,
      lendingByBorrower,
      expenseByCategory,
      incomeByCategory,
      recentTransactions: transactions.slice(0, 10),
      upcomingBills,
    });
  } catch (err) {
    return safeResponse(err);
  }
}

import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET /api/dashboard - aggregated summary for dashboard
export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-03"
  const year = searchParams.get("year");   // "2026"

  // Build date filter - year takes priority if both provided
  const dateFilter: Record<string, unknown> = {};
  if (year) {
    const y = parseInt(year);
    dateFilter.date = {
      gte: new Date(y, 0, 1),
      lt: new Date(y + 1, 0, 1),
    };
  } else if (month) {
    const [y, m] = month.split("-").map(Number);
    dateFilter.date = {
      gte: new Date(y, m - 1, 1),
      lt: new Date(y, m, 1),
    };
  }

  const where = { userId: result.userId, ...dateFilter };

  // Fetch all transactions matching filter
  const transactions = await prisma.transaction.findMany({
    where,
    orderBy: { date: "desc" },
  });

  // Internal transfer categories - not real income/expenses but affect cash flow
  const INTERNAL_EXPENSE = ["credit_card_payment", "savings_deposit", "investment_buy"];
  const INTERNAL_INCOME = ["cashback", "savings_withdraw", "investment_sell"];

  // Real income/expense (for display)
  const totalIncome = transactions
    .filter((t) => t.type === "income" && !INTERNAL_INCOME.includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense" && !INTERNAL_EXPENSE.includes(t.category))
    .reduce((sum, t) => sum + t.amount, 0);

  const balance = totalIncome - totalExpense;

  // Group by category (exclude internal transfers from charts)
  const expenseByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};

  for (const t of transactions) {
    if (t.type === "expense" && INTERNAL_EXPENSE.includes(t.category)) continue;
    if (t.type === "income" && INTERNAL_INCOME.includes(t.category)) continue;
    const target = t.type === "expense" ? expenseByCategory : incomeByCategory;
    target[t.category] = (target[t.category] || 0) + t.amount;
  }

  // Get total credit card debt
  const cards = await prisma.creditCard.findMany({
    where: { userId: result.userId },
  });
  const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0);

  // Get upcoming bills (within 7 days)
  const today = new Date();
  const currentDay = today.getDate();
  const bills = await prisma.bill.findMany({
    where: { userId: result.userId, isPaid: false },
  });

  const upcomingBills = bills.filter((b) => {
    const daysUntilDue =
      b.dueDay >= currentDay
        ? b.dueDay - currentDay
        : 30 - currentDay + b.dueDay; // wrap around month
    return daysUntilDue <= 7;
  });

  // Get lending summary
  const lendings = await prisma.lending.findMany({
    where: { userId: result.userId, isReturned: false },
  });
  const totalLent = lendings.reduce((sum, l) => sum + l.amount, 0);
  const lendingByBorrower: Record<string, number> = {};
  for (const l of lendings) {
    lendingByBorrower[l.borrower] = (lendingByBorrower[l.borrower] || 0) + (l.amount - l.returnedAmount);
  }

  // Get savings summary
  const savingsAccounts = await prisma.savingsAccount.findMany({
    where: { userId: result.userId },
  });
  const totalSavings = savingsAccounts.reduce((sum, a) => sum + a.balance, 0);

  // Get investment summary
  const investments = await prisma.investment.findMany({
    where: { userId: result.userId },
  });
  const exchangeRates = await prisma.exchangeRate.findMany({ where: { userId: result.userId } });
  const rateMap: Record<string, number> = { THB: 1 };
  for (const r of exchangeRates) rateMap[r.currency] = r.rate;

  const totalInvestment = investments.reduce((sum, i) => sum + i.currentValue * (rateMap[i.currency] || 1), 0);
  const totalInvestmentCost = investments.reduce((sum, i) => sum + i.costBasis * (rateMap[i.currency] || 1), 0);

  // Get physical assets summary
  const physicalAssets = await prisma.physicalAsset.findMany({
    where: { userId: result.userId },
  });
  const totalPhysicalAssets = physicalAssets.reduce((sum, a) => sum + a.currentValue, 0);

  // Cashback total (separate from income)
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
}

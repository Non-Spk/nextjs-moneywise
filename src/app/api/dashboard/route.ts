import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId } from "@/lib/api-helpers";

// GET /api/dashboard - aggregated summary for dashboard
export async function GET(req: Request) {
  const result = await getAuthUserId();
  if ("error" in result) return result.error;

  const { searchParams } = new URL(req.url);
  const month = searchParams.get("month"); // "2026-03"

  // Build date filter
  const dateFilter: Record<string, unknown> = {};
  if (month) {
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

  // Calculate totals
  const totalIncome = transactions
    .filter((t) => t.type === "income")
    .reduce((sum, t) => sum + t.amount, 0);

  const totalExpense = transactions
    .filter((t) => t.type === "expense")
    .reduce((sum, t) => sum + t.amount, 0);

  // Group expenses by category
  const expenseByCategory: Record<string, number> = {};
  const incomeByCategory: Record<string, number> = {};

  for (const t of transactions) {
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

  return NextResponse.json({
    totalIncome,
    totalExpense,
    balance: totalIncome - totalExpense,
    totalDebt,
    totalLent,
    lendingByBorrower,
    expenseByCategory,
    incomeByCategory,
    recentTransactions: transactions.slice(0, 10),
    upcomingBills,
  });
}

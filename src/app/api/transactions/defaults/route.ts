import { NextResponse } from "next/server";
import { prisma } from "@/lib/prisma";
import { getAuthUserId, safeResponse } from "@/lib/api-helpers";

export async function GET() {
  try {
    const result = await getAuthUserId();
    if ("error" in result) return result.error;

    const transactions = await prisma.transaction.findMany({
      where: { userId: result.userId },
      select: { type: true, category: true, channel: true },
    });

    if (transactions.length === 0) {
      return NextResponse.json({
        type: "expense",
        category: "",
        channel: "cash",
        expenseCategory: "",
        incomeCategory: "",
      });
    }

    function mostFrequent(arr: string[]): string {
      const freq: Record<string, number> = {};
      for (const v of arr) {
        freq[v] = (freq[v] || 0) + 1;
      }
      let max = 0;
      let result = "";
      for (const [key, count] of Object.entries(freq)) {
        if (count > max) { max = count; result = key; }
      }
      return result;
    }

    const allTypes = transactions.map((t) => t.type);
    const allChannels = transactions.map((t) => t.channel);
    const expenseCategories = transactions.filter((t) => t.type === "expense").map((t) => t.category);
    const incomeCategories = transactions.filter((t) => t.type === "income").map((t) => t.category);

    return NextResponse.json({
      type: mostFrequent(allTypes) || "expense",
      category: mostFrequent(transactions.map((t) => t.category)) || "",
      channel: mostFrequent(allChannels) || "cash",
      expenseCategory: mostFrequent(expenseCategories) || "",
      incomeCategory: mostFrequent(incomeCategories) || "",
    });
  } catch (err) {
    return safeResponse(err);
  }
}

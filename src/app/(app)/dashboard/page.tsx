"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import {
  formatCurrency,
  getCategoryLabel,
  getChannelLabel,
} from "@/lib/constants";

interface DashboardData {
  totalIncome: number;
  totalExpense: number;
  balance: number;
  totalDebt: number;
  expenseByCategory: Record<string, number>;
  incomeByCategory: Record<string, number>;
  recentTransactions: {
    id: string;
    type: string;
    category: string;
    channel: string;
    amount: number;
    note: string;
    date: string;
  }[];
  upcomingBills: { id: string; name: string; amount: number; dueDay: number }[];
}

export default function DashboardPage() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });

  const fetchData = useCallback(async () => {
    const res = await fetch(`/api/dashboard?month=${month}`);
    if (res.ok) setData(await res.json());
  }, [month]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Build horizontal bar chart data
  function renderCategoryBars(
    categories: Record<string, number>,
    color: string
  ) {
    const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? entries[0][1] : 1;

    if (entries.length === 0) {
      return (
        <p className="text-sm text-[var(--body-text)] text-center py-4">
          ไม่มีข้อมูล
        </p>
      );
    }

    return entries.map(([cat, amount]) => (
      <div key={cat} className="flex items-center gap-3 mb-2">
        <span className="w-28 text-right text-xs text-[var(--body-text)] shrink-0">
          {getCategoryLabel(cat)}
        </span>
        <div className="flex-1 h-5 bg-[var(--light-bg)] rounded overflow-hidden">
          <div
            className="h-full rounded text-[10px] text-white font-semibold flex items-center pl-2"
            style={{
              width: `${(amount / max) * 100}%`,
              backgroundColor: color,
              minWidth: "20px",
            }}
          >
            {formatCurrency(amount)}
          </div>
        </div>
      </div>
    ));
  }

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6">
        {/* Month filter */}
        <div className="mb-5">
          <input
            type="month"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] outline-none"
          />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="text-xs text-[var(--body-text)] font-semibold uppercase tracking-wide">
              รายรับ
            </p>
            <p className="text-2xl font-bold text-[var(--success)] mt-1">
              {formatCurrency(data?.totalIncome || 0)}
            </p>
            <p className="text-[10px] text-[var(--body-text)]">บาท</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="text-xs text-[var(--body-text)] font-semibold uppercase tracking-wide">
              รายจ่าย
            </p>
            <p className="text-2xl font-bold text-[var(--danger)] mt-1">
              {formatCurrency(data?.totalExpense || 0)}
            </p>
            <p className="text-[10px] text-[var(--body-text)]">บาท</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="text-xs text-[var(--body-text)] font-semibold uppercase tracking-wide">
              คงเหลือ
            </p>
            <p className="text-2xl font-bold text-[var(--info)] mt-1">
              {formatCurrency(data?.balance || 0)}
            </p>
            <p className="text-[10px] text-[var(--body-text)]">บาท</p>
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <p className="text-xs text-[var(--body-text)] font-semibold uppercase tracking-wide">
              หนี้บัตรเครดิต
            </p>
            <p className="text-2xl font-bold text-[var(--warning)] mt-1">
              {formatCurrency(data?.totalDebt || 0)}
            </p>
            <p className="text-[10px] text-[var(--body-text)]">บาท</p>
          </div>
        </div>

        {/* Category charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">รายจ่ายตามหมวดหมู่</h3>
            {renderCategoryBars(
              data?.expenseByCategory || {},
              "var(--danger)"
            )}
          </div>
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">รายรับตามหมวดหมู่</h3>
            {renderCategoryBars(
              data?.incomeByCategory || {},
              "var(--success)"
            )}
          </div>
        </div>

        {/* Upcoming bills alert */}
        {data?.upcomingBills && data.upcomingBills.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6">
            <h3 className="font-bold text-sm text-amber-800 mb-2">
              บิลที่ใกล้ครบกำหนด
            </h3>
            {data.upcomingBills.map((bill) => (
              <p key={bill.id} className="text-sm text-amber-700">
                {bill.name} - {formatCurrency(bill.amount)} บาท (วันที่{" "}
                {bill.dueDay})
              </p>
            ))}
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">รายการล่าสุด</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--light-bg)]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">
                    วันที่
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">
                    รายการ
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">
                    หมวดหมู่
                  </th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">
                    ช่องทาง
                  </th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--body-text)] uppercase">
                    จำนวน
                  </th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map((tx) => (
                  <tr key={tx.id} className="border-b border-gray-100">
                    <td className="px-3 py-2.5 text-sm">
                      {new Date(tx.date).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-3 py-2.5 text-sm">{tx.note || "-"}</td>
                    <td className="px-3 py-2.5 text-sm">
                      {getCategoryLabel(tx.category)}
                    </td>
                    <td className="px-3 py-2.5 text-sm">
                      <span
                        className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                          tx.channel === "cash"
                            ? "bg-blue-50 text-blue-600"
                            : tx.channel === "transfer"
                              ? "bg-amber-50 text-amber-600"
                              : "bg-purple-50 text-purple-600"
                        }`}
                      >
                        {getChannelLabel(tx.channel)}
                      </span>
                    </td>
                    <td
                      className={`px-3 py-2.5 text-sm text-right font-semibold ${
                        tx.type === "income"
                          ? "text-[var(--success)]"
                          : "text-[var(--danger)]"
                      }`}
                    >
                      {tx.type === "income" ? "+" : "-"}
                      {formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {(!data?.recentTransactions ||
                  data.recentTransactions.length === 0) && (
                  <tr>
                    <td
                      colSpan={5}
                      className="px-3 py-8 text-center text-sm text-[var(--body-text)]"
                    >
                      ยังไม่มีรายการ
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

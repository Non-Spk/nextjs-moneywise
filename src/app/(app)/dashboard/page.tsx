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

  function renderCategoryBars(
    categories: Record<string, number>,
    color: string
  ) {
    const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? entries[0][1] : 1;

    if (entries.length === 0) {
      return (
        <p className="text-sm text-[var(--text-secondary)] text-center py-4">
          ไม่มีข้อมูล
        </p>
      );
    }

    return entries.map(([cat, amount]) => (
      <div key={cat} className="flex items-center gap-3 mb-2">
        <span className="w-28 text-right text-xs text-[var(--text-secondary)] shrink-0">
          {getCategoryLabel(cat)}
        </span>
        <div className="flex-1 h-5 bg-[var(--table-header-bg)] rounded overflow-hidden">
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
            className="px-3 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-md text-sm focus:border-[var(--brand-red)] outline-none transition-colors"
          />
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
              รายรับ
            </p>
            <p className="text-2xl font-bold text-[var(--success)] mt-1">
              {formatCurrency(data?.totalIncome || 0)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
              รายจ่าย
            </p>
            <p className="text-2xl font-bold text-[var(--danger)] mt-1">
              {formatCurrency(data?.totalExpense || 0)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
              คงเหลือ
            </p>
            <p className="text-2xl font-bold text-[var(--info)] mt-1">
              {formatCurrency(data?.balance || 0)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <p className="text-xs text-[var(--text-secondary)] font-semibold uppercase tracking-wide">
              หนี้บัตรเครดิต
            </p>
            <p className="text-2xl font-bold text-[var(--warning)] mt-1">
              {formatCurrency(data?.totalDebt || 0)}
            </p>
            <p className="text-[10px] text-[var(--text-secondary)]">บาท</p>
          </div>
        </div>

        {/* Category charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">รายจ่ายตามหมวดหมู่</h3>
            {renderCategoryBars(data?.expenseByCategory || {}, "var(--danger)")}
          </div>
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">รายรับตามหมวดหมู่</h3>
            {renderCategoryBars(data?.incomeByCategory || {}, "var(--success)")}
          </div>
        </div>

        {/* Upcoming bills alert */}
        {data?.upcomingBills && data.upcomingBills.length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-6 dark:bg-amber-900/20 dark:border-amber-800">
            <h3 className="font-bold text-sm text-amber-800 mb-2 dark:text-amber-300">
              บิลที่ใกล้ครบกำหนด
            </h3>
            {data.upcomingBills.map((bill) => (
              <p key={bill.id} className="text-sm text-amber-700 dark:text-amber-400">
                {bill.name} - {formatCurrency(bill.amount)} บาท (วันที่ {bill.dueDay})
              </p>
            ))}
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
          <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">รายการล่าสุด</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)]">
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">วันที่</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">รายการ</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">หมวดหมู่</th>
                  <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">ช่องทาง</th>
                  <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--table-row-border)]">
                    <td className="px-3 py-2.5 text-sm text-[var(--text-primary)]">
                      {new Date(tx.date).toLocaleDateString("th-TH")}
                    </td>
                    <td className="px-3 py-2.5 text-sm text-[var(--text-primary)]">{tx.note || "-"}</td>
                    <td className="px-3 py-2.5 text-sm text-[var(--text-primary)]">{getCategoryLabel(tx.category)}</td>
                    <td className="px-3 py-2.5 text-sm">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]">
                        {getChannelLabel(tx.channel)}
                      </span>
                    </td>
                    <td className={`px-3 py-2.5 text-sm text-right font-semibold ${
                      tx.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"
                    }`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                  <tr>
                    <td colSpan={5} className="px-3 py-8 text-center text-sm text-[var(--text-secondary)]">
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

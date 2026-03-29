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
  totalCashback: number;
  totalLent: number;
  lendingByBorrower: Record<string, number>;
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
  const [viewMode, setViewMode] = useState<"month" | "year">("month");
  const [month, setMonth] = useState(() => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}`;
  });
  const [year, setYear] = useState(() => String(new Date().getFullYear()));

  const fetchData = useCallback(async () => {
    const params = viewMode === "year" ? `year=${year}` : `month=${month}`;
    const res = await fetch(`/api/dashboard?${params}`);
    if (res.ok) setData(await res.json());
  }, [viewMode, month, year]);

  useEffect(() => { fetchData(); }, [fetchData]);

  function renderCategoryBars(categories: Record<string, number>, color: string) {
    const entries = Object.entries(categories).sort((a, b) => b[1] - a[1]);
    const max = entries.length > 0 ? entries[0][1] : 1;
    if (entries.length === 0) {
      return <p className="text-[13px] text-[var(--text-tertiary)] text-center py-6">ไม่มีข้อมูล</p>;
    }
    return entries.map(([cat, amount]) => (
      <div key={cat} className="flex items-center gap-3 mb-2.5">
        <span className="w-28 text-right text-[12px] text-[var(--text-secondary)] shrink-0">{getCategoryLabel(cat)}</span>
        <div className="flex-1 h-6 bg-[var(--bg-subtle)] rounded-md overflow-hidden">
          <div className="h-full rounded-md text-[10px] text-white font-medium flex items-center pl-2.5"
            style={{ width: `${Math.max((amount / max) * 100, 8)}%`, backgroundColor: color }}>
            {formatCurrency(amount)}
          </div>
        </div>
      </div>
    ));
  }

  const stats = [
    { label: "รายรับ", value: data?.totalIncome || 0, color: "var(--success)" },
    { label: "รายจ่าย", value: data?.totalExpense || 0, color: "var(--danger)" },
    { label: "คงเหลือ", value: data?.balance || 0, color: "var(--info)" },
    { label: "หนี้บัตรเครดิต", value: data?.totalDebt || 0, color: "var(--warning)" },
    { label: "Cashback", value: data?.totalCashback || 0, color: "var(--info)" },
    { label: "ให้ยืมค้าง", value: data?.totalLent || 0, color: "var(--warning)" },
  ];

  return (
    <>
      <Topbar title="Dashboard" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex items-center gap-3 mb-6">
          <div className="flex bg-[var(--bg-subtle)] rounded-lg p-1">
            <button onClick={() => setViewMode("month")}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200 ${
                viewMode === "month"
                  ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              รายเดือน
            </button>
            <button onClick={() => setViewMode("year")}
              className={`px-3 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200 ${
                viewMode === "year"
                  ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                  : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
              }`}>
              รายปี
            </button>
          </div>
          {viewMode === "month" ? (
            <input type="month" value={month} onChange={(e) => setMonth(e.target.value)}
              className="px-3.5 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] focus:border-[var(--brand-red)] outline-none transition-colors" />
          ) : (
            <select value={year} onChange={(e) => setYear(e.target.value)}
              className="px-3.5 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] focus:border-[var(--brand-red)] outline-none transition-colors">
              {Array.from({ length: 5 }, (_, i) => new Date().getFullYear() - i).map((y) => (
                <option key={y} value={y}>{y}</option>
              ))}
            </select>
          )}
        </div>

        {/* Stats cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {stats.map((stat) => (
            <div key={stat.label} className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] transition-colors">
              <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">{stat.label}</p>
              <p className="text-[22px] font-bold mt-1.5 tracking-tight" style={{ color: stat.color }}>{formatCurrency(stat.value)}</p>
              <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">บาท</p>
            </div>
          ))}
        </div>

        {/* Category charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] transition-colors">
            <h3 className="font-semibold text-[14px] mb-4 text-[var(--text-primary)]">รายจ่ายตามหมวดหมู่</h3>
            {renderCategoryBars(data?.expenseByCategory || {}, "var(--danger)")}
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] transition-colors">
            <h3 className="font-semibold text-[14px] mb-4 text-[var(--text-primary)]">รายรับตามหมวดหมู่</h3>
            {renderCategoryBars(data?.incomeByCategory || {}, "var(--success)")}
          </div>
        </div>

        {/* Lending by borrower */}
        {data?.lendingByBorrower && Object.keys(data.lendingByBorrower).length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] mb-6">
            <h3 className="font-semibold text-[14px] mb-4 text-[var(--text-primary)]">ให้ยืมค้าง - แยกตามคน</h3>
            <div className="space-y-2.5">
              {Object.entries(data.lendingByBorrower).sort((a, b) => b[1] - a[1]).map(([name, amount]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-[var(--table-row-border)] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--warning-bg)] flex items-center justify-center text-[12px] font-semibold text-[var(--warning-text)]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <span className="text-[13px] font-medium text-[var(--text-primary)]">{name}</span>
                  </div>
                  <span className="text-[14px] font-semibold text-[var(--warning)]">{formatCurrency(amount)} บาท</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Upcoming bills alert */}
        {data?.upcomingBills && data.upcomingBills.length > 0 && (
          <div className="bg-[var(--warning-bg)] rounded-xl p-4 mb-6">
            <h3 className="font-semibold text-[13px] text-[var(--warning-text)] mb-2">บิลที่ใกล้ครบกำหนด</h3>
            {data.upcomingBills.map((bill) => (
              <p key={bill.id} className="text-[13px] text-[var(--warning-text)]">
                {bill.name} - {formatCurrency(bill.amount)} บาท (วันที่ {bill.dueDay})
              </p>
            ))}
          </div>
        )}

        {/* Recent transactions */}
        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden transition-colors">
          <div className="px-5 py-4">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)]">รายการล่าสุด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)] border-y border-[var(--card-border)]">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">วันที่</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">รายการ</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">หมวดหมู่</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">ช่องทาง</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">จำนวน</th>
                </tr>
              </thead>
              <tbody>
                {data?.recentTransactions?.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{new Date(tx.date).toLocaleDateString("th-TH")}</td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{tx.note || "-"}</td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{getCategoryLabel(tx.category)}</td>
                    <td className="px-5 py-3 text-[13px]">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]">{getChannelLabel(tx.channel)}</span>
                    </td>
                    <td className={`px-5 py-3 text-[13px] text-right font-semibold ${tx.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </td>
                  </tr>
                ))}
                {(!data?.recentTransactions || data.recentTransactions.length === 0) && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[13px] text-[var(--text-tertiary)]">ยังไม่มีรายการ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </>
  );
}

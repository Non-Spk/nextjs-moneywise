"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CHANNELS,
  ALL_CATEGORIES,
  formatCurrency,
  getCategoryLabel,
  getChannelLabel,
} from "@/lib/constants";
import { exportToExcel } from "@/lib/export";

interface Transaction {
  id: string;
  type: string;
  category: string;
  channel: string;
  amount: number;
  note: string;
  date: string;
  creditCard?: { bankName: string; cardNumber: string } | null;
}

interface CreditCard {
  id: string;
  bankName: string;
  cardNumber: string;
}

export default function TransactionsPage() {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [showModal, setShowModal] = useState(false);

  // Filters
  const [filterType, setFilterType] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Form state
  const [formType, setFormType] = useState("expense");
  const [formCategory, setFormCategory] = useState("");
  const [formChannel, setFormChannel] = useState("cash");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(
    new Date().toISOString().split("T")[0]
  );
  const [formCreditCardId, setFormCreditCardId] = useState("");

  const fetchTransactions = useCallback(async () => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterChannel) params.set("channel", filterChannel);
    if (filterCategory) params.set("category", filterCategory);
    if (filterMonth) params.set("month", filterMonth);

    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) setTransactions(await res.json());
  }, [filterType, filterChannel, filterCategory, filterMonth]);

  const fetchCreditCards = useCallback(async () => {
    const res = await fetch("/api/credit-cards");
    if (res.ok) setCreditCards(await res.json());
  }, []);

  useEffect(() => {
    fetchTransactions();
    fetchCreditCards();
  }, [fetchTransactions, fetchCreditCards]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: formType,
        category: formCategory,
        channel: formChannel,
        amount: formAmount,
        note: formNote,
        date: formDate,
        creditCardId: formChannel === "credit" ? formCreditCardId : null,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      resetForm();
      fetchTransactions();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) fetchTransactions();
  }

  function resetForm() {
    setFormType("expense");
    setFormCategory("");
    setFormChannel("cash");
    setFormAmount("");
    setFormNote("");
    setFormDate(new Date().toISOString().split("T")[0]);
    setFormCreditCardId("");
  }

  const categoryOptions =
    formType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;

  return (
    <>
      <Topbar title="รายรับ-รายจ่าย" />
      <div className="p-6">
        {/* Header + Add button */}
        <div className="flex justify-between items-center mb-4">
          <h2 className="font-bold text-base">บันทึกรายรับ-รายจ่าย</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportToExcel("transactions", {
                month: filterMonth,
                filterType,
                filterChannel,
                filterCategory,
              })}
              className="px-4 py-2 bg-[var(--medium-gray)] text-[var(--light-bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Export Excel
            </button>
            <button
              onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              + เพิ่มรายการ
            </button>
          </div>
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-3 mb-5">
          <select
            value={filterType}
            onChange={(e) => setFilterType(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]"
          >
            <option value="">ทั้งหมด</option>
            <option value="income">รายรับ</option>
            <option value="expense">รายจ่าย</option>
          </select>
          <select
            value={filterChannel}
            onChange={(e) => setFilterChannel(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]"
          >
            <option value="">ทุกช่องทาง</option>
            {CHANNELS.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <select
            value={filterCategory}
            onChange={(e) => setFilterCategory(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]"
          >
            <option value="">ทุกหมวดหมู่</option>
            {ALL_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>{c.label}</option>
            ))}
          </select>
          <input
            type="month"
            value={filterMonth}
            onChange={(e) => setFilterMonth(e.target.value)}
            className="px-3 py-2 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow-sm overflow-x-auto">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--light-bg)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">วันที่</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">รายการ</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">หมวดหมู่</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">ช่องทาง</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--body-text)] uppercase">จำนวน</th>
                <th className="px-3 py-2 w-10"></th>
              </tr>
            </thead>
            <tbody>
              {transactions.map((tx) => (
                <tr key={tx.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5 text-sm">{new Date(tx.date).toLocaleDateString("th-TH")}</td>
                  <td className="px-3 py-2.5 text-sm">{tx.note || "-"}</td>
                  <td className="px-3 py-2.5 text-sm">{getCategoryLabel(tx.category)}</td>
                  <td className="px-3 py-2.5 text-sm">
                    <span className={`inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold ${
                      tx.channel === "cash" ? "bg-blue-50 text-blue-600"
                        : tx.channel === "transfer" ? "bg-amber-50 text-amber-600"
                        : "bg-purple-50 text-purple-600"
                    }`}>
                      {getChannelLabel(tx.channel)}
                      {tx.creditCard ? ` (${tx.creditCard.bankName} *${tx.creditCard.cardNumber})` : ""}
                    </span>
                  </td>
                  <td className={`px-3 py-2.5 text-sm text-right font-semibold ${
                    tx.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"
                  }`}>
                    {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                  </td>
                  <td className="px-3 py-2.5">
                    <button onClick={() => handleDelete(tx.id)} className="text-gray-300 hover:text-[var(--danger)] transition-colors" aria-label="ลบ">
                      x
                    </button>
                  </td>
                </tr>
              ))}
              {transactions.length === 0 && (
                <tr><td colSpan={6} className="px-3 py-8 text-center text-sm text-[var(--body-text)]">ยังไม่มีรายการ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Transaction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-2xl">
            <h2 className="text-lg font-bold mb-5">เพิ่มรายการ</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">ประเภท</label>
                <select value={formType} onChange={(e) => { setFormType(e.target.value); setFormCategory(""); }}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]">
                  <option value="expense">รายจ่าย</option>
                  <option value="income">รายรับ</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">หมวดหมู่</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]">
                  <option value="">เลือกหมวดหมู่</option>
                  {categoryOptions.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">ช่องทาง</label>
                <select value={formChannel} onChange={(e) => setFormChannel(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]">
                  {CHANNELS.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              {formChannel === "credit" && (
                <div className="mb-4">
                  <label className="block text-sm font-semibold mb-1">บัตรเครดิต</label>
                  <select value={formCreditCardId} onChange={(e) => setFormCreditCardId(e.target.value)} required
                    className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]">
                    <option value="">เลือกบัตร</option>
                    {creditCards.map((cc) => (
                      <option key={cc.id} value={cc.id}>{cc.bankName} *{cc.cardNumber}</option>
                    ))}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">จำนวนเงิน (บาท)</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">วันที่</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">หมายเหตุ</label>
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]"
                  placeholder="รายละเอียดเพิ่มเติม" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50">
                  ยกเลิก
                </button>
                <button type="submit"
                  className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90">
                  บันทึก
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

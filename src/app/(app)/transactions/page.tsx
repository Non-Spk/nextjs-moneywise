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

  const [filterType, setFilterType] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  const [formType, setFormType] = useState("expense");
  const [formCategory, setFormCategory] = useState("");
  const [formChannel, setFormChannel] = useState("cash");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
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
        type: formType, category: formCategory, channel: formChannel,
        amount: formAmount, note: formNote, date: formDate,
        creditCardId: formChannel === "credit" ? formCreditCardId : null,
      }),
    });
    if (res.ok) { setShowModal(false); resetForm(); fetchTransactions(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) fetchTransactions();
  }

  function resetForm() {
    setFormType("expense"); setFormCategory(""); setFormChannel("cash");
    setFormAmount(""); setFormNote(""); setFormDate(new Date().toISOString().split("T")[0]);
    setFormCreditCardId("");
  }

  const categoryOptions = formType === "income" ? INCOME_CATEGORIES : EXPENSE_CATEGORIES;
  const selectClass = "px-3.5 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";
  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="รายรับ-รายจ่าย" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">บันทึกรายรับ-รายจ่าย</h2>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel("transactions", { month: filterMonth, filterType, filterChannel, filterCategory })}
              className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">
              Export Excel
            </button>
            <button onClick={() => { resetForm(); setShowModal(true); }}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">
              + เพิ่มรายการ
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2.5 mb-5">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
            <option value="">ทั้งหมด</option>
            <option value="income">รายรับ</option>
            <option value="expense">รายจ่าย</option>
          </select>
          <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className={selectClass}>
            <option value="">ทุกช่องทาง</option>
            {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="">ทุกหมวดหมู่</option>
            {ALL_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectClass} />
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)] border-b border-[var(--card-border)]">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">วันที่</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">รายการ</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">หมวดหมู่</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">ช่องทาง</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">จำนวน</th>
                  <th className="px-5 py-2.5 w-10"></th>
                </tr>
              </thead>
              <tbody>
                {transactions.map((tx) => (
                  <tr key={tx.id} className="border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{new Date(tx.date).toLocaleDateString("th-TH")}</td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{tx.note || "-"}</td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{getCategoryLabel(tx.category)}</td>
                    <td className="px-5 py-3 text-[13px]">
                      <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]">
                        {getChannelLabel(tx.channel)}{tx.creditCard ? ` (${tx.creditCard.bankName} *${tx.creditCard.cardNumber})` : ""}
                      </span>
                    </td>
                    <td className={`px-5 py-3 text-[13px] text-right font-semibold ${tx.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </td>
                    <td className="px-5 py-3">
                      <button onClick={() => handleDelete(tx.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors" aria-label="ลบ">
                        <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                      </button>
                    </td>
                  </tr>
                ))}
                {transactions.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[13px] text-[var(--text-tertiary)]">ยังไม่มีรายการ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มรายการ</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภท</label>
                <select value={formType} onChange={(e) => { setFormType(e.target.value); setFormCategory(""); }} className={inputClass}>
                  <option value="expense">รายจ่าย</option>
                  <option value="income">รายรับ</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมวดหมู่</label>
                <select value={formCategory} onChange={(e) => setFormCategory(e.target.value)} required className={inputClass}>
                  <option value="">เลือกหมวดหมู่</option>
                  {categoryOptions.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ช่องทาง</label>
                <select value={formChannel} onChange={(e) => setFormChannel(e.target.value)} className={inputClass}>
                  {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              {formChannel === "credit" && (
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">บัตรเครดิต</label>
                  <select value={formCreditCardId} onChange={(e) => setFormCreditCardId(e.target.value)} required className={inputClass}>
                    <option value="">เลือกบัตร</option>
                    {creditCards.map((cc) => <option key={cc.id} value={cc.id}>{cc.bankName} *{cc.cardNumber}</option>)}
                  </select>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงิน (บาท)</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมายเหตุ</label>
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} className={inputClass} placeholder="รายละเอียดเพิ่มเติม" />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit"
                  className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

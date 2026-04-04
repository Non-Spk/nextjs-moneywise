"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import LoadingScreen from "@/components/LoadingScreen";
import {
  EXPENSE_CATEGORIES,
  INCOME_CATEGORIES,
  CHANNELS,
  ALL_CATEGORIES,
  formatCurrency as rawFormatCurrency,
  getCategoryLabel,
  getChannelLabel,
} from "@/lib/constants";
import { useAmount } from "@/lib/useAmount";
import { exportToExcel } from "@/lib/export";

interface Transaction {
  id: string;
  type: string;
  category: string;
  channel: string;
  amount: number;
  note: string;
  date: string;
  groupId: string | null;
  creditCard?: { bankName: string; cardNumber: string } | null;
}

interface CreditCard {
  id: string;
  bankName: string;
  cardNumber: string;
}

interface CustomCategory {
  id: string;
  type: string;
  value: string;
  label: string;
}

type ModalMode = "simple" | "salary" | "expense_change";

interface SmartDefaults {
  type: string;
  category: string;
  channel: string;
  expenseCategory: string;
  incomeCategory: string;
}

const FALLBACK_DEFAULTS: SmartDefaults = {
  type: "expense",
  category: "",
  channel: "cash",
  expenseCategory: "",
  incomeCategory: "",
};

export default function TransactionsPage() {
  const formatCurrency = useAmount();
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [creditCards, setCreditCards] = useState<CreditCard[]>([]);
  const [customCategories, setCustomCategories] = useState<CustomCategory[]>([]);
  const [defaults, setDefaults] = useState<SmartDefaults>(FALLBACK_DEFAULTS);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [modalMode, setModalMode] = useState<ModalMode>("simple");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);

  const [filterType, setFilterType] = useState("");
  const [filterChannel, setFilterChannel] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [filterMonth, setFilterMonth] = useState("");

  // Simple form
  const [formType, setFormType] = useState("expense");
  const [formCategory, setFormCategory] = useState("");
  const [formChannel, setFormChannel] = useState("cash");
  const [formAmount, setFormAmount] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCreditCardId, setFormCreditCardId] = useState("");

  // Salary breakdown
  const [salaryGross, setSalaryGross] = useState("");
  const [salaryTax, setSalaryTax] = useState("");
  const [salarySS, setSalarySS] = useState("");
  const [salaryPF, setSalaryPF] = useState("");
  const [salaryOther, setSalaryOther] = useState("");
  const [salaryOtherNote, setSalaryOtherNote] = useState("");
  const [salaryChannel, setSalaryChannel] = useState("transfer");
  const [salaryDate, setSalaryDate] = useState(new Date().toISOString().split("T")[0]);

  // Expense with change
  const [expPaid, setExpPaid] = useState("");
  const [expActual, setExpActual] = useState("");
  const [expCategory, setExpCategory] = useState("");
  const [expChannel, setExpChannel] = useState("cash");
  const [expNote, setExpNote] = useState("");
  const [expDate, setExpDate] = useState(new Date().toISOString().split("T")[0]);
  const [expCreditCardId, setExpCreditCardId] = useState("");

  const fetchTransactions = useCallback(async (p = page) => {
    const params = new URLSearchParams();
    if (filterType) params.set("type", filterType);
    if (filterChannel) params.set("channel", filterChannel);
    if (filterCategory) params.set("category", filterCategory);
    if (filterMonth) params.set("month", filterMonth);
    params.set("page", String(p));
    params.set("limit", "50");
    const res = await fetch(`/api/transactions?${params}`);
    if (res.ok) {
      const json = await res.json();
      setTransactions(json.data);
      setTotal(json.total);
      setTotalPages(json.totalPages);
      setPage(json.page);
    }
  }, [filterType, filterChannel, filterCategory, filterMonth, page]);

  const fetchCreditCards = useCallback(async () => {
    const res = await fetch("/api/credit-cards");
    if (res.ok) setCreditCards(await res.json());
  }, []);

  const fetchCustomCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCustomCategories(await res.json());
  }, []);

  const fetchDefaults = useCallback(async () => {
    const res = await fetch("/api/transactions/defaults");
    if (res.ok) {
      const d = await res.json();
      setDefaults(d);
    }
  }, []);

  // Reset to page 1 when filters change
  useEffect(() => { setPage(1); }, [filterType, filterChannel, filterCategory, filterMonth]);

  useEffect(() => { fetchTransactions(); fetchCreditCards(); fetchCustomCategories(); fetchDefaults(); }, [fetchTransactions, fetchCreditCards, fetchCustomCategories, fetchDefaults]);

  useEffect(() => { if (transactions.length >= 0 && defaults) setLoading(false); }, [transactions, defaults]);

  if (loading) return <><Topbar title="รายรับ-รายจ่าย" /><LoadingScreen /></>;

  async function handleSimpleSubmit(e: React.FormEvent) {
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
    if (res.ok) { setShowModal(false); resetForm(); fetchTransactions(); fetchDefaults(); }
  }

  async function handleSalarySubmit(e: React.FormEvent) {
    e.preventDefault();
    const gross = parseFloat(salaryGross) || 0;
    const tax = parseFloat(salaryTax) || 0;
    const ss = parseFloat(salarySS) || 0;
    const pf = parseFloat(salaryPF) || 0;
    const other = parseFloat(salaryOther) || 0;
    const net = gross - tax - ss - pf - other;

    const items: Record<string, unknown>[] = [];
    // Net salary as income
    if (net > 0) {
      items.push({ type: "income", category: "salary", channel: salaryChannel, amount: net, note: "เงินเดือน (สุทธิ)", date: salaryDate });
    }
    if (tax > 0) {
      items.push({ type: "expense", category: "withholding_tax", channel: salaryChannel, amount: tax, note: "ภาษี ณ ที่จ่าย", date: salaryDate });
    }
    if (ss > 0) {
      items.push({ type: "expense", category: "social_security_expense", channel: salaryChannel, amount: ss, note: "ประกันสังคม", date: salaryDate });
    }
    if (pf > 0) {
      items.push({ type: "expense", category: "provident_fund_expense", channel: salaryChannel, amount: pf, note: "กองทุนสำรองเลี้ยงชีพ", date: salaryDate });
    }
    if (other > 0) {
      items.push({ type: "expense", category: "other_expense", channel: salaryChannel, amount: other, note: salaryOtherNote || "หักอื่นๆ", date: salaryDate });
    }

    if (items.length === 0) return;

    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ items }),
    });
    if (res.ok) { setShowModal(false); resetForm(); fetchTransactions(); fetchDefaults(); }
  }

  async function handleExpChangeSubmit(e: React.FormEvent) {
    e.preventDefault();
    const paid = parseFloat(expPaid) || 0;
    const actual = parseFloat(expActual) || 0;
    if (actual <= 0) return;

    // Only the actual expense amount is recorded
    const res = await fetch("/api/transactions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        type: "expense", category: expCategory, channel: expChannel,
        amount: actual,
        note: paid > actual ? `${expNote || ""} (จ่าย ${rawFormatCurrency(paid)}, ทอน ${rawFormatCurrency(paid - actual)})`.trim() : (expNote || ""),
        date: expDate,
        creditCardId: expChannel === "credit" ? expCreditCardId : null,
      }),
    });
    if (res.ok) { setShowModal(false); resetForm(); fetchTransactions(); fetchDefaults(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/transactions/${id}`, { method: "DELETE" });
    if (res.ok) fetchTransactions();
  }

  function resetForm() {
    const defType = defaults.type || "expense";
    const defChannel = defaults.channel || "cash";
    const defCat = defType === "income" ? (defaults.incomeCategory || "") : (defaults.expenseCategory || "");
    setFormType(defType); setFormCategory(defCat); setFormChannel(defChannel);
    setFormAmount(""); setFormNote(""); setFormDate(new Date().toISOString().split("T")[0]);
    setFormCreditCardId("");
    setSalaryGross(""); setSalaryTax(""); setSalarySS(""); setSalaryPF("");
    setSalaryOther(""); setSalaryOtherNote(""); setSalaryChannel(defChannel);
    setSalaryDate(new Date().toISOString().split("T")[0]);
    setExpPaid(""); setExpActual(""); setExpCategory(defaults.expenseCategory || ""); setExpChannel(defChannel);
    setExpNote(""); setExpDate(new Date().toISOString().split("T")[0]); setExpCreditCardId("");
  }

  function openModal(mode: ModalMode) {
    resetForm();
    setModalMode(mode);
    setShowModal(true);
  }

  const customExpense = customCategories.filter((c) => c.type === "expense").map((c) => ({ value: c.value, label: c.label }));
  const customIncome = customCategories.filter((c) => c.type === "income").map((c) => ({ value: c.value, label: c.label }));
  const allExpenseCategories = [...EXPENSE_CATEGORIES, ...customExpense];
  const allIncomeCategories = [...INCOME_CATEGORIES, ...customIncome];
  const allCategoriesMerged = [...ALL_CATEGORIES, ...customExpense, ...customIncome];

  const categoryOptions = formType === "income" ? allIncomeCategories : allExpenseCategories;
  const selectClass = "px-3.5 py-2 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";
  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  function getLabel(value: string) {
    const found = allCategoriesMerged.find((c) => c.value === value);
    return found?.label || getCategoryLabel(value);
  }

  const salaryNet = (parseFloat(salaryGross) || 0) - (parseFloat(salaryTax) || 0) - (parseFloat(salarySS) || 0) - (parseFloat(salaryPF) || 0) - (parseFloat(salaryOther) || 0);
  const expChange = (parseFloat(expPaid) || 0) - (parseFloat(expActual) || 0);

  return (
    <>
      <Topbar title="รายรับ-รายจ่าย" />
      <div className="p-4 sm:p-6 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">บันทึกรายรับ-รายจ่าย</h2>
          <div className="flex flex-wrap gap-2">
            <button onClick={() => exportToExcel("transactions", { month: filterMonth, filterType, filterChannel, filterCategory })}
              className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">
              Export Excel
            </button>
            <button onClick={() => openModal("salary")}
              className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">
              + เงินเดือน
            </button>
            <button onClick={() => openModal("expense_change")}
              className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">
              + จ่าย & ทอน
            </button>
            <button onClick={() => openModal("simple")}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">
              + เพิ่มรายการ
            </button>
          </div>
        </div>

        <div className="flex flex-wrap gap-2 sm:gap-2.5 mb-5">
          <select value={filterType} onChange={(e) => setFilterType(e.target.value)} className={selectClass}>
            <option value="">ทั้งหมด</option><option value="income">รายรับ</option><option value="expense">รายจ่าย</option>
          </select>
          <select value={filterChannel} onChange={(e) => setFilterChannel(e.target.value)} className={selectClass}>
            <option value="">ทุกช่องทาง</option>
            {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <select value={filterCategory} onChange={(e) => setFilterCategory(e.target.value)} className={selectClass}>
            <option value="">ทุกหมวดหมู่</option>
            {allCategoriesMerged.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
          </select>
          <input type="month" value={filterMonth} onChange={(e) => setFilterMonth(e.target.value)} className={selectClass} />
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden">
          {/* Mobile card list */}
          <div className="sm:hidden divide-y divide-[var(--table-row-border)]">
            {transactions.map((tx) => (
              <div key={tx.id} className={`px-4 py-3 ${tx.groupId ? "bg-[var(--bg-subtle)]" : ""}`}>
                <div className="flex justify-between items-start">
                  <div className="flex-1 min-w-0">
                    <p className="text-[13px] font-medium text-[var(--text-primary)] truncate">
                      {tx.note || getLabel(tx.category)}
                      {tx.groupId && <span className="ml-1.5 inline-block px-1.5 py-0 rounded text-[9px] font-medium bg-[var(--info-bg)] text-[var(--info-text)]">กลุ่ม</span>}
                    </p>
                    <p className="text-[11px] text-[var(--text-secondary)] mt-0.5">
                      {new Date(tx.date).toLocaleDateString("th-TH")} - {getLabel(tx.category)} - {getChannelLabel(tx.channel)}
                    </p>
                  </div>
                  <div className="flex items-center gap-2 ml-2 shrink-0">
                    <p className={`text-[14px] font-semibold ${tx.type === "income" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                      {tx.type === "income" ? "+" : "-"}{formatCurrency(tx.amount)}
                    </p>
                    <button onClick={() => handleDelete(tx.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] p-1" aria-label="ลบ">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
            {transactions.length === 0 && (
              <div className="px-4 py-10 text-center text-[13px] text-[var(--text-tertiary)]">ยังไม่มีรายการ</div>
            )}
          </div>
          {/* Desktop table */}
          <div className="hidden sm:block overflow-x-auto">
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
                  <tr key={tx.id} className={`border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors ${tx.groupId ? "bg-[var(--bg-subtle)]" : ""}`}>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{new Date(tx.date).toLocaleDateString("th-TH")}</td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">
                      {tx.note || "-"}
                      {tx.groupId && <span className="ml-1.5 inline-block px-1.5 py-0 rounded text-[9px] font-medium bg-[var(--info-bg)] text-[var(--info-text)]">กลุ่ม</span>}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-[var(--text-primary)]">{getLabel(tx.category)}</td>
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

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-between mt-4 px-1">
            <p className="text-[12px] text-[var(--text-tertiary)]">
              แสดง {((page - 1) * 50) + 1}-{Math.min(page * 50, total)} จาก {total} รายการ
            </p>
            <div className="flex gap-1.5">
              <button onClick={() => fetchTransactions(page - 1)} disabled={page <= 1}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--hover-bg)] transition-colors">
                ก่อนหน้า
              </button>
              {Array.from({ length: totalPages }, (_, i) => i + 1)
                .filter(p => p === 1 || p === totalPages || Math.abs(p - page) <= 2)
                .reduce<(number | string)[]>((acc, p, i, arr) => {
                  if (i > 0 && p - (arr[i - 1] as number) > 1) acc.push("...");
                  acc.push(p);
                  return acc;
                }, [])
                .map((p, i) =>
                  typeof p === "string" ? (
                    <span key={`dot-${i}`} className="px-2 py-1.5 text-[12px] text-[var(--text-tertiary)]">...</span>
                  ) : (
                    <button key={p} onClick={() => fetchTransactions(p)}
                      className={`px-3 py-1.5 rounded-lg text-[12px] font-medium border transition-colors ${
                        p === page
                          ? "bg-[var(--brand-red)] text-white border-[var(--brand-red)]"
                          : "border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] hover:bg-[var(--hover-bg)]"
                      }`}>
                      {p}
                    </button>
                  )
                )}
              <button onClick={() => fetchTransactions(page + 1)} disabled={page >= totalPages}
                className="px-3 py-1.5 rounded-lg text-[12px] font-medium border border-[var(--card-border)] bg-[var(--card-bg)] text-[var(--text-secondary)] disabled:opacity-40 hover:bg-[var(--hover-bg)] transition-colors">
                ถัดไป
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>

            {/* Mode tabs */}
            <div className="flex bg-[var(--bg-subtle)] rounded-lg p-1 mb-5">
              {([["simple", "ปกติ"], ["salary", "เงินเดือน"], ["expense_change", "จ่าย & ทอน"]] as const).map(([mode, label]) => (
                <button key={mode} onClick={() => setModalMode(mode)}
                  className={`flex-1 py-1.5 text-[12px] font-medium rounded-md transition-all duration-200 ${
                    modalMode === mode
                      ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                      : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
                  }`}>
                  {label}
                </button>
              ))}
            </div>

            {/* Simple mode */}
            {modalMode === "simple" && (
              <form onSubmit={handleSimpleSubmit}>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภท</label>
                  <select value={formType} onChange={(e) => { setFormType(e.target.value); setFormCategory(""); }} className={inputClass}>
                    <option value="expense">รายจ่าย</option><option value="income">รายรับ</option>
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
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึก</button>
                </div>
              </form>
            )}

            {/* Salary breakdown mode */}
            {modalMode === "salary" && (
              <form onSubmit={handleSalarySubmit}>
                <p className="text-[12px] text-[var(--text-secondary)] mb-4">กรอกเงินเดือนก่อนหัก ระบบจะแตกรายการอัตโนมัติ</p>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">เงินเดือน (ก่อนหัก)</label>
                  <input type="number" value={salaryGross} onChange={(e) => setSalaryGross(e.target.value)} required min="0" step="0.01" className={inputClass} placeholder="เช่น 35000" />
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ภาษี ณ ที่จ่าย</label>
                  <input type="number" value={salaryTax} onChange={(e) => setSalaryTax(e.target.value)} min="0" step="0.01" className={inputClass} placeholder="0" />
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประกันสังคม</label>
                  <input type="number" value={salarySS} onChange={(e) => setSalarySS(e.target.value)} min="0" step="0.01" className={inputClass} placeholder="0" />
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">กองทุนสำรองเลี้ยงชีพ</label>
                  <input type="number" value={salaryPF} onChange={(e) => setSalaryPF(e.target.value)} min="0" step="0.01" className={inputClass} placeholder="0" />
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หักอื่นๆ</label>
                  <input type="number" value={salaryOther} onChange={(e) => setSalaryOther(e.target.value)} min="0" step="0.01" className={inputClass} placeholder="0" />
                  {parseFloat(salaryOther) > 0 && (
                    <input type="text" value={salaryOtherNote} onChange={(e) => setSalaryOtherNote(e.target.value)} className={`${inputClass} mt-2`} placeholder="ระบุรายการ" />
                  )}
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ช่องทางรับเงิน</label>
                  <select value={salaryChannel} onChange={(e) => setSalaryChannel(e.target.value)} className={inputClass}>
                    {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่รับเงินเดือน</label>
                  <input type="date" value={salaryDate} onChange={(e) => setSalaryDate(e.target.value)} required className={inputClass} />
                </div>

                {/* Preview */}
                {parseFloat(salaryGross) > 0 && (
                  <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-5 text-[12px] space-y-1">
                    <p className="font-medium text-[var(--text-primary)]">สรุปรายการที่จะสร้าง:</p>
                    <p className="text-[var(--success)]">+ เงินเดือนสุทธิ: {formatCurrency(Math.max(salaryNet, 0))} บาท</p>
                    {parseFloat(salaryTax) > 0 && <p className="text-[var(--danger)]">- ภาษี ณ ที่จ่าย: {formatCurrency(parseFloat(salaryTax))} บาท</p>}
                    {parseFloat(salarySS) > 0 && <p className="text-[var(--danger)]">- ประกันสังคม: {formatCurrency(parseFloat(salarySS))} บาท</p>}
                    {parseFloat(salaryPF) > 0 && <p className="text-[var(--danger)]">- กองทุนสำรองฯ: {formatCurrency(parseFloat(salaryPF))} บาท</p>}
                    {parseFloat(salaryOther) > 0 && <p className="text-[var(--danger)]">- หักอื่นๆ: {formatCurrency(parseFloat(salaryOther))} บาท</p>}
                  </div>
                )}

                <div className="flex gap-2.5 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึกทั้งหมด</button>
                </div>
              </form>
            )}

            {/* Expense with change mode */}
            {modalMode === "expense_change" && (
              <form onSubmit={handleExpChangeSubmit}>
                <p className="text-[12px] text-[var(--text-secondary)] mb-4">ระบุเงินที่จ่ายและราคาจริง ระบบจะบันทึกเฉพาะยอดจ่ายจริง</p>
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมวดหมู่</label>
                  <select value={expCategory} onChange={(e) => setExpCategory(e.target.value)} required className={inputClass}>
                    <option value="">เลือกหมวดหมู่</option>
                    {allExpenseCategories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จ่ายไป (บาท)</label>
                    <input type="number" value={expPaid} onChange={(e) => setExpPaid(e.target.value)} required min="0" step="0.01" className={inputClass} placeholder="เช่น 1000" />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ราคาจริง (บาท)</label>
                    <input type="number" value={expActual} onChange={(e) => setExpActual(e.target.value)} required min="0" step="0.01" className={inputClass} placeholder="เช่น 750" />
                  </div>
                </div>
                {expChange > 0 && (
                  <div className="bg-[var(--success-bg)] rounded-lg p-3 mb-4 text-[12px] text-[var(--success-text)]">
                    เงินทอน: {formatCurrency(expChange)} บาท
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ช่องทาง</label>
                  <select value={expChannel} onChange={(e) => setExpChannel(e.target.value)} className={inputClass}>
                    {CHANNELS.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                  </select>
                </div>
                {expChannel === "credit" && (
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">บัตรเครดิต</label>
                    <select value={expCreditCardId} onChange={(e) => setExpCreditCardId(e.target.value)} required className={inputClass}>
                      <option value="">เลือกบัตร</option>
                      {creditCards.map((cc) => <option key={cc.id} value={cc.id}>{cc.bankName} *{cc.cardNumber}</option>)}
                    </select>
                  </div>
                )}
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่</label>
                  <input type="date" value={expDate} onChange={(e) => setExpDate(e.target.value)} required className={inputClass} />
                </div>
                <div className="mb-5">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมายเหตุ</label>
                  <input type="text" value={expNote} onChange={(e) => setExpNote(e.target.value)} className={inputClass} placeholder="รายละเอียด" />
                </div>
                <div className="flex gap-2.5 justify-end">
                  <button type="button" onClick={() => setShowModal(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึก</button>
                </div>
              </form>
            )}
          </div>
        </div>
      )}
    </>
  );
}

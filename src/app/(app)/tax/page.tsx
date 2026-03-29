"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import {
  TAX_DEDUCTION_CATEGORIES,
  formatCurrency,
  calculateTax,
} from "@/lib/constants";
import { exportToExcel } from "@/lib/export";

interface TaxDeduction {
  id: string;
  category: string;
  name: string;
  amount: number;
  maxLimit: number;
}

export default function TaxPage() {
  const [deductions, setDeductions] = useState<TaxDeduction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [showModal, setShowModal] = useState(false);

  // Form
  const [formCategory, setFormCategory] = useState("");
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const fetchData = useCallback(async () => {
    const [deductRes, dashRes] = await Promise.all([
      fetch("/api/tax-deductions"),
      fetch("/api/dashboard?month="), // all time income
    ]);

    if (deductRes.ok) setDeductions(await deductRes.json());
    if (dashRes.ok) {
      const dash = await dashRes.json();
      setTotalIncome(dash.totalIncome);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  // Calculate tax summary
  // Personal deduction (60,000) is automatic
  const personalDeduction = 60000;
  // Expense deduction: 50% of income, max 100,000
  const expenseDeduction = Math.min(totalIncome * 0.5, 100000);
  // Sum of user-entered deductions (capped at each item's maxLimit)
  const userDeductionTotal = deductions.reduce(
    (sum, d) => sum + Math.min(d.amount, d.maxLimit),
    0
  );
  const totalDeduction = personalDeduction + expenseDeduction + userDeductionTotal;
  const netIncome = Math.max(totalIncome - totalDeduction, 0);
  const estimatedTax = calculateTax(netIncome);

  const selectedCategory = TAX_DEDUCTION_CATEGORIES.find(
    (c) => c.value === formCategory
  );

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory) return;

    const res = await fetch("/api/tax-deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        category: formCategory,
        name: formName || selectedCategory.label,
        amount: formAmount,
        maxLimit: selectedCategory.maxLimit,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      setFormCategory("");
      setFormName("");
      setFormAmount("");
      fetchData();
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/tax-deductions/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  function getCategoryLabel(value: string) {
    return TAX_DEDUCTION_CATEGORIES.find((c) => c.value === value)?.label || value;
  }

  return (
    <>
      <Topbar title="ภาษี & ลดหย่อน" />
      <div className="p-6">
        {/* Tax summary */}
        <div className="bg-white rounded-lg p-5 shadow-sm mb-6">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base">
              สรุปภาษีเงินได้บุคคลธรรมดา ปี 2568
            </h3>
            <div className="flex gap-2">
              <button
                onClick={() => exportToExcel("tax-deductions")}
                className="px-4 py-2 bg-[var(--medium-gray)] text-[var(--light-bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                Export Excel
              </button>
              <button
                onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
              >
                + เพิ่มรายการลดหย่อน
              </button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--light-bg)] rounded-lg p-4">
              <p className="text-xs text-[var(--body-text)] font-semibold">รายได้รวมทั้งปี</p>
              <p className="text-xl font-bold text-[var(--success)] mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-[var(--light-bg)] rounded-lg p-4">
              <p className="text-xs text-[var(--body-text)] font-semibold">ค่าลดหย่อนรวม</p>
              <p className="text-xl font-bold text-[var(--info)] mt-1">{formatCurrency(totalDeduction)}</p>
            </div>
            <div className="bg-[var(--light-bg)] rounded-lg p-4">
              <p className="text-xs text-[var(--body-text)] font-semibold">เงินได้สุทธิ</p>
              <p className="text-xl font-bold text-[var(--dark-text)] mt-1">{formatCurrency(netIncome)}</p>
            </div>
            <div className="bg-[var(--light-bg)] rounded-lg p-4">
              <p className="text-xs text-[var(--body-text)] font-semibold">ภาษีที่ต้องจ่าย (ประมาณ)</p>
              <p className="text-xl font-bold text-[var(--danger)] mt-1">{formatCurrency(estimatedTax)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Auto deductions */}
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">ค่าลดหย่อนอัตโนมัติ</h3>
            <div className="border-b border-gray-100 py-3 flex justify-between">
              <div>
                <p className="text-sm">ค่าลดหย่อนส่วนตัว</p>
                <p className="text-xs text-[var(--body-text)]">สูงสุด 60,000 บาท</p>
              </div>
              <p className="font-bold text-[var(--success)]">{formatCurrency(personalDeduction)}</p>
            </div>
            <div className="border-b border-gray-100 py-3 flex justify-between">
              <div>
                <p className="text-sm">ค่าใช้จ่าย 50%</p>
                <p className="text-xs text-[var(--body-text)]">สูงสุด 100,000 บาท</p>
              </div>
              <p className="font-bold text-[var(--success)]">{formatCurrency(expenseDeduction)}</p>
            </div>
          </div>

          {/* User deductions */}
          <div className="bg-white rounded-lg p-5 shadow-sm">
            <h3 className="font-bold text-sm mb-4">รายการลดหย่อนที่บันทึก</h3>
            {deductions.length === 0 ? (
              <p className="text-sm text-[var(--body-text)] text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              deductions.map((d) => (
                <div key={d.id} className="border-b border-gray-100 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm">{d.name}</p>
                    <p className="text-xs text-[var(--body-text)]">
                      {getCategoryLabel(d.category)} (สูงสุด {formatCurrency(d.maxLimit)} บาท)
                    </p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-[var(--success)]">{formatCurrency(Math.min(d.amount, d.maxLimit))}</p>
                    <button onClick={() => handleDelete(d.id)} className="text-gray-300 hover:text-[var(--danger)] text-sm">x</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tax brackets table */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <h3 className="font-bold text-sm mb-4">อัตราภาษีเงินได้บุคคลธรรมดา 2568</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--light-bg)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)]">เงินได้สุทธิ (บาท)</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)]">อัตราภาษี</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--body-text)]">ภาษีสูงสุดในขั้น</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b"><td className="px-3 py-2">0 - 150,000</td><td className="px-3 py-2">ยกเว้น</td><td className="px-3 py-2 text-right">0</td></tr>
              <tr className="border-b"><td className="px-3 py-2">150,001 - 300,000</td><td className="px-3 py-2">5%</td><td className="px-3 py-2 text-right">7,500</td></tr>
              <tr className="border-b"><td className="px-3 py-2">300,001 - 500,000</td><td className="px-3 py-2">10%</td><td className="px-3 py-2 text-right">20,000</td></tr>
              <tr className="border-b"><td className="px-3 py-2">500,001 - 750,000</td><td className="px-3 py-2">15%</td><td className="px-3 py-2 text-right">37,500</td></tr>
              <tr className="border-b"><td className="px-3 py-2">750,001 - 1,000,000</td><td className="px-3 py-2">20%</td><td className="px-3 py-2 text-right">50,000</td></tr>
              <tr className="border-b"><td className="px-3 py-2">1,000,001 - 2,000,000</td><td className="px-3 py-2">25%</td><td className="px-3 py-2 text-right">250,000</td></tr>
              <tr className="border-b"><td className="px-3 py-2">2,000,001 - 5,000,000</td><td className="px-3 py-2">30%</td><td className="px-3 py-2 text-right">900,000</td></tr>
              <tr><td className="px-3 py-2">5,000,001 ขึ้นไป</td><td className="px-3 py-2">35%</td><td className="px-3 py-2 text-right">-</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Deduction Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-5">เพิ่มรายการลดหย่อน</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">ประเภทลดหย่อน</label>
                <select value={formCategory} onChange={(e) => { setFormCategory(e.target.value); setFormName(""); }} required
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]">
                  <option value="">เลือกประเภท</option>
                  {TAX_DEDUCTION_CATEGORIES.map((c) => (
                    <option key={c.value} value={c.value}>{c.label} (สูงสุด {formatCurrency(c.maxLimit)} บาท)</option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">ชื่อรายการ</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)}
                  placeholder={selectedCategory?.label || ""}
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">
                  จำนวนเงิน (บาท)
                  {selectedCategory && (
                    <span className="font-normal text-[var(--body-text)]"> - สูงสุด {formatCurrency(selectedCategory.maxLimit)}</span>
                  )}
                </label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]" />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-gray-200 rounded-md text-sm font-semibold hover:bg-gray-50">ยกเลิก</button>
                <button type="submit"
                  className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

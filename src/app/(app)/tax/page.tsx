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
  const [formCategory, setFormCategory] = useState("");
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");

  const fetchData = useCallback(async () => {
    const [deductRes, dashRes] = await Promise.all([
      fetch("/api/tax-deductions"),
      fetch("/api/dashboard?month="),
    ]);
    if (deductRes.ok) setDeductions(await deductRes.json());
    if (dashRes.ok) { const dash = await dashRes.json(); setTotalIncome(dash.totalIncome); }
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  const personalDeduction = 60000;
  const expenseDeduction = Math.min(totalIncome * 0.5, 100000);
  const userDeductionTotal = deductions.reduce((sum, d) => sum + Math.min(d.amount, d.maxLimit), 0);
  const totalDeduction = personalDeduction + expenseDeduction + userDeductionTotal;
  const netIncome = Math.max(totalIncome - totalDeduction, 0);
  const estimatedTax = calculateTax(netIncome);

  const selectedCategory = TAX_DEDUCTION_CATEGORIES.find((c) => c.value === formCategory);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedCategory) return;
    const res = await fetch("/api/tax-deductions", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ category: formCategory, name: formName || selectedCategory.label, amount: formAmount, maxLimit: selectedCategory.maxLimit }),
    });
    if (res.ok) { setShowModal(false); setFormCategory(""); setFormName(""); setFormAmount(""); fetchData(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/tax-deductions/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  function getCategoryLabel(value: string) {
    return TAX_DEDUCTION_CATEGORIES.find((c) => c.value === value)?.label || value;
  }

  const inputClass = "w-full px-3 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-md text-sm outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="ภาษี & ลดหย่อน" />
      <div className="p-6">
        {/* Tax summary */}
        <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] mb-6 transition-colors">
          <div className="flex justify-between items-center mb-4">
            <h3 className="font-bold text-base text-[var(--text-primary)]">สรุปภาษีเงินได้บุคคลธรรมดา ปี 2568</h3>
            <div className="flex gap-2">
              <button onClick={() => exportToExcel("tax-deductions")}
                className="px-4 py-2 bg-[var(--medium-gray)] text-[var(--light-bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">Export Excel</button>
              <button onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">+ เพิ่มรายการลดหย่อน</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div className="bg-[var(--table-header-bg)] rounded-lg p-4 transition-colors">
              <p className="text-xs text-[var(--text-secondary)] font-semibold">รายได้รวมทั้งปี</p>
              <p className="text-xl font-bold text-[var(--success)] mt-1">{formatCurrency(totalIncome)}</p>
            </div>
            <div className="bg-[var(--table-header-bg)] rounded-lg p-4 transition-colors">
              <p className="text-xs text-[var(--text-secondary)] font-semibold">ค่าลดหย่อนรวม</p>
              <p className="text-xl font-bold text-[var(--info)] mt-1">{formatCurrency(totalDeduction)}</p>
            </div>
            <div className="bg-[var(--table-header-bg)] rounded-lg p-4 transition-colors">
              <p className="text-xs text-[var(--text-secondary)] font-semibold">เงินได้สุทธิ</p>
              <p className="text-xl font-bold text-[var(--text-primary)] mt-1">{formatCurrency(netIncome)}</p>
            </div>
            <div className="bg-[var(--table-header-bg)] rounded-lg p-4 transition-colors">
              <p className="text-xs text-[var(--text-secondary)] font-semibold">ภาษีที่ต้องจ่าย (ประมาณ)</p>
              <p className="text-xl font-bold text-[var(--danger)] mt-1">{formatCurrency(estimatedTax)}</p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-5 mb-6">
          {/* Auto deductions */}
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">ค่าลดหย่อนอัตโนมัติ</h3>
            <div className="border-b border-[var(--table-row-border)] py-3 flex justify-between">
              <div>
                <p className="text-sm text-[var(--text-primary)]">ค่าลดหย่อนส่วนตัว</p>
                <p className="text-xs text-[var(--text-secondary)]">สูงสุด 60,000 บาท</p>
              </div>
              <p className="font-bold text-[var(--success)]">{formatCurrency(personalDeduction)}</p>
            </div>
            <div className="border-b border-[var(--table-row-border)] py-3 flex justify-between">
              <div>
                <p className="text-sm text-[var(--text-primary)]">ค่าใช้จ่าย 50%</p>
                <p className="text-xs text-[var(--text-secondary)]">สูงสุด 100,000 บาท</p>
              </div>
              <p className="font-bold text-[var(--success)]">{formatCurrency(expenseDeduction)}</p>
            </div>
          </div>

          {/* User deductions */}
          <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
            <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">รายการลดหย่อนที่บันทึก</h3>
            {deductions.length === 0 ? (
              <p className="text-sm text-[var(--text-secondary)] text-center py-4">ยังไม่มีรายการ</p>
            ) : (
              deductions.map((d) => (
                <div key={d.id} className="border-b border-[var(--table-row-border)] py-3 flex justify-between items-center">
                  <div>
                    <p className="text-sm text-[var(--text-primary)]">{d.name}</p>
                    <p className="text-xs text-[var(--text-secondary)]">{getCategoryLabel(d.category)} (สูงสุด {formatCurrency(d.maxLimit)} บาท)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-bold text-[var(--success)]">{formatCurrency(Math.min(d.amount, d.maxLimit))}</p>
                    <button onClick={() => handleDelete(d.id)} className="text-[var(--badge-muted-text)] hover:text-[var(--danger)] text-sm">x</button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tax brackets */}
        <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
          <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">อัตราภาษีเงินได้บุคคลธรรมดา 2568</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--table-header-bg)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">เงินได้สุทธิ (บาท)</th>
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)]">อัตราภาษี</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-secondary)]">ภาษีสูงสุดในขั้น</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">0 - 150,000</td><td className="px-3 py-2 text-[var(--text-primary)]">ยกเว้น</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">0</td></tr>
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">150,001 - 300,000</td><td className="px-3 py-2 text-[var(--text-primary)]">5%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">7,500</td></tr>
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">300,001 - 500,000</td><td className="px-3 py-2 text-[var(--text-primary)]">10%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">20,000</td></tr>
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">500,001 - 750,000</td><td className="px-3 py-2 text-[var(--text-primary)]">15%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">37,500</td></tr>
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">750,001 - 1,000,000</td><td className="px-3 py-2 text-[var(--text-primary)]">20%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">50,000</td></tr>
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">1,000,001 - 2,000,000</td><td className="px-3 py-2 text-[var(--text-primary)]">25%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">250,000</td></tr>
              <tr className="border-b border-[var(--table-row-border)]"><td className="px-3 py-2 text-[var(--text-primary)]">2,000,001 - 5,000,000</td><td className="px-3 py-2 text-[var(--text-primary)]">30%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">900,000</td></tr>
              <tr><td className="px-3 py-2 text-[var(--text-primary)]">5,000,001 ขึ้นไป</td><td className="px-3 py-2 text-[var(--text-primary)]">35%</td><td className="px-3 py-2 text-right text-[var(--text-primary)]">-</td></tr>
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-[var(--modal-bg)] rounded-xl p-6 w-full max-w-md shadow-2xl transition-colors">
            <h2 className="text-lg font-bold mb-5 text-[var(--text-primary)]">เพิ่มรายการลดหย่อน</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">ประเภทลดหย่อน</label>
                <select value={formCategory} onChange={(e) => { setFormCategory(e.target.value); setFormName(""); }} required className={inputClass}>
                  <option value="">เลือกประเภท</option>
                  {TAX_DEDUCTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} (สูงสุด {formatCurrency(c.maxLimit)} บาท)</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">ชื่อรายการ</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={selectedCategory?.label || ""} className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">
                  จำนวนเงิน (บาท)
                  {selectedCategory && <span className="font-normal text-[var(--text-secondary)]"> - สูงสุด {formatCurrency(selectedCategory.maxLimit)}</span>}
                </label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              <div className="flex gap-3 justify-end">
                <button type="button" onClick={() => setShowModal(false)}
                  className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-md text-sm font-semibold hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
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

"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import LoadingScreen from "@/components/LoadingScreen";
import {
  TAX_DEDUCTION_CATEGORIES,
  calculateTax,
} from "@/lib/constants";
import { useAmount } from "@/lib/useAmount";
import { exportToExcel } from "@/lib/export";

interface TaxDeduction {
  id: string;
  category: string;
  name: string;
  amount: number;
  maxLimit: number;
}

export default function TaxPage() {
  const formatCurrency = useAmount();
  const [deductions, setDeductions] = useState<TaxDeduction[]>([]);
  const [totalIncome, setTotalIncome] = useState(0);
  const [loading, setLoading] = useState(true);
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
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <><Topbar title="ภาษี" /><LoadingScreen /></>;

  const personalDeduction = 60000;
  const expenseDeduction = Math.min(totalIncome * 0.5, 100000);
  const userDeductionTotal = deductions.reduce((sum, d) => sum + Math.min(d.amount, d.maxLimit), 0);
  const totalDeduction = personalDeduction + expenseDeduction + userDeductionTotal;
  const netIncome = Math.max(totalIncome - totalDeduction, 0);
  const estimatedTax = calculateTax(netIncome);

  const buddhistYear = new Date().getFullYear() + 543;
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

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  const summaryStats = [
    { label: "รายได้รวมทั้งปี", value: totalIncome, color: "var(--success)" },
    { label: "ค่าลดหย่อนรวม", value: totalDeduction, color: "var(--info)" },
    { label: "เงินได้สุทธิ", value: netIncome, color: "var(--text-primary)" },
    { label: "ภาษีที่ต้องจ่าย (ประมาณ)", value: estimatedTax, color: "var(--danger)" },
  ];

  return (
    <>
      <Topbar title="ภาษี & ลดหย่อน" />
      <div className="p-4 sm:p-6 max-w-[1200px]">
        {/* Tax summary */}
        <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] mb-6 transition-colors">
          <div className="flex justify-between items-center mb-5">
            <h3 className="font-semibold text-[15px] text-[var(--text-primary)]">สรุปภาษีเงินได้บุคคลธรรมดา ปี {buddhistYear}</h3>
            <div className="flex gap-2">
              <button onClick={() => exportToExcel("tax-deductions")}
                className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">Export Excel</button>
              <button onClick={() => setShowModal(true)}
                className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">+ เพิ่มรายการลดหย่อน</button>
            </div>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {summaryStats.map((stat) => (
              <div key={stat.label} className="bg-[var(--bg-subtle)] rounded-xl p-4 transition-colors">
                <p className="text-[12px] text-[var(--text-secondary)] font-medium">{stat.label}</p>
                <p className="text-[20px] font-bold mt-1 tracking-tight" style={{ color: stat.color }}>{formatCurrency(stat.value)}</p>
              </div>
            ))}
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 mb-6">
          {/* Auto deductions */}
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] transition-colors">
            <h3 className="font-semibold text-[14px] mb-4 text-[var(--text-primary)]">ค่าลดหย่อนอัตโนมัติ</h3>
            <div className="border-b border-[var(--table-row-border)] py-3 flex justify-between">
              <div>
                <p className="text-[13px] text-[var(--text-primary)]">ค่าลดหย่อนส่วนตัว</p>
                <p className="text-[12px] text-[var(--text-secondary)]">สูงสุด 60,000 บาท</p>
              </div>
              <p className="font-semibold text-[var(--success)]">{formatCurrency(personalDeduction)}</p>
            </div>
            <div className="py-3 flex justify-between">
              <div>
                <p className="text-[13px] text-[var(--text-primary)]">ค่าใช้จ่าย 50%</p>
                <p className="text-[12px] text-[var(--text-secondary)]">สูงสุด 100,000 บาท</p>
              </div>
              <p className="font-semibold text-[var(--success)]">{formatCurrency(expenseDeduction)}</p>
            </div>
          </div>

          {/* User deductions */}
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] transition-colors">
            <h3 className="font-semibold text-[14px] mb-4 text-[var(--text-primary)]">รายการลดหย่อนที่บันทึก</h3>
            {deductions.length === 0 ? (
              <p className="text-[13px] text-[var(--text-tertiary)] text-center py-6">ยังไม่มีรายการ</p>
            ) : (
              deductions.map((d) => (
                <div key={d.id} className="border-b border-[var(--table-row-border)] last:border-b-0 py-3 flex justify-between items-center">
                  <div>
                    <p className="text-[13px] text-[var(--text-primary)]">{d.name}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{getCategoryLabel(d.category)} (สูงสุด {formatCurrency(d.maxLimit)} บาท)</p>
                  </div>
                  <div className="flex items-center gap-3">
                    <p className="font-semibold text-[var(--success)]">{formatCurrency(Math.min(d.amount, d.maxLimit))}</p>
                    <button onClick={() => handleDelete(d.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Tax brackets */}
        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden transition-colors">
          <div className="px-5 py-4">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)]">อัตราภาษีเงินได้บุคคลธรรมดา {buddhistYear}</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)] border-y border-[var(--card-border)]">
                  <th className="px-3 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">เงินได้สุทธิ</th>
                  <th className="px-3 sm:px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">อัตรา</th>
                  <th className="px-3 sm:px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">ภาษีสูงสุด</th>
                </tr>
              </thead>
              <tbody className="text-[12px] sm:text-[13px]">
                {[
                  ["0 - 150,000", "ยกเว้น", "0"],
                  ["150,001 - 300,000", "5%", "7,500"],
                  ["300,001 - 500,000", "10%", "20,000"],
                  ["500,001 - 750,000", "15%", "37,500"],
                  ["750,001 - 1,000,000", "20%", "50,000"],
                  ["1,000,001 - 2,000,000", "25%", "250,000"],
                  ["2,000,001 - 5,000,000", "30%", "900,000"],
                  ["5,000,001 ขึ้นไป", "35%", "-"],
                ].map(([range, rate, maxTax], i) => (
                  <tr key={i} className="border-b border-[var(--table-row-border)] last:border-b-0">
                    <td className="px-3 sm:px-5 py-2.5 text-[var(--text-primary)]">{range}</td>
                    <td className="px-3 sm:px-5 py-2.5 text-[var(--text-primary)]">{rate}</td>
                    <td className="px-3 sm:px-5 py-2.5 text-right text-[var(--text-primary)]">{maxTax}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200] p-4" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มรายการลดหย่อน</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภทลดหย่อน</label>
                <select value={formCategory} onChange={(e) => { setFormCategory(e.target.value); setFormName(""); }} required className={inputClass}>
                  <option value="">เลือกประเภท</option>
                  {TAX_DEDUCTION_CATEGORIES.map((c) => <option key={c.value} value={c.value}>{c.label} (สูงสุด {formatCurrency(c.maxLimit)} บาท)</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อรายการ</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} placeholder={selectedCategory?.label || ""} className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">
                  จำนวนเงิน (บาท)
                  {selectedCategory && <span className="font-normal text-[var(--text-secondary)]"> - สูงสุด {formatCurrency(selectedCategory.maxLimit)}</span>}
                </label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
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

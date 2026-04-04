"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import LoadingScreen from "@/components/LoadingScreen";
import { useAmount } from "@/lib/useAmount";
import { exportToExcel } from "@/lib/export";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  isPaid: boolean;
  paidAt: string | null;
}

export default function BillsPage() {
  const formatCurrency = useAmount();
  const [bills, setBills] = useState<Bill[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDay, setFormDueDay] = useState("");

  const fetchBills = useCallback(async () => {
    const res = await fetch("/api/bills");
    if (res.ok) setBills(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  if (loading) return <><Topbar title="บิลรายเดือน" /><LoadingScreen /></>;

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, amount: formAmount, dueDay: formDueDay }),
    });
    if (res.ok) { setShowModal(false); setFormName(""); setFormAmount(""); setFormDueDay(""); fetchBills(); }
  }

  async function handleTogglePaid(bill: Bill) {
    const res = await fetch(`/api/bills/${bill.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPaid: !bill.isPaid }),
    });
    if (res.ok) fetchBills();
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบบิลนี้?")) return;
    const res = await fetch(`/api/bills/${id}`, { method: "DELETE" });
    if (res.ok) fetchBills();
  }

  function getDaysUntilDue(dueDay: number) {
    const today = new Date().getDate();
    return dueDay >= today ? dueDay - today : 30 - today + dueDay;
  }

  function getStatusBadge(bill: Bill) {
    if (bill.isPaid) {
      return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--success-bg)] text-[var(--success-text)]">ชำระแล้ว</span>;
    }
    const daysUntil = getDaysUntilDue(bill.dueDay);
    if (daysUntil <= 2) {
      return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--danger-bg)] text-[var(--danger-text)]">ใกล้ครบกำหนด (อีก {daysUntil} วัน)</span>;
    }
    if (daysUntil <= 7) {
      return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--warning-bg)] text-[var(--warning-text)]">เตือน (อีก {daysUntil} วัน)</span>;
    }
    return <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]">อีก {daysUntil} วัน</span>;
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  const urgentBills = bills.filter((b) => !b.isPaid && getDaysUntilDue(b.dueDay) <= 7);

  return (
    <>
      <Topbar title="บิล & การแจ้งเตือน" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">บิลประจำ & การแจ้งเตือน</h2>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel("bills")}
              className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">Export Excel</button>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">+ เพิ่มบิลประจำ</button>
          </div>
        </div>

        {urgentBills.length > 0 && (
          <div className="bg-[var(--warning-bg)] rounded-xl p-4 mb-5">
            <h3 className="font-semibold text-[13px] text-[var(--warning-text)] mb-2">บิลที่ใกล้ครบกำหนดชำระ (ภายใน 7 วัน)</h3>
            {urgentBills.map((bill) => (
              <p key={bill.id} className="text-[13px] text-[var(--warning-text)]">
                {bill.name} - {formatCurrency(bill.amount)} บาท (วันที่ {bill.dueDay}, อีก {getDaysUntilDue(bill.dueDay)} วัน)
              </p>
            ))}
          </div>
        )}

        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden transition-colors">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)] border-b border-[var(--card-border)]">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">รายการ</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">จำนวน</th>
                  <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">รอบชำระ (วันที่)</th>
                  <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">สถานะ</th>
                  <th className="px-5 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {bills.map((bill) => (
                  <tr key={bill.id} className="border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-5 py-3 text-[var(--text-primary)]">{bill.name}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[var(--text-primary)]">{formatCurrency(bill.amount)}</td>
                    <td className="px-5 py-3 text-center text-[var(--text-primary)]">วันที่ {bill.dueDay}</td>
                    <td className="px-5 py-3 text-center">{getStatusBadge(bill)}</td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleTogglePaid(bill)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            bill.isPaid
                              ? "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)] hover:bg-[var(--hover-bg)]"
                              : "bg-[var(--success-bg)] text-[var(--success-text)] hover:bg-[var(--success-bg)]"
                          }`}>
                          {bill.isPaid ? "ยกเลิก" : "ชำระแล้ว"}
                        </button>
                        <button onClick={() => handleDelete(bill.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {bills.length === 0 && (
                  <tr><td colSpan={5} className="px-5 py-10 text-center text-[var(--text-tertiary)]">ยังไม่มีบิลประจำ</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มบิลประจำ</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อบิล</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                  placeholder="เช่น ค่าน้ำ, ค่าไฟ, ค่าเช่า, ค่าโทรศัพท์" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงิน (บาท)</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันครบกำหนดชำระ (วันที่ในเดือน)</label>
                <input type="number" value={formDueDay} onChange={(e) => setFormDueDay(e.target.value)} required min="1" max="31" placeholder="เช่น 15" className={inputClass} />
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

"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { formatCurrency } from "@/lib/constants";
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
  const [bills, setBills] = useState<Bill[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDay, setFormDueDay] = useState("");

  const fetchBills = useCallback(async () => {
    const res = await fetch("/api/bills");
    if (res.ok) setBills(await res.json());
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

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
      return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--success)]/15 text-[var(--success)]">ชำระแล้ว</span>;
    }
    const daysUntil = getDaysUntilDue(bill.dueDay);
    if (daysUntil <= 2) {
      return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--danger)]/15 text-[var(--danger)]">ใกล้ครบกำหนด (อีก {daysUntil} วัน)</span>;
    }
    if (daysUntil <= 7) {
      return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--warning)]/15 text-[var(--warning)]">เตือน (อีก {daysUntil} วัน)</span>;
    }
    return <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]">อีก {daysUntil} วัน</span>;
  }

  const inputClass = "w-full px-3 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-md text-sm outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="บิล & การแจ้งเตือน" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-base text-[var(--text-primary)]">บิลประจำ & การแจ้งเตือน</h2>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel("bills")}
              className="px-4 py-2 bg-[var(--medium-gray)] text-[var(--light-bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">Export Excel</button>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">+ เพิ่มบิลประจำ</button>
          </div>
        </div>

        {bills.filter((b) => !b.isPaid && getDaysUntilDue(b.dueDay) <= 7).length > 0 && (
          <div className="bg-[var(--warning)]/10 border border-[var(--warning)]/30 rounded-lg p-4 mb-5">
            <h3 className="font-bold text-sm text-[var(--warning)] mb-2">บิลที่ใกล้ครบกำหนดชำระ (ภายใน 7 วัน)</h3>
            {bills.filter((b) => !b.isPaid && getDaysUntilDue(b.dueDay) <= 7).map((bill) => (
              <p key={bill.id} className="text-sm text-[var(--text-secondary)]">
                {bill.name} - {formatCurrency(bill.amount)} บาท (วันที่ {bill.dueDay}, อีก {getDaysUntilDue(bill.dueDay)} วัน)
              </p>
            ))}
          </div>
        )}

        <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--table-header-bg)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">รายการ</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">จำนวน</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase">รอบชำระ (วันที่)</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase">สถานะ</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors">
                  <td className="px-3 py-2.5 text-[var(--text-primary)]">{bill.name}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-[var(--text-primary)]">{formatCurrency(bill.amount)}</td>
                  <td className="px-3 py-2.5 text-center text-[var(--text-primary)]">วันที่ {bill.dueDay}</td>
                  <td className="px-3 py-2.5 text-center">{getStatusBadge(bill)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex gap-2 justify-end">
                      <button onClick={() => handleTogglePaid(bill)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                          bill.isPaid ? "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)] hover:opacity-80" : "bg-[var(--success)]/15 text-[var(--success)] hover:opacity-80"
                        }`}>
                        {bill.isPaid ? "ยกเลิก" : "ชำระแล้ว"}
                      </button>
                      <button onClick={() => handleDelete(bill.id)} className="text-[var(--badge-muted-text)] hover:text-[var(--danger)] transition-colors">x</button>
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr><td colSpan={5} className="px-3 py-8 text-center text-[var(--text-secondary)]">ยังไม่มีบิลประจำ</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-[var(--modal-bg)] rounded-xl p-6 w-full max-w-md shadow-2xl transition-colors">
            <h2 className="text-lg font-bold mb-5 text-[var(--text-primary)]">เพิ่มบิลประจำ</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">ชื่อบิล</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                  placeholder="เช่น ค่าน้ำ, ค่าไฟ, ค่าเช่า, ค่าโทรศัพท์" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">จำนวนเงิน (บาท)</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">วันครบกำหนดชำระ (วันที่ในเดือน)</label>
                <input type="number" value={formDueDay} onChange={(e) => setFormDueDay(e.target.value)} required min="1" max="31" placeholder="เช่น 15" className={inputClass} />
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

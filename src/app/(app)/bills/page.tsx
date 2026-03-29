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

  // Form
  const [formName, setFormName] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDueDay, setFormDueDay] = useState("");

  const fetchBills = useCallback(async () => {
    const res = await fetch("/api/bills");
    if (res.ok) setBills(await res.json());
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/bills", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: formName,
        amount: formAmount,
        dueDay: formDueDay,
      }),
    });

    if (res.ok) {
      setShowModal(false);
      setFormName("");
      setFormAmount("");
      setFormDueDay("");
      fetchBills();
    }
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

  // Calculate days until due
  function getDaysUntilDue(dueDay: number) {
    const today = new Date().getDate();
    return dueDay >= today ? dueDay - today : 30 - today + dueDay;
  }

  function getStatusBadge(bill: Bill) {
    if (bill.isPaid) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-green-50 text-green-600">
          ชำระแล้ว
        </span>
      );
    }

    const daysUntil = getDaysUntilDue(bill.dueDay);
    if (daysUntil <= 2) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-red-50 text-red-600">
          ใกล้ครบกำหนด (อีก {daysUntil} วัน)
        </span>
      );
    }
    if (daysUntil <= 7) {
      return (
        <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-amber-50 text-amber-600">
          เตือน (อีก {daysUntil} วัน)
        </span>
      );
    }
    return (
      <span className="inline-block px-2 py-0.5 rounded-full text-[11px] font-semibold bg-gray-50 text-gray-600">
        อีก {daysUntil} วัน
      </span>
    );
  }

  return (
    <>
      <Topbar title="บิล & การแจ้งเตือน" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-base">บิลประจำ & การแจ้งเตือน</h2>
          <div className="flex gap-2">
            <button
              onClick={() => exportToExcel("bills")}
              className="px-4 py-2 bg-[var(--medium-gray)] text-[var(--light-bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              Export Excel
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity"
            >
              + เพิ่มบิลประจำ
            </button>
          </div>
        </div>

        {/* Bills due soon alert */}
        {bills.filter((b) => !b.isPaid && getDaysUntilDue(b.dueDay) <= 7).length > 0 && (
          <div className="bg-amber-50 border border-amber-200 rounded-lg p-4 mb-5">
            <h3 className="font-bold text-sm text-amber-800 mb-2">
              บิลที่ใกล้ครบกำหนดชำระ (ภายใน 7 วัน)
            </h3>
            {bills
              .filter((b) => !b.isPaid && getDaysUntilDue(b.dueDay) <= 7)
              .map((bill) => (
                <p key={bill.id} className="text-sm text-amber-700">
                  {bill.name} - {formatCurrency(bill.amount)} บาท (วันที่ {bill.dueDay}, อีก {getDaysUntilDue(bill.dueDay)} วัน)
                </p>
              ))}
          </div>
        )}

        {/* Bills table */}
        <div className="bg-white rounded-lg p-5 shadow-sm">
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--light-bg)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--body-text)] uppercase">รายการ</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--body-text)] uppercase">จำนวน</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--body-text)] uppercase">รอบชำระ (วันที่)</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--body-text)] uppercase">สถานะ</th>
                <th className="px-3 py-2 w-20"></th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {bills.map((bill) => (
                <tr key={bill.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="px-3 py-2.5">{bill.name}</td>
                  <td className="px-3 py-2.5 text-right font-semibold">{formatCurrency(bill.amount)}</td>
                  <td className="px-3 py-2.5 text-center">วันที่ {bill.dueDay}</td>
                  <td className="px-3 py-2.5 text-center">{getStatusBadge(bill)}</td>
                  <td className="px-3 py-2.5 text-right">
                    <div className="flex gap-2 justify-end">
                      <button
                        onClick={() => handleTogglePaid(bill)}
                        className={`px-2 py-1 rounded text-[11px] font-semibold transition-colors ${
                          bill.isPaid
                            ? "bg-gray-100 text-gray-500 hover:bg-gray-200"
                            : "bg-green-50 text-green-600 hover:bg-green-100"
                        }`}
                      >
                        {bill.isPaid ? "ยกเลิก" : "ชำระแล้ว"}
                      </button>
                      <button
                        onClick={() => handleDelete(bill.id)}
                        className="text-gray-300 hover:text-[var(--danger)] transition-colors"
                      >
                        x
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {bills.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-3 py-8 text-center text-[var(--body-text)]">
                    ยังไม่มีบิลประจำ
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Add Bill Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-white rounded-xl p-6 w-full max-w-md shadow-2xl">
            <h2 className="text-lg font-bold mb-5">เพิ่มบิลประจำ</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">ชื่อบิล</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required
                  placeholder="เช่น ค่าน้ำ, ค่าไฟ, ค่าเช่า, ค่าโทรศัพท์"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">จำนวนเงิน (บาท)</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01"
                  className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm outline-none focus:border-[var(--brand-red)]" />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1">วันครบกำหนดชำระ (วันที่ในเดือน)</label>
                <input type="number" value={formDueDay} onChange={(e) => setFormDueDay(e.target.value)} required min="1" max="31"
                  placeholder="เช่น 15"
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

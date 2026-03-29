"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { formatCurrency } from "@/lib/constants";

interface Lending {
  id: string;
  borrower: string;
  amount: number;
  description: string;
  date: string;
  isReturned: boolean;
  returnedAt: string | null;
  returnedAmount: number;
}

export default function LendingsPage() {
  const [lendings, setLendings] = useState<Lending[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formBorrower, setFormBorrower] = useState("");
  const [formAmount, setFormAmount] = useState("");
  const [formDesc, setFormDesc] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchLendings = useCallback(async () => {
    const res = await fetch("/api/lendings");
    if (res.ok) setLendings(await res.json());
  }, []);

  useEffect(() => { fetchLendings(); }, [fetchLendings]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/lendings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ borrower: formBorrower, amount: formAmount, description: formDesc, date: formDate }),
    });
    if (res.ok) { setShowModal(false); setFormBorrower(""); setFormAmount(""); setFormDesc(""); setFormDate(new Date().toISOString().split("T")[0]); fetchLendings(); }
  }

  async function handleToggleReturn(lending: Lending) {
    const res = await fetch(`/api/lendings/${lending.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        isReturned: !lending.isReturned,
        returnedAmount: !lending.isReturned ? lending.amount : 0,
      }),
    });
    if (res.ok) fetchLendings();
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/lendings/${id}`, { method: "DELETE" });
    if (res.ok) fetchLendings();
  }

  const outstanding = lendings.filter((l) => !l.isReturned);
  const returned = lendings.filter((l) => l.isReturned);
  const totalOutstanding = outstanding.reduce((sum, l) => sum + (l.amount - l.returnedAmount), 0);

  // Group by borrower
  const byBorrower: Record<string, { total: number; items: Lending[] }> = {};
  for (const l of outstanding) {
    if (!byBorrower[l.borrower]) byBorrower[l.borrower] = { total: 0, items: [] };
    byBorrower[l.borrower].total += l.amount - l.returnedAmount;
    byBorrower[l.borrower].items.push(l);
  }

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="ให้ยืม & ทวงหนี้" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">ให้ยืม & ทวงหนี้</h2>
          <button onClick={() => setShowModal(true)}
            className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">
            + บันทึกการให้ยืม
          </button>
        </div>

        {/* Summary cards */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">ยอดค้างรวม</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--warning)]">{formatCurrency(totalOutstanding)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">รายการค้าง</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--danger)]">{outstanding.length}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">รายการ</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">คืนแล้ว</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--success)]">{returned.length}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">รายการ</p>
          </div>
        </div>

        {/* By borrower breakdown */}
        {Object.keys(byBorrower).length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] p-5 mb-6">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">สรุปตามคนยืม</h3>
            <div className="space-y-3">
              {Object.entries(byBorrower).sort((a, b) => b[1].total - a[1].total).map(([name, data]) => (
                <div key={name} className="flex items-center justify-between py-2 border-b border-[var(--table-row-border)] last:border-b-0">
                  <div className="flex items-center gap-3">
                    <div className="w-8 h-8 rounded-full bg-[var(--warning-bg)] flex items-center justify-center text-[12px] font-semibold text-[var(--warning-text)]">
                      {name.charAt(0).toUpperCase()}
                    </div>
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{data.items.length} รายการ</p>
                    </div>
                  </div>
                  <p className="text-[14px] font-semibold text-[var(--warning)]">{formatCurrency(data.total)} บาท</p>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* All lendings table */}
        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden">
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)] border-b border-[var(--card-border)]">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">วันที่</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">คนยืม</th>
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">รายละเอียด</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">จำนวน</th>
                  <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">สถานะ</th>
                  <th className="px-5 py-2.5 w-24"></th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {lendings.map((l) => (
                  <tr key={l.id} className="border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-5 py-3 text-[var(--text-primary)]">{new Date(l.date).toLocaleDateString("th-TH")}</td>
                    <td className="px-5 py-3 font-medium text-[var(--text-primary)]">{l.borrower}</td>
                    <td className="px-5 py-3 text-[var(--text-secondary)]">{l.description || "-"}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[var(--warning)]">{formatCurrency(l.amount)}</td>
                    <td className="px-5 py-3 text-center">
                      {l.isReturned
                        ? <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--success-bg)] text-[var(--success-text)]">คืนแล้ว</span>
                        : <span className="inline-block px-2.5 py-0.5 rounded-full text-[11px] font-medium bg-[var(--danger-bg)] text-[var(--danger-text)]">ยังไม่คืน</span>
                      }
                    </td>
                    <td className="px-5 py-3 text-right">
                      <div className="flex gap-2 justify-end">
                        <button onClick={() => handleToggleReturn(l)}
                          className={`px-2.5 py-1 rounded-md text-[11px] font-medium transition-colors ${
                            l.isReturned
                              ? "bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)] hover:bg-[var(--hover-bg)]"
                              : "bg-[var(--success-bg)] text-[var(--success-text)]"
                          }`}>
                          {l.isReturned ? "ยกเลิก" : "คืนแล้ว"}
                        </button>
                        <button onClick={() => handleDelete(l.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
                {lendings.length === 0 && (
                  <tr><td colSpan={6} className="px-5 py-10 text-center text-[var(--text-tertiary)]">ยังไม่มีรายการให้ยืม</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">บันทึกการให้ยืม</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อคนยืม</label>
                <input type="text" value={formBorrower} onChange={(e) => setFormBorrower(e.target.value)} required
                  placeholder="เช่น สมชาย, แอน" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงิน (บาท)</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">รายละเอียด</label>
                <input type="text" value={formDesc} onChange={(e) => setFormDesc(e.target.value)} className={inputClass} placeholder="เช่น ค่าอาหารกลางวัน, ค่าแท็กซี่" />
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

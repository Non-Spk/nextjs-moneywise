"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { formatCurrency } from "@/lib/constants";
import { exportToExcel } from "@/lib/export";

interface CreditCard {
  id: string;
  bankName: string;
  cardNumber: string;
  creditLimit: number;
  balance: number;
  dueDate: number;
}

export default function CreditCardsPage() {
  const [cards, setCards] = useState<CreditCard[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formBank, setFormBank] = useState("");
  const [formNumber, setFormNumber] = useState("");
  const [formLimit, setFormLimit] = useState("");
  const [formBalance, setFormBalance] = useState("0");
  const [formDueDate, setFormDueDate] = useState("");

  const fetchCards = useCallback(async () => {
    const res = await fetch("/api/credit-cards");
    if (res.ok) setCards(await res.json());
  }, []);

  useEffect(() => { fetchCards(); }, [fetchCards]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/credit-cards", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ bankName: formBank, cardNumber: formNumber, creditLimit: formLimit, balance: formBalance, dueDate: formDueDate }),
    });
    if (res.ok) { setShowModal(false); setFormBank(""); setFormNumber(""); setFormLimit(""); setFormBalance("0"); setFormDueDate(""); fetchCards(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบบัตรเครดิตนี้?")) return;
    const res = await fetch(`/api/credit-cards/${id}`, { method: "DELETE" });
    if (res.ok) fetchCards();
  }

  function getUsagePercent(card: CreditCard) {
    if (card.creditLimit <= 0) return 0;
    return Math.min((card.balance / card.creditLimit) * 100, 100);
  }

  function getUsageColor(percent: number) {
    if (percent < 30) return "bg-[var(--success)]";
    if (percent < 70) return "bg-[var(--warning)]";
    return "bg-[var(--danger)]";
  }

  const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const inputClass = "w-full px-3 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-md text-sm outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="บัตรเครดิต & หนี้สิน" />
      <div className="p-6">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-bold text-base text-[var(--text-primary)]">บัตรเครดิต & หนี้สิน</h2>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel("credit-cards")}
              className="px-4 py-2 bg-[var(--medium-gray)] text-[var(--light-bg)] rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">Export Excel</button>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-md text-sm font-semibold hover:opacity-90 transition-opacity">+ เพิ่มบัตรเครดิต</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((card) => {
            const usage = getUsagePercent(card);
            return (
              <div key={card.id} className="bg-gradient-to-br from-[var(--dark-charcoal)] to-[var(--medium-gray)] text-white rounded-xl p-6 relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-28 h-28 rounded-full bg-white/5" />
                <div className="flex justify-between items-start">
                  <p className="text-xs font-semibold opacity-70 uppercase tracking-wider">{card.bankName}</p>
                  <button onClick={() => handleDelete(card.id)} className="text-white/30 hover:text-[var(--danger)] text-sm transition-colors">x</button>
                </div>
                <p className="text-base font-semibold mt-4 tracking-widest">**** **** **** {card.cardNumber}</p>
                <div className="flex justify-between mt-4">
                  <div>
                    <p className="text-[10px] opacity-60 uppercase">ยอดค้างชำระ</p>
                    <p className="text-lg font-bold">{formatCurrency(card.balance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] opacity-60 uppercase">วงเงิน</p>
                    <p className="text-sm font-semibold">{formatCurrency(card.creditLimit)}</p>
                  </div>
                </div>
                <div className="mt-4 bg-white/15 h-1.5 rounded-full overflow-hidden">
                  <div className={`h-full rounded-full transition-all ${getUsageColor(usage)}`} style={{ width: `${usage}%` }} />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-[10px] opacity-60">ใช้ไป {usage.toFixed(0)}%</p>
                  <p className="text-[10px] opacity-60">ครบกำหนดวันที่ {card.dueDate}</p>
                </div>
              </div>
            );
          })}
          {cards.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--text-secondary)]">ยังไม่มีบัตรเครดิต</div>
          )}
        </div>

        <div className="bg-[var(--card-bg)] rounded-lg p-5 shadow-[0_2px_5px_var(--shadow-color)] transition-colors">
          <h3 className="font-bold text-sm mb-4 text-[var(--text-primary)]">สรุปหนี้สินทั้งหมด</h3>
          <table className="w-full">
            <thead>
              <tr className="bg-[var(--table-header-bg)]">
                <th className="px-3 py-2 text-left text-xs font-semibold text-[var(--text-secondary)] uppercase">บัตร</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">วงเงิน</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">ยอดค้างชำระ</th>
                <th className="px-3 py-2 text-right text-xs font-semibold text-[var(--text-secondary)] uppercase">คงเหลือ</th>
                <th className="px-3 py-2 text-center text-xs font-semibold text-[var(--text-secondary)] uppercase">ครบกำหนด</th>
              </tr>
            </thead>
            <tbody className="text-sm">
              {cards.map((card) => (
                <tr key={card.id} className="border-b border-[var(--table-row-border)]">
                  <td className="px-3 py-2.5 text-[var(--text-primary)]">{card.bankName} *{card.cardNumber}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--text-primary)]">{formatCurrency(card.creditLimit)}</td>
                  <td className="px-3 py-2.5 text-right font-semibold text-[var(--danger)]">{formatCurrency(card.balance)}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--success)]">{formatCurrency(card.creditLimit - card.balance)}</td>
                  <td className="px-3 py-2.5 text-center text-[var(--text-primary)]">วันที่ {card.dueDate}</td>
                </tr>
              ))}
              {cards.length > 0 && (
                <tr className="bg-[var(--table-header-bg)] font-bold">
                  <td className="px-3 py-2.5 text-[var(--text-primary)]">รวม</td>
                  <td className="px-3 py-2.5 text-right text-[var(--text-primary)]">{formatCurrency(totalLimit)}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--danger)]">{formatCurrency(totalDebt)}</td>
                  <td className="px-3 py-2.5 text-right text-[var(--success)]">{formatCurrency(totalLimit - totalDebt)}</td>
                  <td></td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[200]">
          <div className="bg-[var(--modal-bg)] rounded-xl p-6 w-full max-w-md shadow-2xl transition-colors">
            <h2 className="text-lg font-bold mb-5 text-[var(--text-primary)]">เพิ่มบัตรเครดิต</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">ธนาคาร</label>
                <input type="text" value={formBank} onChange={(e) => setFormBank(e.target.value)} required placeholder="เช่น KBank, SCB, BBL" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">เลขบัตร (4 หลักสุดท้าย)</label>
                <input type="text" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} required maxLength={4} pattern="\d{4}" placeholder="1234" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">วงเงิน (บาท)</label>
                <input type="number" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} required min="0" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">ยอดค้างชำระปัจจุบัน (บาท)</label>
                <input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} min="0" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-semibold mb-1 text-[var(--text-primary)]">วันครบกำหนดชำระ (วันที่ในเดือน)</label>
                <input type="number" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required min="1" max="31" placeholder="เช่น 25" className={inputClass} />
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

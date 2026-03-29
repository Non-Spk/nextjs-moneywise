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

  // Payment modal
  const [showPayModal, setShowPayModal] = useState(false);
  const [payCard, setPayCard] = useState<CreditCard | null>(null);
  const [payAmount, setPayAmount] = useState("");
  const [payChannel, setPayChannel] = useState("transfer");
  const [payDate, setPayDate] = useState(new Date().toISOString().split("T")[0]);

  // Cashback modal
  const [showCashbackModal, setShowCashbackModal] = useState(false);
  const [cbCard, setCbCard] = useState<CreditCard | null>(null);
  const [cbAmount, setCbAmount] = useState("");
  const [cbDate, setCbDate] = useState(new Date().toISOString().split("T")[0]);

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

  function openPayModal(card: CreditCard) {
    setPayCard(card);
    setPayAmount(String(card.balance));
    setPayChannel("transfer");
    setPayDate(new Date().toISOString().split("T")[0]);
    setShowPayModal(true);
  }

  async function handlePay(e: React.FormEvent) {
    e.preventDefault();
    if (!payCard) return;
    const res = await fetch(`/api/credit-cards/${payCard.id}/pay`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: payAmount, channel: payChannel, date: payDate }),
    });
    if (res.ok) { setShowPayModal(false); setPayCard(null); fetchCards(); }
  }

  function openCashbackModal(card: CreditCard) {
    setCbCard(card);
    setCbAmount("");
    setCbDate(new Date().toISOString().split("T")[0]);
    setShowCashbackModal(true);
  }

  async function handleCashback(e: React.FormEvent) {
    e.preventDefault();
    if (!cbCard) return;
    const res = await fetch(`/api/credit-cards/${cbCard.id}/cashback`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ amount: cbAmount, date: cbDate }),
    });
    if (res.ok) { setShowCashbackModal(false); setCbCard(null); fetchCards(); }
  }

  function getUsagePercent(card: CreditCard) {
    if (card.creditLimit <= 0) return 0;
    return Math.min((card.balance / card.creditLimit) * 100, 100);
  }

  function getUsageColor(percent: number) {
    if (percent < 30) return "var(--success)";
    if (percent < 70) return "var(--warning)";
    return "var(--danger)";
  }

  const totalDebt = cards.reduce((sum, c) => sum + c.balance, 0);
  const totalLimit = cards.reduce((sum, c) => sum + c.creditLimit, 0);
  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="บัตรเครดิต & หนี้สิน" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">บัตรเครดิต & หนี้สิน</h2>
          <div className="flex gap-2">
            <button onClick={() => exportToExcel("credit-cards")}
              className="px-4 py-2 bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">Export Excel</button>
            <button onClick={() => setShowModal(true)}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">+ เพิ่มบัตรเครดิต</button>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4 mb-6">
          {cards.map((card) => {
            const usage = getUsagePercent(card);
            const usageColor = getUsageColor(usage);
            return (
              <div key={card.id} className="bg-[var(--cc-bg)] rounded-2xl p-6 relative overflow-hidden border border-[var(--cc-divider)]">
                <div className="absolute -top-10 -right-10 w-32 h-32 rounded-full" style={{ backgroundColor: usageColor, opacity: 0.08 }} />
                <div className="flex justify-between items-start relative">
                  <p className="text-[11px] font-semibold text-[var(--cc-text-muted)] uppercase tracking-wider">{card.bankName}</p>
                  <button onClick={() => handleDelete(card.id)} className="text-[var(--cc-text-muted)] hover:text-[var(--danger)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
                <p className="text-[15px] font-semibold mt-5 tracking-[0.2em] text-[var(--cc-text)]">**** **** **** {card.cardNumber}</p>
                <div className="flex justify-between mt-5">
                  <div>
                    <p className="text-[10px] text-[var(--cc-text-muted)] uppercase tracking-wide">ยอดค้างชำระ</p>
                    <p className="text-[18px] font-bold text-[var(--cc-text)] mt-0.5">{formatCurrency(card.balance)}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[10px] text-[var(--cc-text-muted)] uppercase tracking-wide">วงเงิน</p>
                    <p className="text-[14px] font-semibold text-[var(--cc-text)] mt-0.5">{formatCurrency(card.creditLimit)}</p>
                  </div>
                </div>
                <div className="mt-4 bg-[var(--cc-divider)] h-1.5 rounded-full overflow-hidden">
                  <div className="h-full rounded-full transition-all" style={{ width: `${usage}%`, backgroundColor: usageColor }} />
                </div>
                <div className="flex justify-between mt-2">
                  <p className="text-[11px] text-[var(--cc-text-muted)]">ใช้ไป {usage.toFixed(0)}%</p>
                  <p className="text-[11px] text-[var(--cc-text-muted)]">ครบกำหนดวันที่ {card.dueDate}</p>
                </div>
                {card.balance > 0 && (
                  <div className="mt-4 flex gap-2">
                    <button onClick={() => openPayModal(card)}
                      className="flex-1 py-2 bg-[var(--cc-bg-accent)] text-[var(--cc-text)] rounded-lg text-[12px] font-medium hover:bg-[var(--cc-divider)] transition-colors border border-[var(--cc-divider)]">
                      ชำระหนี้
                    </button>
                    <button onClick={() => openCashbackModal(card)}
                      className="flex-1 py-2 bg-[var(--cc-bg-accent)] text-[var(--cc-text)] rounded-lg text-[12px] font-medium hover:bg-[var(--cc-divider)] transition-colors border border-[var(--cc-divider)]">
                      Cashback
                    </button>
                  </div>
                )}
              </div>
            );
          })}
          {cards.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">ยังไม่มีบัตรเครดิต</div>
          )}
        </div>

        <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] overflow-hidden transition-colors">
          <div className="px-5 py-4">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)]">สรุปหนี้สินทั้งหมด</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="bg-[var(--table-header-bg)] border-y border-[var(--card-border)]">
                  <th className="px-5 py-2.5 text-left text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">บัตร</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">วงเงิน</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">ยอดค้างชำระ</th>
                  <th className="px-5 py-2.5 text-right text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">คงเหลือ</th>
                  <th className="px-5 py-2.5 text-center text-[11px] font-semibold text-[var(--text-secondary)] uppercase tracking-wide">ครบกำหนด</th>
                  <th className="px-5 py-2.5 w-20"></th>
                </tr>
              </thead>
              <tbody className="text-[13px]">
                {cards.map((card) => (
                  <tr key={card.id} className="border-b border-[var(--table-row-border)] hover:bg-[var(--hover-bg)] transition-colors">
                    <td className="px-5 py-3 text-[var(--text-primary)]">{card.bankName} *{card.cardNumber}</td>
                    <td className="px-5 py-3 text-right text-[var(--text-primary)]">{formatCurrency(card.creditLimit)}</td>
                    <td className="px-5 py-3 text-right font-semibold text-[var(--danger)]">{formatCurrency(card.balance)}</td>
                    <td className="px-5 py-3 text-right text-[var(--success)]">{formatCurrency(card.creditLimit - card.balance)}</td>
                    <td className="px-5 py-3 text-center text-[var(--text-primary)]">วันที่ {card.dueDate}</td>
                    <td className="px-5 py-3 text-right">
                      {card.balance > 0 && (
                        <div className="flex gap-1.5 justify-end">
                          <button onClick={() => openPayModal(card)}
                            className="px-2.5 py-1 bg-[var(--success-bg)] text-[var(--success-text)] rounded-md text-[11px] font-medium transition-colors">
                            ชำระ
                          </button>
                          <button onClick={() => openCashbackModal(card)}
                            className="px-2.5 py-1 bg-[var(--info-bg)] text-[var(--info-text)] rounded-md text-[11px] font-medium transition-colors">
                            CB
                          </button>
                        </div>
                      )}
                    </td>
                  </tr>
                ))}
                {cards.length > 0 && (
                  <tr className="bg-[var(--table-header-bg)] font-semibold">
                    <td className="px-5 py-3 text-[var(--text-primary)]">รวม</td>
                    <td className="px-5 py-3 text-right text-[var(--text-primary)]">{formatCurrency(totalLimit)}</td>
                    <td className="px-5 py-3 text-right text-[var(--danger)]">{formatCurrency(totalDebt)}</td>
                    <td className="px-5 py-3 text-right text-[var(--success)]">{formatCurrency(totalLimit - totalDebt)}</td>
                    <td></td>
                    <td></td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มบัตรเครดิต</h2>
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ธนาคาร</label>
                <input type="text" value={formBank} onChange={(e) => setFormBank(e.target.value)} required placeholder="เช่น KBank, SCB, BBL" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">เลขบัตร (4 หลักสุดท้าย)</label>
                <input type="text" value={formNumber} onChange={(e) => setFormNumber(e.target.value)} required maxLength={4} pattern="\d{4}" placeholder="1234" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วงเงิน (บาท)</label>
                <input type="number" value={formLimit} onChange={(e) => setFormLimit(e.target.value)} required min="0" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ยอดค้างชำระปัจจุบัน (บาท)</label>
                <input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} min="0" className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันครบกำหนดชำระ (วันที่ในเดือน)</label>
                <input type="number" value={formDueDate} onChange={(e) => setFormDueDate(e.target.value)} required min="1" max="31" placeholder="เช่น 25" className={inputClass} />
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
      {showPayModal && payCard && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowPayModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-1 text-[var(--text-primary)]">ชำระหนี้บัตรเครดิต</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5">{payCard.bankName} *{payCard.cardNumber} - ยอดค้าง {formatCurrency(payCard.balance)} บาท</p>
            <form onSubmit={handlePay}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงินที่ชำระ (บาท)</label>
                <input type="number" value={payAmount} onChange={(e) => setPayAmount(e.target.value)} required min="0.01" max={payCard.balance} step="0.01" className={inputClass} />
                <div className="flex gap-2 mt-2">
                  <button type="button" onClick={() => setPayAmount(String(payCard.balance))}
                    className="px-2.5 py-1 bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded-md text-[11px] font-medium hover:bg-[var(--hover-bg)] transition-colors">
                    ชำระเต็มจำนวน
                  </button>
                  <button type="button" onClick={() => setPayAmount(String(Math.min(payCard.balance, payCard.creditLimit * 0.1).toFixed(2)))}
                    className="px-2.5 py-1 bg-[var(--bg-subtle)] text-[var(--text-secondary)] rounded-md text-[11px] font-medium hover:bg-[var(--hover-bg)] transition-colors">
                    ขั้นต่ำ 10%
                  </button>
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ช่องทางชำระ</label>
                <select value={payChannel} onChange={(e) => setPayChannel(e.target.value)} className={inputClass}>
                  <option value="transfer">โอนเงิน</option>
                  <option value="cash">เงินสด</option>
                </select>
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่ชำระ</label>
                <input type="date" value={payDate} onChange={(e) => setPayDate(e.target.value)} required className={inputClass} />
              </div>
              {parseFloat(payAmount) > 0 && (
                <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-5 text-[12px]">
                  <p className="text-[var(--text-primary)]">ยอดค้างหลังชำระ: <span className="font-semibold">{formatCurrency(Math.max(payCard.balance - parseFloat(payAmount), 0))} บาท</span></p>
                </div>
              )}
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowPayModal(false)}
                  className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit"
                  className="px-4 py-2 bg-[var(--success)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--success)] transition-colors">ชำระเงิน</button>
              </div>
            </form>
          </div>
        </div>
      )}
      {showCashbackModal && cbCard && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowCashbackModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-1 text-[var(--text-primary)]">Cashback</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5">{cbCard.bankName} *{cbCard.cardNumber} - ยอดค้าง {formatCurrency(cbCard.balance)} บาท</p>
            <form onSubmit={handleCashback}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวน Cashback (บาท)</label>
                <input type="number" value={cbAmount} onChange={(e) => setCbAmount(e.target.value)} required min="0.01" max={cbCard.balance} step="0.01" className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่ได้รับ</label>
                <input type="date" value={cbDate} onChange={(e) => setCbDate(e.target.value)} required className={inputClass} />
              </div>
              {parseFloat(cbAmount) > 0 && (
                <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-5 text-[12px]">
                  <p className="text-[var(--text-primary)]">ยอดค้างหลัง cashback: <span className="font-semibold">{formatCurrency(Math.max(cbCard.balance - parseFloat(cbAmount), 0))} บาท</span></p>
                </div>
              )}
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowCashbackModal(false)}
                  className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit"
                  className="px-4 py-2 bg-[var(--info)] text-white rounded-lg text-[13px] font-medium transition-colors">บันทึก Cashback</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

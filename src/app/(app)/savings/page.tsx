"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { formatCurrency } from "@/lib/constants";

interface SavingsTransaction {
  id: string;
  type: string;
  amount: number;
  note: string;
  date: string;
}

interface SavingsAccount {
  id: string;
  name: string;
  bankName: string;
  accountNumber: string;
  balance: number;
  goal: number | null;
  transactions: SavingsTransaction[];
}

export default function SavingsPage() {
  const [accounts, setAccounts] = useState<SavingsAccount[]>([]);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txAccount, setTxAccount] = useState<SavingsAccount | null>(null);

  // Add account form
  const [formName, setFormName] = useState("");
  const [formBank, setFormBank] = useState("");
  const [formAccNum, setFormAccNum] = useState("");
  const [formBalance, setFormBalance] = useState("0");
  const [formGoal, setFormGoal] = useState("");

  // Transaction form
  const [txType, setTxType] = useState<"deposit" | "withdraw">("deposit");
  const [txAmount, setTxAmount] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchAccounts = useCallback(async () => {
    const res = await fetch("/api/savings");
    if (res.ok) setAccounts(await res.json());
  }, []);

  useEffect(() => { fetchAccounts(); }, [fetchAccounts]);

  async function handleAddAccount(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/savings", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, bankName: formBank, accountNumber: formAccNum, balance: formBalance, goal: formGoal || null }),
    });
    if (res.ok) { setShowAddModal(false); setFormName(""); setFormBank(""); setFormAccNum(""); setFormBalance("0"); setFormGoal(""); fetchAccounts(); }
  }

  async function handleTransaction(e: React.FormEvent) {
    e.preventDefault();
    if (!txAccount) return;
    const res = await fetch(`/api/savings/${txAccount.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: txType, amount: txAmount, note: txNote, date: txDate }),
    });
    if (res.ok) { setShowTxModal(false); setTxAccount(null); fetchAccounts(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบบัญชีนี้? (รวมประวัติทั้งหมด)")) return;
    const res = await fetch(`/api/savings/${id}`, { method: "DELETE" });
    if (res.ok) fetchAccounts();
  }

  function openTxModal(account: SavingsAccount, type: "deposit" | "withdraw") {
    setTxAccount(account);
    setTxType(type);
    setTxAmount("");
    setTxNote("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setShowTxModal(true);
  }

  const totalSavings = accounts.reduce((sum, a) => sum + a.balance, 0);
  const totalGoal = accounts.filter((a) => a.goal).reduce((sum, a) => sum + (a.goal || 0), 0);
  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="เงินออม & สินทรัพย์" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">บัญชีเงินออม</h2>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">
            + เพิ่มบัญชี
          </button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">เงินออมรวม</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--success)]">{formatCurrency(totalSavings)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">เป้าหมายรวม</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--info)]">{totalGoal > 0 ? formatCurrency(totalGoal) : "-"}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{totalGoal > 0 ? `ออมได้ ${Math.min((totalSavings / totalGoal) * 100, 100).toFixed(0)}%` : "ไม่ได้ตั้งเป้า"}</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">จำนวนบัญชี</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--text-primary)]">{accounts.length}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">บัญชี</p>
          </div>
        </div>

        {/* Account cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {accounts.map((acc) => {
            const goalPercent = acc.goal ? Math.min((acc.balance / acc.goal) * 100, 100) : null;
            return (
              <div key={acc.id} className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{acc.name}</p>
                    <p className="text-[12px] text-[var(--text-secondary)]">{acc.bankName}{acc.accountNumber ? ` - ${acc.accountNumber}` : ""}</p>
                  </div>
                  <button onClick={() => handleDelete(acc.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
                <p className="text-[22px] font-bold text-[var(--success)] tracking-tight">{formatCurrency(acc.balance)} <span className="text-[12px] font-normal text-[var(--text-tertiary)]">บาท</span></p>

                {goalPercent !== null && (
                  <div className="mt-3">
                    <div className="flex justify-between text-[11px] text-[var(--text-secondary)] mb-1">
                      <span>เป้าหมาย {formatCurrency(acc.goal || 0)}</span>
                      <span>{goalPercent.toFixed(0)}%</span>
                    </div>
                    <div className="h-2 bg-[var(--bg-subtle)] rounded-full overflow-hidden">
                      <div className="h-full rounded-full bg-[var(--success)] transition-all" style={{ width: `${goalPercent}%` }} />
                    </div>
                  </div>
                )}

                <div className="flex gap-2 mt-4">
                  <button onClick={() => openTxModal(acc, "deposit")}
                    className="flex-1 py-2 bg-[var(--success-bg)] text-[var(--success-text)] rounded-lg text-[12px] font-medium transition-colors">
                    ฝากเงิน
                  </button>
                  <button onClick={() => openTxModal(acc, "withdraw")}
                    className="flex-1 py-2 bg-[var(--danger-bg)] text-[var(--danger-text)] rounded-lg text-[12px] font-medium transition-colors">
                    ถอนเงิน
                  </button>
                </div>

                {/* Recent transactions */}
                {acc.transactions.length > 0 && (
                  <div className="mt-4 border-t border-[var(--table-row-border)] pt-3">
                    <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">รายการล่าสุด</p>
                    {acc.transactions.slice(0, 5).map((tx) => (
                      <div key={tx.id} className="flex justify-between py-1.5 text-[12px]">
                        <div className="flex items-center gap-2">
                          <span className={tx.type === "deposit" ? "text-[var(--success)]" : "text-[var(--danger)]"}>
                            {tx.type === "deposit" ? "+" : "-"}
                          </span>
                          <span className="text-[var(--text-secondary)]">{tx.note || (tx.type === "deposit" ? "ฝากเงิน" : "ถอนเงิน")}</span>
                        </div>
                        <span className={`font-medium ${tx.type === "deposit" ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {tx.type === "deposit" ? "+" : "-"}{formatCurrency(tx.amount)}
                        </span>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
          {accounts.length === 0 && (
            <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">ยังไม่มีบัญชีเงินออม</div>
          )}
        </div>
      </div>

      {/* Add account modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มบัญชีเงินออม</h2>
            <form onSubmit={handleAddAccount}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อบัญชี</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="เช่น ออมฉุกเฉิน, เที่ยว, ซื้อรถ" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ธนาคาร</label>
                <input type="text" value={formBank} onChange={(e) => setFormBank(e.target.value)} required placeholder="เช่น KBank, SCB, GSB" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">เลขบัญชี (ไม่บังคับ)</label>
                <input type="text" value={formAccNum} onChange={(e) => setFormAccNum(e.target.value)} placeholder="xxx-x-xxxxx-x" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ยอดเงินปัจจุบัน (บาท)</label>
                <input type="number" value={formBalance} onChange={(e) => setFormBalance(e.target.value)} min="0" step="0.01" className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">เป้าหมาย (บาท, ไม่บังคับ)</label>
                <input type="number" value={formGoal} onChange={(e) => setFormGoal(e.target.value)} min="0" step="0.01" placeholder="เช่น 100000" className={inputClass} />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)}
                  className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit"
                  className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Deposit/Withdraw modal */}
      {showTxModal && txAccount && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowTxModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-1 text-[var(--text-primary)]">{txType === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}</h2>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5">{txAccount.name} ({txAccount.bankName}) - ยอด {formatCurrency(txAccount.balance)} บาท</p>
            <form onSubmit={handleTransaction}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงิน (บาท)</label>
                <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required min="0.01"
                  max={txType === "withdraw" ? txAccount.balance : undefined} step="0.01" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่</label>
                <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมายเหตุ</label>
                <input type="text" value={txNote} onChange={(e) => setTxNote(e.target.value)} className={inputClass} placeholder="รายละเอียด" />
              </div>
              {parseFloat(txAmount) > 0 && (
                <div className="bg-[var(--bg-subtle)] rounded-lg p-3 mb-5 text-[12px]">
                  <p className="text-[var(--text-primary)]">ยอดหลัง{txType === "deposit" ? "ฝาก" : "ถอน"}: <span className="font-semibold">
                    {formatCurrency(txType === "deposit" ? txAccount.balance + parseFloat(txAmount) : Math.max(txAccount.balance - parseFloat(txAmount), 0))} บาท
                  </span></p>
                </div>
              )}
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowTxModal(false)}
                  className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit"
                  className={`px-4 py-2 text-white rounded-lg text-[13px] font-medium transition-colors ${txType === "deposit" ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}>
                  {txType === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

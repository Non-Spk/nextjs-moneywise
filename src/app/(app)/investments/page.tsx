"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import LoadingScreen from "@/components/LoadingScreen";
import { INVESTMENT_TYPES, CURRENCIES, getInvestmentTypeLabel } from "@/lib/constants";
import { useAmount } from "@/lib/useAmount";

interface InvestmentTx { id: string; type: string; amount: number; units: number; pricePerUnit: number; note: string; date: string; }
interface Investment { id: string; name: string; type: string; currency: string; currentRate: number; costBasis: number; currentValue: number; units: number; note: string; transactions: InvestmentTx[]; }

type TxMode = "buy" | "sell" | "value_update";

export default function InvestmentsPage() {
  const formatCurrency = useAmount();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [txInv, setTxInv] = useState<Investment | null>(null);
  const [txMode, setTxMode] = useState<TxMode>("buy");

  const [formName, setFormName] = useState("");
  const [formType, setFormType] = useState("fund");
  const [formAmount, setFormAmount] = useState("");
  const [formUnits, setFormUnits] = useState("");
  const [formPrice, setFormPrice] = useState("");
  const [formNote, setFormNote] = useState("");
  const [formDate, setFormDate] = useState(new Date().toISOString().split("T")[0]);
  const [formCurrency, setFormCurrency] = useState("THB");

  const [txAmount, setTxAmount] = useState("");
  const [txUnits, setTxUnits] = useState("");
  const [txPrice, setTxPrice] = useState("");
  const [txNote, setTxNote] = useState("");
  const [txDate, setTxDate] = useState(new Date().toISOString().split("T")[0]);

  const fetchInvestments = useCallback(async () => {
    const res = await fetch("/api/investments");
    if (res.ok) setInvestments(await res.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchInvestments(); }, [fetchInvestments]);

  if (loading) return <><Topbar title="เงินลงทุน" /><LoadingScreen /></>;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, type: formType, amount: formAmount, units: formUnits, pricePerUnit: formPrice, note: formNote, date: formDate, currency: formCurrency }),
    });
    if (res.ok) { setShowAddModal(false); setFormName(""); setFormAmount(""); setFormUnits(""); setFormPrice(""); setFormNote(""); setFormCurrency("THB"); fetchInvestments(); }
  }

  function openTxModal(inv: Investment, mode: TxMode) {
    setTxInv(inv);
    setTxMode(mode);
    setTxAmount(mode === "value_update" ? String(inv.currentValue) : "");
    setTxUnits(""); setTxPrice(""); setTxNote("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setShowTxModal(true);
  }

  async function handleTx(e: React.FormEvent) {
    e.preventDefault();
    if (!txInv) return;
    const res = await fetch(`/api/investments/${txInv.id}`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: txMode, amount: txAmount, units: txUnits, pricePerUnit: txPrice, note: txNote, date: txDate }),
    });
    if (res.ok) { setShowTxModal(false); setTxInv(null); fetchInvestments(); }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการลงทุนนี้?")) return;
    const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
    if (res.ok) fetchInvestments();
  }

  const totalCost = investments.reduce((s, i) => s + i.costBasis * i.currentRate, 0);
  const totalValue = investments.reduce((s, i) => s + i.currentValue * i.currentRate, 0);
  const totalPL = totalValue - totalCost;
  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  return (
    <>
      <Topbar title="ลงทุน" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">พอร์ตลงทุน</h2>
          <button onClick={() => setShowAddModal(true)}
            className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">+ เพิ่มการลงทุน</button>
        </div>

        {/* Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">มูลค่ารวม</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--info)]">{formatCurrency(totalValue)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">ต้นทุนรวม</p>
            <p className="text-[22px] font-bold mt-1.5 tracking-tight text-[var(--text-primary)]">{formatCurrency(totalCost)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">บาท</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">กำไร/ขาดทุน</p>
            <p className={`text-[22px] font-bold mt-1.5 tracking-tight ${totalPL >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
              {totalPL >= 0 ? "+" : ""}{formatCurrency(totalPL)}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">{totalCost > 0 ? `${((totalPL / totalCost) * 100).toFixed(1)}%` : "-"}</p>
          </div>
        </div>

        {/* Investment cards */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
          {investments.map((inv) => {
            const pl = inv.currentValue - inv.costBasis;
            const plPercent = inv.costBasis > 0 ? (pl / inv.costBasis) * 100 : 0;
            const isForeign = inv.currency !== "THB";
            const thbValue = inv.currentValue * inv.currentRate;
            const thbCost = inv.costBasis * inv.currentRate;
            const thbPL = thbValue - thbCost;
            return (
              <div key={inv.id} className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
                <div className="flex justify-between items-start mb-3">
                  <div>
                    <p className="text-[14px] font-semibold text-[var(--text-primary)]">{inv.name}</p>
                    <div className="flex gap-1.5 mt-1">
                      <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--badge-muted-bg)] text-[var(--badge-muted-text)]">{getInvestmentTypeLabel(inv.type)}</span>
                      {isForeign && <span className="inline-block px-2 py-0.5 rounded-full text-[10px] font-medium bg-[var(--info-bg)] text-[var(--info-text)]">{inv.currency} @ {inv.currentRate}</span>}
                    </div>
                  </div>
                  <button onClick={() => handleDelete(inv.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                    <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                  </button>
                </div>
                <div className="grid grid-cols-3 gap-3 mb-1">
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase">มูลค่า{isForeign ? ` (${inv.currency})` : ""}</p>
                    <p className="text-[15px] font-bold text-[var(--info)]">{formatCurrency(inv.currentValue)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase">ต้นทุน</p>
                    <p className="text-[15px] font-semibold text-[var(--text-primary)]">{formatCurrency(inv.costBasis)}</p>
                  </div>
                  <div>
                    <p className="text-[10px] text-[var(--text-tertiary)] uppercase">กำไร/ขาดทุน</p>
                    <p className={`text-[15px] font-semibold ${pl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                      {pl >= 0 ? "+" : ""}{formatCurrency(pl)} <span className="text-[10px]">({plPercent.toFixed(1)}%)</span>
                    </p>
                  </div>
                </div>
                {isForeign && (
                  <p className="text-[11px] text-[var(--text-tertiary)] mb-2">THB: {formatCurrency(thbValue)} (กำไร {thbPL >= 0 ? "+" : ""}{formatCurrency(thbPL)})</p>
                )}
                {inv.units > 0 && <p className="text-[11px] text-[var(--text-tertiary)] mb-3">{inv.units} หน่วย</p>}
                <div className="flex gap-2">
                  <button onClick={() => openTxModal(inv, "buy")} className="flex-1 py-2 bg-[var(--success-bg)] text-[var(--success-text)] rounded-lg text-[12px] font-medium">ซื้อเพิ่ม</button>
                  <button onClick={() => openTxModal(inv, "sell")} className="flex-1 py-2 bg-[var(--danger-bg)] text-[var(--danger-text)] rounded-lg text-[12px] font-medium">ขาย</button>
                  <button onClick={() => openTxModal(inv, "value_update")} className="flex-1 py-2 bg-[var(--info-bg)] text-[var(--info-text)] rounded-lg text-[12px] font-medium">อัพเดท</button>
                </div>
              </div>
            );
          })}
          {investments.length === 0 && <div className="col-span-full text-center py-12 text-[var(--text-tertiary)]">ยังไม่มีรายการลงทุน</div>}
        </div>
      </div>

      {/* Add modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowAddModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มการลงทุน</h2>
            <form onSubmit={handleAdd}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อ</label>
                <input type="text" value={formName} onChange={(e) => setFormName(e.target.value)} required placeholder="เช่น ทองคำแท่ง, SCBSET, BTC" className={inputClass} />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภท</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className={inputClass}>
                  {INVESTMENT_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">สกุลเงิน</label>
                <select value={formCurrency} onChange={(e) => setFormCurrency(e.target.value)} className={inputClass}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
                {formCurrency !== "THB" && (
                  <p className="text-[11px] text-[var(--text-tertiary)] mt-1">อัตราแลกเปลี่ยนจัดการได้ที่หน้าตั้งค่า</p>
                )}
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงินลงทุน ({formCurrency})</label>
                <input type="number" value={formAmount} onChange={(e) => setFormAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              <div className="grid grid-cols-2 gap-3 mb-4">
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนหน่วย</label>
                  <input type="number" value={formUnits} onChange={(e) => setFormUnits(e.target.value)} min="0" step="any" className={inputClass} placeholder="0" />
                </div>
                <div>
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ราคา/หน่วย</label>
                  <input type="number" value={formPrice} onChange={(e) => setFormPrice(e.target.value)} min="0" step="any" className={inputClass} placeholder="0" />
                </div>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่ซื้อ</label>
                <input type="date" value={formDate} onChange={(e) => setFormDate(e.target.value)} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมายเหตุ</label>
                <input type="text" value={formNote} onChange={(e) => setFormNote(e.target.value)} className={inputClass} />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowAddModal(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Transaction modal */}
      {showTxModal && txInv && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowTxModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-1 text-[var(--text-primary)]">
              {txMode === "buy" ? "ซื้อเพิ่ม" : txMode === "sell" ? "ขาย" : "อัพเดทมูลค่า"}
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)] mb-5">
              {txInv.name} - มูลค่า {formatCurrency(txInv.currentValue)} {txInv.currency}
              {txInv.currency !== "THB" && ` (${formatCurrency(txInv.currentValue * txInv.currentRate)} THB @ ${txInv.currentRate})`}
            </p>
            <form onSubmit={handleTx}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">
                  {txMode === "value_update" ? `มูลค่าปัจจุบัน (${txInv.currency})` : `จำนวนเงิน (${txInv.currency})`}
                </label>
                <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
              </div>
              {txMode !== "value_update" && (
                <div className="grid grid-cols-2 gap-3 mb-4">
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนหน่วย</label>
                    <input type="number" value={txUnits} onChange={(e) => setTxUnits(e.target.value)} min="0" step="any" className={inputClass} />
                  </div>
                  <div>
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ราคา/หน่วย</label>
                    <input type="number" value={txPrice} onChange={(e) => setTxPrice(e.target.value)} min="0" step="any" className={inputClass} />
                  </div>
                </div>
              )}
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">วันที่</label>
                <input type="date" value={txDate} onChange={(e) => setTxDate(e.target.value)} required className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมายเหตุ</label>
                <input type="text" value={txNote} onChange={(e) => setTxNote(e.target.value)} className={inputClass} />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowTxModal(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg text-[13px] font-medium transition-colors ${
                  txMode === "buy" ? "bg-[var(--success)]" : txMode === "sell" ? "bg-[var(--danger)]" : "bg-[var(--info)]"
                }`}>{txMode === "buy" ? "ซื้อ" : txMode === "sell" ? "ขาย" : "อัพเดท"}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

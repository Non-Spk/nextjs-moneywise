"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import LoadingScreen from "@/components/LoadingScreen";
import { INVESTMENT_TYPES, CURRENCIES, getInvestmentTypeLabel } from "@/lib/constants";
import { useAmount } from "@/lib/useAmount";

interface InvestmentTx { id: string; type: string; amount: number; units: number; pricePerUnit: number; note: string; date: string; }
interface Investment { id: string; name: string; type: string; currency: string; currentRate: number; costBasis: number; currentValue: number; units: number; note: string; transactions: InvestmentTx[]; }
interface InvAccount { id: string; currency: string; balance: number; rate: number; balanceTHB: number; }

type TxMode = "buy" | "sell" | "value_update";

export default function InvestmentsPage() {
  const formatCurrency = useAmount();
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [accounts, setAccounts] = useState<InvAccount[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddModal, setShowAddModal] = useState(false);
  const [showTxModal, setShowTxModal] = useState(false);
  const [showAccModal, setShowAccModal] = useState(false);
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

  const [sellAll, setSellAll] = useState(false);
  // Track which field was last edited by the user to know which two to auto-calc from
  const [sellLastEdited, setSellLastEdited] = useState<"units" | "price" | "amount" | null>(null);

  const [accCurrency, setAccCurrency] = useState("THB");
  const [accAmount, setAccAmount] = useState("");
  const [accAction, setAccAction] = useState<"deposit" | "withdraw">("deposit");

  const fetchData = useCallback(async () => {
    const [invRes, accRes] = await Promise.all([
      fetch("/api/investments"),
      fetch("/api/investment-accounts"),
    ]);
    if (invRes.ok) setInvestments(await invRes.json());
    if (accRes.ok) setAccounts(await accRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <><Topbar title="เงินลงทุน" /><LoadingScreen /></>;

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/investments", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: formName, type: formType, amount: formAmount, units: formUnits, pricePerUnit: formPrice, note: formNote, date: formDate, currency: formCurrency }),
    });
    if (res.ok) {
      setShowAddModal(false); setFormName(""); setFormAmount(""); setFormUnits(""); setFormPrice(""); setFormNote(""); setFormCurrency("THB"); fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "เกิดข้อผิดพลาด");
    }
  }

  function openTxModal(inv: Investment, mode: TxMode) {
    setTxInv(inv);
    setTxMode(mode);
    setTxAmount(mode === "value_update" ? String(inv.currentValue) : "");
    setTxUnits("");
    // For sell mode, pre-fill current price per unit
    const currentPricePerUnit = inv.units > 0 ? +(inv.currentValue / inv.units).toFixed(4) : 0;
    setTxPrice(mode === "sell" && currentPricePerUnit > 0 ? String(currentPricePerUnit) : "");
    setTxNote("");
    setTxDate(new Date().toISOString().split("T")[0]);
    setSellAll(false);
    setSellLastEdited(null);
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
    if (res.ok) {
      setShowTxModal(false); setTxInv(null); fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "เกิดข้อผิดพลาด");
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบรายการลงทุนนี้?")) return;
    const res = await fetch(`/api/investments/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  async function handleAccAction(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/investment-accounts", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ currency: accCurrency, amount: accAmount, action: accAction }),
    });
    if (res.ok) {
      setShowAccModal(false); setAccAmount(""); fetchData();
    } else {
      const err = await res.json();
      alert(err.error || "เกิดข้อผิดพลาด");
    }
  }

  const totalCost = investments.reduce((s, i) => s + i.costBasis * i.currentRate, 0);
  const totalValue = investments.reduce((s, i) => s + i.currentValue * i.currentRate, 0);
  const totalPL = totalValue - totalCost;
  const totalAccBalanceTHB = accounts.reduce((s, a) => s + a.balanceTHB, 0);
  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  // Get account balance for a currency
  const getAccBalance = (currency: string) => accounts.find((a) => a.currency === currency)?.balance || 0;

  // Sell auto-calculation: given two of three values, compute the third
  // When user types units manually -> integer only, capped at floor(units)
  // When computed from amount/price or sellAll -> use actual decimal value, capped at real units
  function sellCalc(field: "units" | "price" | "amount", value: string) {
    const realMax = txInv ? txInv.units : 0;

    if (field === "units") {
      // User is typing units manually -> integer, capped at floor
      const intMax = Math.floor(realMax);
      const u = parseInt(value) || 0;
      const clamped = Math.min(Math.max(u, 0), intMax);
      setTxUnits(value === "" ? "" : String(clamped));
      setSellLastEdited("units");
      const p = parseFloat(txPrice) || 0;
      const a = parseFloat(txAmount) || 0;
      if (p > 0 && clamped > 0) {
        setTxAmount(String(+(clamped * p).toFixed(2)));
      } else if (a > 0 && clamped > 0) {
        setTxPrice(String(+(a / clamped).toFixed(4)));
      }
    } else if (field === "price") {
      setTxPrice(value);
      setSellLastEdited("price");
      const p = parseFloat(value) || 0;
      const u = parseFloat(txUnits) || 0;
      const a = parseFloat(txAmount) || 0;
      if (u > 0 && p > 0) {
        setTxAmount(String(+(u * p).toFixed(2)));
      } else if (a > 0 && p > 0) {
        // Computed units -> use real decimal, capped at actual units
        const calc = Math.min(a / p, realMax);
        setTxUnits(String(+calc.toFixed(6)));
      }
    } else {
      setTxAmount(value);
      setSellLastEdited("amount");
      const a = parseFloat(value) || 0;
      const u = parseFloat(txUnits) || 0;
      const p = parseFloat(txPrice) || 0;
      if (u > 0 && a > 0) {
        setTxPrice(String(+(a / u).toFixed(4)));
      } else if (p > 0 && a > 0) {
        // Computed units -> use real decimal, capped at actual units
        const calc = Math.min(a / p, realMax);
        setTxUnits(String(+calc.toFixed(6)));
      }
    }
  }

  function handleSellAllToggle(checked: boolean) {
    setSellAll(checked);
    if (checked && txInv) {
      // Use actual units (may be decimal)
      const allUnits = txInv.units;
      setTxUnits(String(allUnits));
      setSellLastEdited("units");
      const p = parseFloat(txPrice) || 0;
      if (p > 0 && allUnits > 0) {
        setTxAmount(String(+(allUnits * p).toFixed(2)));
      }
    }
  }

  return (
    <>
      <Topbar title="ลงทุน" />
      <div className="p-4 sm:p-6 max-w-[1200px]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">พอร์ตลงทุน</h2>
          <div className="flex gap-2">
            <button onClick={() => setShowAccModal(true)}
              className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">จัดการบัญชีเงินลงทุน</button>
            <button onClick={() => setShowAddModal(true)}
              className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">+ เพิ่มการลงทุน</button>
          </div>
        </div>

        {/* Investment Account Balances */}
        {accounts.length > 0 && (
          <div className="mb-6">
            <h3 className="text-[13px] font-semibold text-[var(--text-secondary)] mb-3 uppercase tracking-wide">บัญชีเงินลงทุน</h3>
            <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-3">
              {accounts.map((acc) => (
                <div key={acc.id} className="bg-[var(--card-bg)] rounded-xl p-4 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
                  <p className="text-[11px] text-[var(--text-tertiary)] font-medium uppercase">{acc.currency}</p>
                  <p className="text-[18px] font-bold mt-1 text-[var(--text-primary)]">{formatCurrency(acc.balance)}</p>
                  {acc.currency !== "THB" && (
                    <p className="text-[11px] text-[var(--text-tertiary)] mt-0.5">= {formatCurrency(acc.balanceTHB)} THB</p>
                  )}
                </div>
              ))}
              <div className="bg-[var(--card-bg)] rounded-xl p-4 shadow-[var(--shadow-card)] border border-[var(--card-border)] border-dashed">
                <p className="text-[11px] text-[var(--text-tertiary)] font-medium uppercase">รวม (THB)</p>
                <p className="text-[18px] font-bold mt-1 text-[var(--info)]">{formatCurrency(totalAccBalanceTHB)}</p>
              </div>
            </div>
          </div>
        )}

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

      {/* Add Investment modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200] p-4" onClick={() => setShowAddModal(false)}>
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
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                  ยอดคงเหลือบัญชี {formCurrency}: {formatCurrency(getAccBalance(formCurrency))} {formCurrency}
                </p>
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
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200] p-4" onClick={() => setShowTxModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-5 sm:p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-1 text-[var(--text-primary)]">
              {txMode === "buy" ? "ซื้อเพิ่ม" : txMode === "sell" ? "ขาย" : "อัพเดทมูลค่า"}
            </h2>
            <p className="text-[13px] text-[var(--text-secondary)] mb-1">
              {txInv.name} - มูลค่า {formatCurrency(txInv.currentValue)} {txInv.currency}
              {txInv.currency !== "THB" && ` (${formatCurrency(txInv.currentValue * txInv.currentRate)} THB @ ${txInv.currentRate})`}
            </p>
            {txMode === "buy" && (
              <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
                ยอดคงเหลือบัญชี {txInv.currency}: {formatCurrency(getAccBalance(txInv.currency))} {txInv.currency}
              </p>
            )}
            {txMode === "sell" && (
              <p className="text-[12px] text-[var(--text-tertiary)] mb-4">
                มี {txInv.units} หน่วย - เงินจะเข้าบัญชีลงทุน {txInv.currency}
              </p>
            )}
            {txMode === "value_update" && <div className="mb-4" />}
            <form onSubmit={handleTx}>
              {/* SELL mode - special UI */}
              {txMode === "sell" && (
                <>
                  <div className="mb-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input type="checkbox" checked={sellAll} onChange={(e) => handleSellAllToggle(e.target.checked)}
                        className="w-4 h-4 rounded border-[var(--input-border)] accent-[var(--danger)]" />
                      <span className="text-[13px] font-medium text-[var(--text-primary)]">ขายทั้งหมด ({txInv.units} หน่วย)</span>
                    </label>
                  </div>
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนหน่วย</label>
                    <input type="number" value={txUnits}
                      onChange={(e) => sellCalc("units", e.target.value)}
                      required min="1" max={Math.floor(txInv.units)} step="1"
                      disabled={sellAll}
                      className={`${inputClass} ${sellAll ? "opacity-50" : ""}`} />
                    {!sellAll && <p className="text-[11px] text-[var(--text-tertiary)] mt-1">สูงสุด {Math.floor(txInv.units)} หน่วย (จำนวนเต็มเท่านั้น)</p>}
                  </div>
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ราคาต่อหน่วย ({txInv.currency})</label>
                    <input type="number" value={txPrice}
                      onChange={(e) => sellCalc("price", e.target.value)}
                      min="0" step="any" className={inputClass} />
                  </div>
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ราคารวม ({txInv.currency})</label>
                    <input type="number" value={txAmount}
                      onChange={(e) => sellCalc("amount", e.target.value)}
                      required min="0" step="0.01" className={inputClass} />
                  </div>
                </>
              )}
              {/* BUY mode */}
              {txMode === "buy" && (
                <>
                  <div className="mb-4">
                    <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงิน ({txInv.currency})</label>
                    <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
                  </div>
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
                </>
              )}
              {/* VALUE UPDATE mode */}
              {txMode === "value_update" && (
                <div className="mb-4">
                  <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">มูลค่าปัจจุบัน ({txInv.currency})</label>
                  <input type="number" value={txAmount} onChange={(e) => setTxAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
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

      {/* Investment Account modal */}
      {showAccModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200] p-4" onClick={() => setShowAccModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md max-h-[90vh] overflow-y-auto shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">จัดการบัญชีเงินลงทุน</h2>

            {/* Current balances */}
            {accounts.length > 0 && (
              <div className="mb-5 p-3 bg-[var(--hover-bg)] rounded-lg">
                <p className="text-[12px] font-medium text-[var(--text-secondary)] mb-2 uppercase">ยอดคงเหลือ</p>
                {accounts.map((acc) => (
                  <div key={acc.id} className="flex justify-between text-[13px] py-0.5">
                    <span className="text-[var(--text-primary)]">{acc.currency}</span>
                    <span className="font-semibold text-[var(--text-primary)]">{formatCurrency(acc.balance)}</span>
                  </div>
                ))}
              </div>
            )}

            <form onSubmit={handleAccAction}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">สกุลเงิน</label>
                <select value={accCurrency} onChange={(e) => setAccCurrency(e.target.value)} className={inputClass}>
                  {CURRENCIES.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภท</label>
                <div className="flex gap-2">
                  <button type="button" onClick={() => setAccAction("deposit")}
                    className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${accAction === "deposit" ? "bg-[var(--success)] text-white" : "bg-[var(--hover-bg)] text-[var(--text-primary)]"}`}>
                    ฝากเงิน
                  </button>
                  <button type="button" onClick={() => setAccAction("withdraw")}
                    className={`flex-1 py-2.5 rounded-lg text-[13px] font-medium transition-colors ${accAction === "withdraw" ? "bg-[var(--danger)] text-white" : "bg-[var(--hover-bg)] text-[var(--text-primary)]"}`}>
                    ถอนเงิน
                  </button>
                </div>
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">จำนวนเงิน ({accCurrency})</label>
                <input type="number" value={accAmount} onChange={(e) => setAccAmount(e.target.value)} required min="0" step="0.01" className={inputClass} />
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">
                  ยอดปัจจุบัน: {formatCurrency(getAccBalance(accCurrency))} {accCurrency}
                </p>
              </div>
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowAccModal(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ปิด</button>
                <button type="submit" className={`px-4 py-2 text-white rounded-lg text-[13px] font-medium transition-colors ${accAction === "deposit" ? "bg-[var(--success)]" : "bg-[var(--danger)]"}`}>
                  {accAction === "deposit" ? "ฝากเงิน" : "ถอนเงิน"}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import LoadingScreen from "@/components/LoadingScreen";
import { getInvestmentTypeLabel, getPhysicalAssetTypeLabel, PHYSICAL_ASSET_TYPES } from "@/lib/constants";
import { useAmount } from "@/lib/useAmount";

interface SavingsAccount { id: string; name: string; bankName: string; balance: number; goal: number | null; }
interface Investment { id: string; name: string; type: string; currency: string; currentRate: number; costBasis: number; currentValue: number; units: number; }
interface PhysicalAsset { id: string; name: string; type: string; purchaseValue: number; currentValue: number; note: string; }

export default function AssetsPage() {
  const formatCurrency = useAmount();
  const [savings, setSavings] = useState<SavingsAccount[]>([]);
  const [investments, setInvestments] = useState<Investment[]>([]);
  const [physicalAssets, setPhysicalAssets] = useState<PhysicalAsset[]>([]);
  const [loading, setLoading] = useState(true);
  const [showAddPA, setShowAddPA] = useState(false);
  const [paName, setPaName] = useState("");
  const [paType, setPaType] = useState("gold");
  const [paPurchase, setPaPurchase] = useState("");
  const [paCurrent, setPaCurrent] = useState("");
  const [paNote, setPaNote] = useState("");

  const fetchData = useCallback(async () => {
    const [sRes, iRes, pRes] = await Promise.all([fetch("/api/savings"), fetch("/api/investments"), fetch("/api/physical-assets")]);
    if (sRes.ok) setSavings(await sRes.json());
    if (iRes.ok) setInvestments(await iRes.json());
    if (pRes.ok) setPhysicalAssets(await pRes.json());
    setLoading(false);
  }, []);

  useEffect(() => { fetchData(); }, [fetchData]);

  if (loading) return <><Topbar title="ทรัพย์สินรวม" /><LoadingScreen /></>;

  async function handleAddPA(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/physical-assets", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ name: paName, type: paType, purchaseValue: paPurchase, currentValue: paCurrent || paPurchase, note: paNote }),
    });
    if (res.ok) { setShowAddPA(false); setPaName(""); setPaPurchase(""); setPaCurrent(""); setPaNote(""); fetchData(); }
  }

  async function handleDeletePA(id: string) {
    if (!confirm("ต้องการลบรายการนี้?")) return;
    const res = await fetch(`/api/physical-assets/${id}`, { method: "DELETE" });
    if (res.ok) fetchData();
  }

  const totalSavings = savings.reduce((s, a) => s + a.balance, 0);
  const totalInvestmentValue = investments.reduce((s, i) => s + i.currentValue * (i.currentRate || 1), 0);
  const totalInvestmentCost = investments.reduce((s, i) => s + i.costBasis * (i.currentRate || 1), 0);
  const totalPhysical = physicalAssets.reduce((s, a) => s + a.currentValue, 0);
  const totalAssets = totalSavings + totalInvestmentValue + totalPhysical;
  const investmentPL = totalInvestmentValue - totalInvestmentCost;

  // Group investments by type (in THB)
  const byType: Record<string, { value: number; cost: number; count: number }> = {};
  for (const inv of investments) {
    if (!byType[inv.type]) byType[inv.type] = { value: 0, cost: 0, count: 0 };
    const rate = inv.currentRate || 1;
    byType[inv.type].value += inv.currentValue * rate;
    byType[inv.type].cost += inv.costBasis * rate;
    byType[inv.type].count++;
  }

  // Asset allocation data
  const allocations = [
    ...(totalSavings > 0 ? [{ label: "เงินออม", value: totalSavings, color: "var(--success)" }] : []),
    ...Object.entries(byType).map(([type, data]) => ({
      label: getInvestmentTypeLabel(type), value: data.value, color: "var(--info)",
    })),
    ...(totalPhysical > 0 ? [{ label: "สินทรัพย์อื่น", value: totalPhysical, color: "var(--warning)" }] : []),
  ];

  return (
    <>
      <Topbar title="ภาพรวมทรัพย์สิน" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-6">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">ภาพรวมทรัพย์สิน</h2>
          <button onClick={() => setShowAddPA(true)}
            className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">
            + เพิ่มสินทรัพย์
          </button>
        </div>

        {/* Total assets */}
        <div className="bg-[var(--card-bg)] rounded-xl p-6 shadow-[var(--shadow-card)] border border-[var(--card-border)] mb-6 text-center">
          <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">ทรัพย์สินรวมทั้งหมด</p>
          <p className="text-[32px] font-bold mt-2 tracking-tight text-[var(--text-primary)]">{formatCurrency(totalAssets)}</p>
          <p className="text-[13px] text-[var(--text-tertiary)] mt-1">บาท</p>
        </div>

        {/* Breakdown cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-5 gap-4 mb-6">
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">เงินออม</p>
            <p className="text-[20px] font-bold mt-1.5 text-[var(--success)]">{formatCurrency(totalSavings)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{savings.length} บัญชี</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">มูลค่าลงทุน</p>
            <p className="text-[20px] font-bold mt-1.5 text-[var(--info)]">{formatCurrency(totalInvestmentValue)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{investments.length} รายการ</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">สินทรัพย์อื่น</p>
            <p className="text-[20px] font-bold mt-1.5 text-[var(--warning)]">{formatCurrency(totalPhysical)}</p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{physicalAssets.length} รายการ</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">ต้นทุนลงทุน</p>
            <p className="text-[20px] font-bold mt-1.5 text-[var(--text-primary)]">{formatCurrency(totalInvestmentCost)}</p>
          </div>
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <p className="text-[12px] text-[var(--text-secondary)] font-medium uppercase tracking-wide">กำไร/ขาดทุน</p>
            <p className={`text-[20px] font-bold mt-1.5 ${investmentPL >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
              {investmentPL >= 0 ? "+" : ""}{formatCurrency(investmentPL)}
            </p>
            <p className="text-[11px] text-[var(--text-tertiary)]">{totalInvestmentCost > 0 ? `${((investmentPL / totalInvestmentCost) * 100).toFixed(1)}%` : "-"}</p>
          </div>
        </div>

        {/* Asset allocation bar */}
        {allocations.length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] mb-6">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">สัดส่วนทรัพย์สิน</h3>
            <div className="h-8 rounded-lg overflow-hidden flex mb-4">
              {allocations.map((a, i) => (
                <div key={i} className="h-full transition-all" style={{ width: `${(a.value / totalAssets) * 100}%`, backgroundColor: a.color, opacity: 0.7 + (i * 0.1) }} />
              ))}
            </div>
            <div className="flex flex-wrap gap-4">
              {allocations.map((a, i) => (
                <div key={i} className="flex items-center gap-2">
                  <div className="w-3 h-3 rounded-sm" style={{ backgroundColor: a.color, opacity: 0.7 + (i * 0.1) }} />
                  <span className="text-[12px] text-[var(--text-secondary)]">{a.label}: {formatCurrency(a.value)} ({((a.value / totalAssets) * 100).toFixed(1)}%)</span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Investment by type */}
        {Object.keys(byType).length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] mb-6">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">ลงทุนแยกตามประเภท</h3>
            <div className="space-y-3">
              {Object.entries(byType).sort((a, b) => b[1].value - a[1].value).map(([type, data]) => {
                const pl = data.value - data.cost;
                return (
                  <div key={type} className="flex items-center justify-between py-2 border-b border-[var(--table-row-border)] last:border-b-0">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{getInvestmentTypeLabel(type)}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{data.count} รายการ - ต้นทุน {formatCurrency(data.cost)}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold text-[var(--info)]">{formatCurrency(data.value)}</p>
                      <p className={`text-[11px] font-medium ${pl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                        {pl >= 0 ? "+" : ""}{formatCurrency(pl)}
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Physical assets */}
        {physicalAssets.length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)] mb-6">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">สินทรัพย์อื่น</h3>
            <div className="space-y-3">
              {physicalAssets.map((asset) => {
                const pl = asset.currentValue - asset.purchaseValue;
                return (
                  <div key={asset.id} className="flex items-center justify-between py-2 border-b border-[var(--table-row-border)] last:border-b-0">
                    <div>
                      <p className="text-[13px] font-medium text-[var(--text-primary)]">{asset.name}</p>
                      <p className="text-[11px] text-[var(--text-tertiary)]">{getPhysicalAssetTypeLabel(asset.type)}{asset.note ? ` - ${asset.note}` : ""}</p>
                    </div>
                    <div className="text-right">
                      <p className="text-[14px] font-semibold text-[var(--warning)]">{formatCurrency(asset.currentValue)}</p>
                      {asset.purchaseValue > 0 && (
                        <p className={`text-[11px] font-medium ${pl >= 0 ? "text-[var(--success)]" : "text-[var(--danger)]"}`}>
                          {pl >= 0 ? "+" : ""}{formatCurrency(pl)}
                        </p>
                      )}
                    </div>
                    <button onClick={() => handleDeletePA(asset.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors ml-3">
                      <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                    </button>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Savings accounts list */}
        {savings.length > 0 && (
          <div className="bg-[var(--card-bg)] rounded-xl p-5 shadow-[var(--shadow-card)] border border-[var(--card-border)]">
            <h3 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">บัญชีเงินออม</h3>
            <div className="space-y-3">
              {savings.map((acc) => (
                <div key={acc.id} className="flex items-center justify-between py-2 border-b border-[var(--table-row-border)] last:border-b-0">
                  <div>
                    <p className="text-[13px] font-medium text-[var(--text-primary)]">{acc.name}</p>
                    <p className="text-[11px] text-[var(--text-tertiary)]">{acc.bankName}</p>
                  </div>
                  <div className="text-right">
                    <p className="text-[14px] font-semibold text-[var(--success)]">{formatCurrency(acc.balance)}</p>
                    {acc.goal && <p className="text-[11px] text-[var(--text-tertiary)]">เป้า {formatCurrency(acc.goal)}</p>}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Add physical asset modal */}
      {showAddPA && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowAddPA(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มสินทรัพย์</h2>
            <form onSubmit={handleAddPA}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อ</label>
                <input type="text" value={paName} onChange={(e) => setPaName(e.target.value)} required placeholder="เช่น ทองก้อน 5 บาท, คอนโด" className="w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors" />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภท</label>
                <select value={paType} onChange={(e) => setPaType(e.target.value)} className="w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors">
                  {PHYSICAL_ASSET_TYPES.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">มูลค่าซื้อ (บาท)</label>
                <input type="number" value={paPurchase} onChange={(e) => setPaPurchase(e.target.value)} min="0" step="0.01" className="w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors" />
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">มูลค่าปัจจุบัน (บาท)</label>
                <input type="number" value={paCurrent} onChange={(e) => setPaCurrent(e.target.value)} min="0" step="0.01" placeholder="ถ้าไม่ระบุจะใช้มูลค่าซื้อ" className="w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors" />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">หมายเหตุ</label>
                <input type="text" value={paNote} onChange={(e) => setPaNote(e.target.value)} className="w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors" />
              </div>
              <div className="flex gap-2.5 justify-end">
                <button type="button" onClick={() => setShowAddPA(false)} className="px-4 py-2 border border-[var(--input-border)] text-[var(--text-primary)] rounded-lg text-[13px] font-medium hover:bg-[var(--hover-bg)] transition-colors">ยกเลิก</button>
                <button type="submit" className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">บันทึก</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </>
  );
}

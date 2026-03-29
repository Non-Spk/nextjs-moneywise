"use client";

import { useState, useEffect, useCallback } from "react";
import Topbar from "@/components/Topbar";
import { EXPENSE_CATEGORIES, INCOME_CATEGORIES } from "@/lib/constants";

interface Category {
  id: string;
  type: string;
  value: string;
  label: string;
}

export default function SettingsPage() {
  const [categories, setCategories] = useState<Category[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [formType, setFormType] = useState("expense");
  const [formValue, setFormValue] = useState("");
  const [formLabel, setFormLabel] = useState("");
  const [error, setError] = useState("");
  const [editId, setEditId] = useState<string | null>(null);
  const [editLabel, setEditLabel] = useState("");

  const fetchCategories = useCallback(async () => {
    const res = await fetch("/api/categories");
    if (res.ok) setCategories(await res.json());
  }, []);

  useEffect(() => { fetchCategories(); }, [fetchCategories]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    const slug = formValue.trim().toLowerCase().replace(/\s+/g, "_").replace(/[^a-z0-9_]/g, "");
    if (!slug) { setError("รหัสหมวดหมู่ไม่ถูกต้อง"); return; }

    const res = await fetch("/api/categories", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ type: formType, value: slug, label: formLabel.trim() }),
    });
    if (res.ok) {
      setShowModal(false); setFormValue(""); setFormLabel(""); setError("");
      fetchCategories();
    } else {
      try {
        const data = await res.json();
        setError(data.error || "เกิดข้อผิดพลาด");
      } catch {
        setError("เกิดข้อผิดพลาด กรุณาลองใหม่");
      }
    }
  }

  async function handleDelete(id: string) {
    if (!confirm("ต้องการลบหมวดหมู่นี้?")) return;
    const res = await fetch(`/api/categories/${id}`, { method: "DELETE" });
    if (res.ok) fetchCategories();
  }

  async function handleEditSave(id: string) {
    if (!editLabel.trim()) return;
    const res = await fetch(`/api/categories/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: editLabel.trim() }),
    });
    if (res.ok) { setEditId(null); fetchCategories(); }
  }

  const customExpense = categories.filter((c) => c.type === "expense");
  const customIncome = categories.filter((c) => c.type === "income");

  const inputClass = "w-full px-3.5 py-2.5 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded-lg text-[13px] outline-none focus:border-[var(--brand-red)] transition-colors";

  function renderCategorySection(title: string, defaults: readonly { value: string; label: string }[], custom: Category[]) {
    return (
      <div className="bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-card)] border border-[var(--card-border)] p-5 transition-colors">
        <h3 className="font-semibold text-[14px] text-[var(--text-primary)] mb-4">{title}</h3>

        {/* Default categories */}
        <div className="mb-4">
          <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">ค่าเริ่มต้น (แก้ไขไม่ได้)</p>
          <div className="flex flex-wrap gap-2">
            {defaults.map((c) => (
              <span key={c.value} className="inline-block px-3 py-1.5 rounded-lg text-[12px] font-medium bg-[var(--bg-subtle)] text-[var(--text-secondary)] border border-[var(--card-border)]">
                {c.label}
              </span>
            ))}
          </div>
        </div>

        {/* Custom categories */}
        {custom.length > 0 && (
          <div>
            <p className="text-[11px] font-semibold text-[var(--text-tertiary)] uppercase tracking-wide mb-2">กำหนดเอง</p>
            <div className="space-y-2">
              {custom.map((c) => (
                <div key={c.id} className="flex items-center justify-between py-2 px-3 rounded-lg bg-[var(--bg-subtle)] border border-[var(--card-border)]">
                  {editId === c.id ? (
                    <div className="flex items-center gap-2 flex-1">
                      <input type="text" value={editLabel} onChange={(e) => setEditLabel(e.target.value)}
                        className="px-2 py-1 border border-[var(--input-border)] bg-[var(--input-bg)] text-[var(--text-primary)] rounded text-[13px] outline-none flex-1"
                        onKeyDown={(e) => { if (e.key === "Enter") handleEditSave(c.id); if (e.key === "Escape") setEditId(null); }} autoFocus />
                      <button onClick={() => handleEditSave(c.id)} className="text-[var(--success)] text-[12px] font-medium">บันทึก</button>
                      <button onClick={() => setEditId(null)} className="text-[var(--text-tertiary)] text-[12px]">ยกเลิก</button>
                    </div>
                  ) : (
                    <>
                      <div>
                        <span className="text-[13px] font-medium text-[var(--text-primary)]">{c.label}</span>
                        <span className="text-[11px] text-[var(--text-tertiary)] ml-2">({c.value})</span>
                      </div>
                      <div className="flex items-center gap-2">
                        <button onClick={() => { setEditId(c.id); setEditLabel(c.label); }}
                          className="text-[var(--text-tertiary)] hover:text-[var(--info)] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"><path d="M11.5 1.5l3 3L5 14H2v-3z" /></svg>
                        </button>
                        <button onClick={() => handleDelete(c.id)} className="text-[var(--text-tertiary)] hover:text-[var(--danger)] transition-colors">
                          <svg width="14" height="14" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round"><path d="M4 4l8 8M12 4l-8 8" /></svg>
                        </button>
                      </div>
                    </>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {custom.length === 0 && (
          <p className="text-[12px] text-[var(--text-tertiary)] mt-2">ยังไม่มีหมวดหมู่กำหนดเอง</p>
        )}
      </div>
    );
  }

  return (
    <>
      <Topbar title="ตั้งค่า" />
      <div className="p-6 max-w-[1200px]">
        <div className="flex justify-between items-center mb-5">
          <h2 className="font-semibold text-[15px] text-[var(--text-primary)]">จัดการหมวดหมู่</h2>
          <button onClick={() => { setShowModal(true); setError(""); setFormValue(""); setFormLabel(""); }}
            className="px-4 py-2 bg-[var(--brand-red)] text-white rounded-lg text-[13px] font-medium hover:bg-[var(--brand-red-hover)] transition-colors">
            + เพิ่มหมวดหมู่
          </button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
          {renderCategorySection("หมวดหมู่รายจ่าย", EXPENSE_CATEGORIES, customExpense)}
          {renderCategorySection("หมวดหมู่รายรับ", INCOME_CATEGORIES, customIncome)}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-[var(--modal-overlay)] flex items-center justify-center z-[200]" onClick={() => setShowModal(false)}>
          <div className="bg-[var(--modal-bg)] rounded-2xl p-6 w-full max-w-md shadow-[var(--shadow-lg)] border border-[var(--card-border)]" onClick={(e) => e.stopPropagation()}>
            <h2 className="text-[17px] font-semibold mb-5 text-[var(--text-primary)]">เพิ่มหมวดหมู่</h2>
            {error && <div className="bg-[var(--danger-bg)] text-[var(--danger-text)] text-[13px] px-3.5 py-2.5 rounded-lg mb-4">{error}</div>}
            <form onSubmit={handleSubmit}>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ประเภท</label>
                <select value={formType} onChange={(e) => setFormType(e.target.value)} className={inputClass}>
                  <option value="expense">รายจ่าย</option>
                  <option value="income">รายรับ</option>
                </select>
              </div>
              <div className="mb-4">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อหมวดหมู่ (ภาษาไทย)</label>
                <input type="text" value={formLabel} onChange={(e) => setFormLabel(e.target.value)} required placeholder="เช่น ค่าสมาชิก, รายได้เสริม" className={inputClass} />
              </div>
              <div className="mb-5">
                <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">รหัส (ภาษาอังกฤษ)</label>
                <input type="text" value={formValue} onChange={(e) => setFormValue(e.target.value)} required placeholder="เช่น subscription, side_income" className={inputClass} />
                <p className="text-[11px] text-[var(--text-tertiary)] mt-1">ใช้ตัวอักษรอังกฤษ ตัวเลข และ _ เท่านั้น</p>
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

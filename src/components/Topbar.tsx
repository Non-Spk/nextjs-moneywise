"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useAmount } from "@/lib/useAmount";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  isPaid: boolean;
}

export default function Topbar({ title }: { title: string }) {
  const formatCurrency = useAmount();
  const [showNotif, setShowNotif] = useState(false);
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch("/api/bills");
      if (!res.ok) return;
      const bills: Bill[] = await res.json();
      const today = new Date().getDate();
      const upcoming = bills.filter((b) => {
        if (b.isPaid) return false;
        const daysUntil = b.dueDay >= today ? b.dueDay - today : 30 - today + b.dueDay;
        return daysUntil <= 7;
      });
      setUpcomingBills(upcoming);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => { fetchBills(); }, [fetchBills]);

  // Close dropdown on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(e.target as Node)) {
        setShowNotif(false);
      }
    }
    if (showNotif) document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, [showNotif]);

  return (
    <div className="bg-[var(--topbar-bg)] backdrop-blur-xl px-8 py-4 flex justify-between items-center border-b border-[var(--topbar-border)] sticky top-0 z-40 transition-colors duration-300">
      <h1 className="text-[17px] font-semibold text-[var(--text-primary)] tracking-tight">{title}</h1>

      <div className="relative" ref={dropdownRef}>
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative p-2 rounded-lg hover:bg-[var(--hover-bg)] transition-colors cursor-pointer"
          aria-label="การแจ้งเตือน"
        >
          <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="var(--text-secondary)" strokeWidth="1.6" strokeLinecap="round" strokeLinejoin="round">
            <path d="M10 2a5 5 0 015 5c0 5 2 6 2 6H3s2-1 2-6a5 5 0 015-5zM8.5 17a1.5 1.5 0 003 0" />
          </svg>
          {upcomingBills.length > 0 && (
            <span className="absolute top-1 right-1 w-[18px] h-[18px] bg-[var(--danger)] text-white text-[10px] rounded-full flex items-center justify-center font-semibold">
              {upcomingBills.length}
            </span>
          )}
        </button>

        {showNotif && (
          <div className="absolute right-0 top-12 w-80 bg-[var(--card-bg)] rounded-xl shadow-[var(--shadow-lg)] border border-[var(--card-border)] z-50 overflow-hidden">
            <div className="px-4 py-3 border-b border-[var(--table-row-border)]">
              <p className="font-semibold text-[13px] text-[var(--text-primary)]">การแจ้งเตือน</p>
            </div>
            {upcomingBills.length === 0 ? (
              <div className="px-4 py-8 text-center text-[13px] text-[var(--text-tertiary)]">
                ไม่มีการแจ้งเตือน
              </div>
            ) : (
              <div className="max-h-[300px] overflow-y-auto">
                {upcomingBills.map((bill) => {
                  const today = new Date().getDate();
                  const daysUntil = bill.dueDay >= today ? bill.dueDay - today : 30 - today + bill.dueDay;
                  return (
                    <div key={bill.id} className="px-4 py-3 border-b border-[var(--table-row-border)] last:border-b-0 hover:bg-[var(--hover-bg)] transition-colors">
                      <div className="flex items-center gap-2">
                        <span className={`w-2 h-2 rounded-full shrink-0 ${daysUntil <= 2 ? "bg-[var(--danger)]" : "bg-[var(--warning)]"}`} />
                        <span className="font-medium text-[13px] text-[var(--text-primary)]">{bill.name}</span>
                      </div>
                      <p className="text-[12px] text-[var(--text-secondary)] mt-1 ml-4">
                        ครบกำหนดวันที่ {bill.dueDay} (อีก {daysUntil} วัน) - {formatCurrency(bill.amount)} บาท
                      </p>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

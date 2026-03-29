"use client";

import { useState, useEffect, useCallback } from "react";

interface Bill {
  id: string;
  name: string;
  amount: number;
  dueDay: number;
  isPaid: boolean;
}

export default function Topbar({ title }: { title: string }) {
  const [showNotif, setShowNotif] = useState(false);
  const [upcomingBills, setUpcomingBills] = useState<Bill[]>([]);

  const fetchBills = useCallback(async () => {
    try {
      const res = await fetch("/api/bills");
      if (!res.ok) return;
      const bills: Bill[] = await res.json();
      const today = new Date().getDate();

      // Filter bills due within 7 days that are unpaid
      const upcoming = bills.filter((b) => {
        if (b.isPaid) return false;
        const daysUntil =
          b.dueDay >= today ? b.dueDay - today : 30 - today + b.dueDay;
        return daysUntil <= 7;
      });
      setUpcomingBills(upcoming);
    } catch {
      // silently fail
    }
  }, []);

  useEffect(() => {
    fetchBills();
  }, [fetchBills]);

  return (
    <div className="bg-white px-8 py-4 flex justify-between items-center shadow-[0_1px_0_rgba(0,0,0,0.1)] sticky top-0 z-40">
      <h1 className="text-xl font-bold text-[var(--dark-text)]">{title}</h1>

      <div className="relative">
        <button
          onClick={() => setShowNotif(!showNotif)}
          className="relative text-lg p-1 cursor-pointer"
          aria-label="การแจ้งเตือน"
        >
          {"\uD83D\uDD14"}
          {upcomingBills.length > 0 && (
            <span className="absolute -top-1 -right-1 bg-[var(--brand-red)] text-white text-[10px] w-4 h-4 rounded-full flex items-center justify-center font-bold">
              {upcomingBills.length}
            </span>
          )}
        </button>

        {/* Notification dropdown */}
        {showNotif && (
          <div className="absolute right-0 top-10 w-80 bg-white rounded-lg shadow-xl border border-gray-100 z-50">
            <div className="px-4 py-3 border-b font-bold text-sm">
              การแจ้งเตือน
            </div>
            {upcomingBills.length === 0 ? (
              <div className="px-4 py-6 text-center text-sm text-[var(--body-text)]">
                ไม่มีการแจ้งเตือน
              </div>
            ) : (
              upcomingBills.map((bill) => {
                const today = new Date().getDate();
                const daysUntil =
                  bill.dueDay >= today
                    ? bill.dueDay - today
                    : 30 - today + bill.dueDay;
                return (
                  <div
                    key={bill.id}
                    className="px-4 py-3 border-b last:border-b-0"
                  >
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          daysUntil <= 2 ? "bg-[var(--danger)]" : "bg-[var(--warning)]"
                        }`}
                      />
                      <span className="font-semibold text-sm">
                        {bill.name}
                      </span>
                    </div>
                    <p className="text-xs text-[var(--body-text)] mt-1">
                      ครบกำหนดวันที่ {bill.dueDay} (อีก {daysUntil} วัน) -{" "}
                      {bill.amount.toLocaleString()} บาท
                    </p>
                  </div>
                );
              })
            )}
          </div>
        )}
      </div>
    </div>
  );
}

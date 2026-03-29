"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "\u25A0" },
  { href: "/transactions", label: "รายรับ-รายจ่าย", icon: "\u270E" },
  { href: "/tax", label: "ภาษี & ลดหย่อน", icon: "\u2605" },
  { href: "/credit-cards", label: "บัตรเครดิต & หนี้สิน", icon: "\u2666" },
  { href: "/bills", label: "บิล & การแจ้งเตือน", icon: "\u23F0" },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();

  return (
    <aside className="w-60 bg-[var(--dark-charcoal)] text-white fixed top-0 left-0 bottom-0 overflow-y-auto z-50 flex flex-col">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <h2 className="text-xl font-bold">
          Money<span className="text-[var(--brand-red)]">Wise</span>
        </h2>
        <p className="text-xs text-white/50 mt-1">
          {session?.user?.name || ""}
        </p>
      </div>

      {/* Navigation */}
      <nav className="flex-1 mt-2">
        <ul className="list-none">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-3 px-5 py-3 text-sm font-medium transition-colors ${
                    isActive
                      ? "bg-white/10 text-white border-l-3 border-[var(--brand-red)]"
                      : "text-white/60 hover:bg-white/5 hover:text-white"
                  }`}
                >
                  <span className="w-5 text-center">{item.icon}</span>
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Logout */}
      <div className="border-t border-white/10 p-2">
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-5 py-3 text-sm text-white/40 hover:text-[var(--brand-red)] transition-colors w-full"
        >
          <span className="w-5 text-center">{"\u2794"}</span>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}

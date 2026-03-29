"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";

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
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-60 bg-[var(--sidebar-bg)] text-white fixed top-0 left-0 bottom-0 overflow-y-auto z-50 flex flex-col transition-colors duration-300">
      {/* Brand */}
      <div className="px-5 py-5 border-b border-white/10">
        <div className="flex items-center gap-3">
          <Image src="/icon.png" alt="MoneyWise" width={36} height={36} />
          <h2 className="text-xl font-bold leading-tight">
            Money<span className="text-[var(--brand-red)]">Wise</span>
          </h2>
        </div>
      </div>

      {/* User info */}
      {session?.user?.name && (
        <div className="px-5 py-3 border-b border-white/10">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 rounded-full bg-[var(--brand-red)] flex items-center justify-center text-xs font-bold">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-xs text-white/60 truncate max-w-[140px]">
              {session.user.name}
            </span>
          </div>
        </div>
      )}

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

      {/* Theme toggle + Logout */}
      <div className="border-t border-white/10 p-4 space-y-3">
        {/* Dark/Light toggle */}
        <div className="flex items-center justify-between px-1">
          <span className="text-xs text-white/50">
            {theme === "dark" ? "Dark Mode" : "Light Mode"}
          </span>
          <button
            onClick={toggleTheme}
            className="relative w-11 h-6 rounded-full transition-colors duration-300 cursor-pointer focus:outline-none"
            style={{
              backgroundColor: theme === "dark" ? "#EB2D2E" : "#555",
            }}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            role="switch"
            aria-checked={theme === "dark"}
          >
            <span
              className="absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform duration-300 flex items-center justify-center text-[10px]"
              style={{
                transform: theme === "dark" ? "translateX(20px)" : "translateX(0)",
              }}
            >
              {theme === "dark" ? "\u263E" : "\u2600"}
            </span>
          </button>
        </div>

        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-3 px-4 py-2 text-sm text-white/40 hover:text-[var(--brand-red)] transition-colors w-full"
        >
          <span className="w-5 text-center">{"\u2794"}</span>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}

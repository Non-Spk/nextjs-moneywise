"use client";

import Image from "next/image";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { signOut, useSession } from "next-auth/react";
import { useTheme } from "./ThemeProvider";

const navItems = [
  { href: "/dashboard", label: "Dashboard", icon: "grid" },
  { href: "/transactions", label: "รายรับ-รายจ่าย", icon: "arrows" },
  { href: "/lendings", label: "ให้ยืม & ทวงหนี้", icon: "people" },
  { href: "/tax", label: "ภาษี & ลดหย่อน", icon: "doc" },
  { href: "/credit-cards", label: "บัตรเครดิต & หนี้สิน", icon: "card" },
  { href: "/bills", label: "บิล & การแจ้งเตือน", icon: "bell" },
  { href: "/settings", label: "ตั้งค่า", icon: "settings" },
];

function NavIcon({ type, isActive }: { type: string; isActive: boolean }) {
  const color = isActive ? "var(--brand-red)" : "var(--sidebar-text-muted)";
  const size = 18;
  switch (type) {
    case "grid":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none">
          <rect x="2" y="2" width="7" height="7" rx="2" fill={color} />
          <rect x="11" y="2" width="7" height="7" rx="2" fill={color} opacity="0.6" />
          <rect x="2" y="11" width="7" height="7" rx="2" fill={color} opacity="0.6" />
          <rect x="11" y="11" width="7" height="7" rx="2" fill={color} opacity="0.4" />
        </svg>
      );
    case "arrows":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M6 4v12M6 4l-3 3M6 4l3 3M14 16V4M14 16l-3-3M14 16l3-3" />
        </svg>
      );
    case "doc":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M4 3h8l4 4v10a1 1 0 01-1 1H5a1 1 0 01-1-1V4a1 1 0 011-1z" />
          <path d="M12 3v4h4M7 10h6M7 13h4" />
        </svg>
      );
    case "card":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <rect x="2" y="4" width="16" height="12" rx="2" />
          <path d="M2 8h16M5 12h3" />
        </svg>
      );
    case "bell":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <path d="M10 2a5 5 0 015 5c0 5 2 6 2 6H3s2-1 2-6a5 5 0 015-5zM8.5 17a1.5 1.5 0 003 0" />
        </svg>
      );
    case "people":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="7" cy="6" r="3" />
          <path d="M2 17v-1a5 5 0 015-5h0" />
          <circle cx="14" cy="7" r="2.5" />
          <path d="M18 17v-1a4 4 0 00-4-4h0" />
        </svg>
      );
    case "settings":
      return (
        <svg width={size} height={size} viewBox="0 0 20 20" fill="none" stroke={color} strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
          <circle cx="10" cy="10" r="2.5" />
          <path d="M10 2v2M10 16v2M2 10h2M16 10h2M4.22 4.22l1.42 1.42M14.36 14.36l1.42 1.42M4.22 15.78l1.42-1.42M14.36 5.64l1.42-1.42" />
        </svg>
      );
    default:
      return null;
  }
}

export default function Sidebar() {
  const pathname = usePathname();
  const { data: session } = useSession();
  const { theme, toggleTheme } = useTheme();

  return (
    <aside className="w-[240px] bg-[var(--sidebar-bg)] fixed top-0 left-0 bottom-0 overflow-y-auto z-50 flex flex-col">
      {/* Brand */}
      <div className="px-5 pt-6 pb-4">
        <div className="flex items-center gap-2.5">
          <Image src="/icon.png" alt="MoneyWise" width={28} height={28} className="rounded-md" />
          <h2 className="text-[15px] font-semibold text-[var(--sidebar-text)] tracking-tight">
            Money<span className="text-[var(--brand-red)]">Wise</span>
          </h2>
        </div>
      </div>

      {/* User info */}
      {session?.user?.name && (
        <div className="px-5 pb-4">
          <div className="flex items-center gap-2.5">
            <div className="w-7 h-7 rounded-full bg-[var(--brand-red)] flex items-center justify-center text-[11px] font-semibold text-white">
              {session.user.name.charAt(0).toUpperCase()}
            </div>
            <span className="text-[13px] text-[var(--sidebar-text-muted)] truncate max-w-[140px]">
              {session.user.name}
            </span>
          </div>
        </div>
      )}

      {/* Divider */}
      <div className="mx-5 h-px bg-[var(--sidebar-divider)]" />

      {/* Navigation */}
      <nav className="flex-1 px-3 pt-4">
        <ul className="list-none space-y-0.5">
          {navItems.map((item) => {
            const isActive = pathname === item.href;
            return (
              <li key={item.href}>
                <Link
                  href={item.href}
                  className={`flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] font-medium transition-all duration-150 ${
                    isActive
                      ? "bg-[var(--sidebar-active)] text-[var(--sidebar-text)]"
                      : "text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--sidebar-text)]"
                  }`}
                >
                  <NavIcon type={item.icon} isActive={isActive} />
                  {item.label}
                </Link>
              </li>
            );
          })}
        </ul>
      </nav>

      {/* Bottom section */}
      <div className="px-3 pb-4 space-y-2">
        {/* Theme toggle */}
        <div className="flex items-center justify-between px-3 py-2">
          <span className="text-[12px] text-[var(--sidebar-text-muted)]">
            {theme === "dark" ? "Dark" : "Light"}
          </span>
          <button
            onClick={toggleTheme}
            className="relative w-10 h-[22px] rounded-full transition-colors duration-200 cursor-pointer focus:outline-none"
            style={{
              backgroundColor: theme === "dark" ? "var(--brand-red)" : "#636366",
            }}
            aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} mode`}
            role="switch"
            aria-checked={theme === "dark"}
          >
            <span
              className="absolute top-[2px] left-[2px] w-[18px] h-[18px] bg-white rounded-full shadow-sm transition-transform duration-200"
              style={{
                transform: theme === "dark" ? "translateX(18px)" : "translateX(0)",
              }}
            />
          </button>
        </div>

        {/* Logout */}
        <button
          onClick={() => signOut({ callbackUrl: "/login" })}
          className="flex items-center gap-2.5 px-3 py-2 rounded-lg text-[13px] text-[var(--sidebar-text-muted)] hover:bg-[var(--sidebar-hover)] hover:text-[var(--brand-red)] transition-all duration-150 w-full"
        >
          <svg width="18" height="18" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.8" strokeLinecap="round" strokeLinejoin="round">
            <path d="M7 17H4a1 1 0 01-1-1V4a1 1 0 011-1h3M13 14l4-4-4-4M17 10H7" />
          </svg>
          ออกจากระบบ
        </button>
      </div>
    </aside>
  );
}

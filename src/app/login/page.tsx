"use client";

import { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";

export default function LoginPage() {
  const router = useRouter();
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  // Login form state
  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

  // Register form state
  const [regName, setRegName] = useState("");
  const [regEmail, setRegEmail] = useState("");
  const [regPassword, setRegPassword] = useState("");
  const [regConfirm, setRegConfirm] = useState("");

  async function handleLogin(e: React.FormEvent) {
    e.preventDefault();
    setError("");
    setLoading(true);

    const result = await signIn("credentials", {
      email: loginEmail,
      password: loginPassword,
      redirect: false,
    });

    setLoading(false);

    if (result?.error) {
      setError("อีเมลหรือรหัสผ่านไม่ถูกต้อง");
      return;
    }

    router.push("/dashboard");
  }

  async function handleRegister(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    if (regPassword !== regConfirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);

    const res = await fetch("/api/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        name: regName,
        email: regEmail,
        password: regPassword,
      }),
    });

    const data = await res.json();
    setLoading(false);

    if (!res.ok) {
      setError(data.error);
      return;
    }

    // Auto-login after registration
    const result = await signIn("credentials", {
      email: regEmail,
      password: regPassword,
      redirect: false,
    });

    if (result?.error) {
      setError("สมัครสำเร็จ กรุณาเข้าสู่ระบบ");
      setTab("login");
      return;
    }

    router.push("/dashboard");
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-[var(--dark-charcoal)] to-[var(--medium-gray)]">
      <div className="bg-white rounded-xl p-10 w-full max-w-md shadow-2xl">
        <h1 className="text-3xl font-bold text-[var(--dark-text)]">
          Money<span className="text-[var(--brand-red)]">Wise</span>
        </h1>
        <p className="text-[var(--body-text)] text-sm mb-6">
          ระบบจัดการเงิน ภาษี บัตรเครดิต
        </p>

        {/* Tabs */}
        <div className="flex border-b-2 border-gray-200 mb-6">
          <button
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
              tab === "login"
                ? "text-[var(--brand-red)] border-[var(--brand-red)]"
                : "text-[var(--body-text)] border-transparent"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 pb-3 text-sm font-semibold border-b-2 -mb-[2px] transition-colors ${
              tab === "register"
                ? "text-[var(--brand-red)] border-[var(--brand-red)]"
                : "text-[var(--body-text)] border-transparent"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {error && (
          <p className="text-[var(--danger)] text-sm mb-4">{error}</p>
        )}

        {/* Login Form */}
        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">อีเมล</label>
              <input
                type="email"
                value={loginEmail}
                onChange={(e) => setLoginEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]/20 outline-none"
                placeholder="email@example.com"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">รหัสผ่าน</label>
              <input
                type="password"
                value={loginPassword}
                onChange={(e) => setLoginPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]/20 outline-none"
                placeholder="รหัสผ่าน"
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--brand-red)] text-white rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        )}

        {/* Register Form */}
        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">ชื่อ-นามสกุล</label>
              <input
                type="text"
                value={regName}
                onChange={(e) => setRegName(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]/20 outline-none"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">อีเมล</label>
              <input
                type="email"
                value={regEmail}
                onChange={(e) => setRegEmail(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]/20 outline-none"
                required
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">รหัสผ่าน</label>
              <input
                type="password"
                value={regPassword}
                onChange={(e) => setRegPassword(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]/20 outline-none"
                placeholder="อย่างน้อย 6 ตัวอักษร"
                required
                minLength={6}
              />
            </div>
            <div className="mb-4">
              <label className="block text-sm font-semibold mb-1">ยืนยันรหัสผ่าน</label>
              <input
                type="password"
                value={regConfirm}
                onChange={(e) => setRegConfirm(e.target.value)}
                className="w-full px-3 py-2.5 border border-gray-200 rounded-md text-sm focus:border-[var(--brand-red)] focus:ring-1 focus:ring-[var(--brand-red)]/20 outline-none"
                required
                minLength={6}
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 bg-[var(--brand-red)] text-white rounded-md font-semibold text-sm hover:opacity-90 transition-opacity disabled:opacity-50"
            >
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

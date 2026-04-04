"use client";

import { useState, Suspense } from "react";
import { signIn } from "next-auth/react";
import { useRouter, useSearchParams } from "next/navigation";

function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const callbackUrl = searchParams.get("callbackUrl") || "/dashboard";
  const [tab, setTab] = useState<"login" | "register">("login");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [loginEmail, setLoginEmail] = useState("");
  const [loginPassword, setLoginPassword] = useState("");

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
    router.push(callbackUrl);
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
      body: JSON.stringify({ name: regName, email: regEmail, password: regPassword }),
    });
    const data = await res.json();
    setLoading(false);
    if (!res.ok) {
      setError(data.error);
      return;
    }
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
    router.push(callbackUrl);
  }

  const inputClass =
    "w-full px-3.5 py-2.5 bg-[var(--input-bg)] border border-[var(--input-border)] rounded-lg text-[14px] text-[var(--text-primary)] placeholder:text-[var(--text-tertiary)] outline-none focus:border-[var(--brand-red)] focus:ring-2 focus:ring-[var(--brand-red-subtle)] transition-all duration-150";

  return (
    <div className="min-h-screen flex items-center justify-center bg-[var(--page-bg)]">
      <div className="bg-[var(--card-bg)] rounded-2xl p-10 w-full max-w-[400px] shadow-[var(--shadow-lg)] border border-[var(--card-border)]">
        <h1 className="text-2xl font-bold text-[var(--text-primary)] tracking-tight">
          Money<span className="text-[var(--brand-red)]">Wise</span>
        </h1>
        <p className="text-[var(--text-secondary)] text-[13px] mt-1 mb-8">
          ระบบจัดการเงิน ภาษี บัตรเครดิต
        </p>

        {/* Tabs */}
        <div className="flex bg-[var(--bg-subtle)] rounded-lg p-1 mb-6">
          <button
            onClick={() => { setTab("login"); setError(""); }}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-200 ${
              tab === "login"
                ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            เข้าสู่ระบบ
          </button>
          <button
            onClick={() => { setTab("register"); setError(""); }}
            className={`flex-1 py-2 text-[13px] font-medium rounded-md transition-all duration-200 ${
              tab === "register"
                ? "bg-[var(--card-bg)] text-[var(--text-primary)] shadow-[var(--shadow-sm)]"
                : "text-[var(--text-secondary)] hover:text-[var(--text-primary)]"
            }`}
          >
            สมัครสมาชิก
          </button>
        </div>

        {error && (
          <div className="bg-[var(--danger-bg)] text-[var(--danger-text)] text-[13px] px-3.5 py-2.5 rounded-lg mb-4">
            {error}
          </div>
        )}

        {tab === "login" && (
          <form onSubmit={handleLogin}>
            <div className="mb-4">
              <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">อีเมล</label>
              <input type="email" value={loginEmail} onChange={(e) => setLoginEmail(e.target.value)}
                className={inputClass} placeholder="email@example.com" required />
            </div>
            <div className="mb-6">
              <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">รหัสผ่าน</label>
              <input type="password" value={loginPassword} onChange={(e) => setLoginPassword(e.target.value)}
                className={inputClass} placeholder="รหัสผ่าน" required />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[var(--brand-red)] text-white rounded-lg font-medium text-[14px] hover:bg-[var(--brand-red-hover)] transition-colors duration-150 disabled:opacity-50">
              {loading ? "กำลังเข้าสู่ระบบ..." : "เข้าสู่ระบบ"}
            </button>
          </form>
        )}

        {tab === "register" && (
          <form onSubmit={handleRegister}>
            <div className="mb-4">
              <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ชื่อ-นามสกุล</label>
              <input type="text" value={regName} onChange={(e) => setRegName(e.target.value)}
                className={inputClass} required />
            </div>
            <div className="mb-4">
              <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">อีเมล</label>
              <input type="email" value={regEmail} onChange={(e) => setRegEmail(e.target.value)}
                className={inputClass} required />
            </div>
            <div className="mb-4">
              <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">รหัสผ่าน</label>
              <input type="password" value={regPassword} onChange={(e) => setRegPassword(e.target.value)}
                className={inputClass} placeholder="อย่างน้อย 8 ตัวอักษร" required minLength={8} maxLength={128} />
            </div>
            <div className="mb-6">
              <label className="block text-[13px] font-medium mb-1.5 text-[var(--text-primary)]">ยืนยันรหัสผ่าน</label>
              <input type="password" value={regConfirm} onChange={(e) => setRegConfirm(e.target.value)}
                className={inputClass} required minLength={8} maxLength={128} />
            </div>
            <button type="submit" disabled={loading}
              className="w-full py-2.5 bg-[var(--brand-red)] text-white rounded-lg font-medium text-[14px] hover:bg-[var(--brand-red-hover)] transition-colors duration-150 disabled:opacity-50">
              {loading ? "กำลังสมัคร..." : "สมัครสมาชิก"}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}

export default function LoginPage() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}

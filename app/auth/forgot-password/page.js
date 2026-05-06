"use client";

import { Suspense, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { ArrowLeft, ArrowRight, KeyRound, Mail, Moon, Pickaxe, Sun } from "lucide-react";
import { useSettings } from "@/components/SettingsProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";

function ForgotPasswordContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token") || "";
  const emailFromUrl = searchParams.get("email") || "";
  const isResetMode = Boolean(token);
  const settings = useSettings();
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const [email, setEmail] = useState(emailFromUrl);
  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestReset = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      setError("กรุณากรอกอีเมลให้ถูกต้อง");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/forgot-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "ไม่สามารถส่งลิงก์รีเซ็ตรหัสผ่านได้");
        return;
      }

      setMessage(data.message || "หากพบอีเมลนี้ในระบบ เราได้ส่งลิงก์รีเซ็ตรหัสผ่านแล้ว");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  const resetPassword = async (event) => {
    event.preventDefault();
    setError("");
    setMessage("");

    if (!email || !password || !confirm) {
      setError("กรุณากรอกข้อมูลให้ครบ");
      return;
    }
    if (password.length < 8) {
      setError("รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร");
      return;
    }
    if (password !== confirm) {
      setError("รหัสผ่านไม่ตรงกัน");
      return;
    }

    setLoading(true);
    try {
      const response = await fetch("/api/auth/reset-password", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ token, email, password }),
      });
      const data = await response.json();

      if (!response.ok) {
        setError(data.message || "ไม่สามารถรีเซ็ตรหัสผ่านได้");
        return;
      }

      setMessage(data.message || "เปลี่ยนรหัสผ่านสำเร็จ");
      setPassword("");
      setConfirm("");
    } catch {
      setError("เกิดข้อผิดพลาด กรุณาลองใหม่อีกครั้ง");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#050505] text-gray-900 dark:text-white flex items-center justify-center px-6 py-12 relative transition-colors">
      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-gray-200 dark:border-[#1e2330] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111318] transition-all bg-white/70 dark:bg-[#0a0c10]/70 backdrop-blur-md shadow-sm"
      >
        {hydrated ? (resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
      </button>

      <div className="w-full max-w-[430px]">
        <Link href="/" className="mx-auto mb-10 flex w-fit flex-col items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,217,126,0.35)]">
            <Pickaxe size={24} />
          </div>
          <span className="font-syne font-extrabold text-2xl tracking-tight">{settings.siteName}</span>
        </Link>

        <div className="mb-8 text-center">
          <h1 className="font-syne text-3xl font-bold tracking-tight mb-3">
            {isResetMode ? "ตั้งรหัสผ่านใหม่" : "ลืมรหัสผ่าน?"}
          </h1>
          <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">
            {isResetMode
              ? "กรอกรหัสผ่านใหม่ของคุณ ลิงก์นี้หมดอายุภายใน 1 ชั่วโมง"
              : "กรอกอีเมลบัญชีของคุณ แล้วเราจะส่งลิงก์รีเซ็ตรหัสผ่านให้"}
          </p>
        </div>

        {error && (
          <div className="mb-5 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold">
            {error}
          </div>
        )}

        {message && (
          <div className="mb-5 px-4 py-3.5 rounded-xl bg-emerald-50 dark:bg-emerald-500/10 border border-emerald-200 dark:border-emerald-500/20 text-emerald-700 dark:text-emerald-400 text-sm font-semibold">
            {message}
          </div>
        )}

        <form onSubmit={isResetMode ? resetPassword : requestReset} className="space-y-4">
          <div className="space-y-1.5">
            <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1">อีเมล</label>
            <div className="relative">
              <Mail size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#5c677d]" />
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={Boolean(emailFromUrl)}
                placeholder="you@example.com"
                className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border border-gray-200 dark:border-[#1e2330] shadow-sm focus:outline-none focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 transition-all text-[15px] font-medium disabled:opacity-70"
              />
            </div>
          </div>

          {isResetMode && (
            <>
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1">รหัสผ่านใหม่</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#5c677d]" />
                  <input
                    type="password"
                    value={password}
                    onChange={(event) => setPassword(event.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border border-gray-200 dark:border-[#1e2330] shadow-sm focus:outline-none focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 transition-all text-[15px] font-medium"
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1">ยืนยันรหัสผ่านใหม่</label>
                <div className="relative">
                  <KeyRound size={18} className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-400 dark:text-[#5c677d]" />
                  <input
                    type="password"
                    value={confirm}
                    onChange={(event) => setConfirm(event.target.value)}
                    placeholder="••••••••"
                    className="w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border border-gray-200 dark:border-[#1e2330] shadow-sm focus:outline-none focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 transition-all text-[15px] font-medium"
                  />
                </div>
              </div>
            </>
          )}

          <button
            type="submit"
            disabled={loading}
            className="group relative w-full py-4 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_20px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:hover:scale-100"
          >
            <span className="relative flex items-center justify-center gap-2">
              {loading ? (
                <span className="w-5 h-5 border-2 border-white/30 dark:border-current/30 border-t-white dark:border-t-current rounded-full animate-spin" />
              ) : (
                <>
                  {isResetMode ? "เปลี่ยนรหัสผ่าน" : "ส่งลิงก์รีเซ็ต"}
                  <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" />
                </>
              )}
            </span>
          </button>
        </form>

        <Link href="/auth/login" className="mt-6 flex items-center justify-center gap-2 text-sm font-bold text-gray-500 hover:text-[#10d97e] dark:text-[#8892a4] dark:hover:text-[#10d97e] transition-colors">
          <ArrowLeft size={16} />
          กลับไปหน้าเข้าสู่ระบบ
        </Link>
      </div>
    </div>
  );
}

export default function ForgotPasswordPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#050505]" />}>
      <ForgotPasswordContent />
    </Suspense>
  );
}

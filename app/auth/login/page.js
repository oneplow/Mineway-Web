"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Sun, Moon, User } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";

export default function LoginPage() {
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();

  React.useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.identifier) errs.identifier = "กรุณากรอก Username หรือ อีเมล";
    if (!formData.password) errs.password = "กรุณากรอกรหัสผ่าน";
    return errs;
  };

  const handleLoginSubmit = async () => {
    setGlobalError("");
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      setGlobalError("กรุณากรอกข้อมูลให้ครบถ้วน");
      return;
    }

    setLoading(true);

    try {
      const res = await signIn("credentials", {
        redirect: false,
        identifier: formData.identifier,
        password: formData.password,
      });

      if (res?.error) {
        setGlobalError("Username/อีเมล หรือรหัสผ่านไม่ถูกต้อง");
        setFieldErrors({ identifier: " ", password: " " });
        setLoading(false);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/auth/login');
        }
      } else if (res?.ok) {
        router.push("/overview");
      }
    } catch (err) {
      setGlobalError("เกิดข้อผิดพลาดที่ไม่รู้จัก");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#f8fafc] dark:bg-[#0a0c0f] flex flex-col items-center justify-center p-4 transition-colors duration-300">

      <button
        type="button"
        onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-gray-200 dark:border-[#1e2330] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111318] transition-all bg-white dark:bg-[#111318]"
      >
        {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
      </button>

      <div className="w-full max-w-md p-8 rounded-2xl border border-gray-200 dark:border-[#1e2330] shadow-sm dark:shadow-[0_8px_30px_rgb(0,0,0,0.4)] bg-white dark:bg-[#111318] relative z-10">
        <div className="text-center mb-8">
          <Link href="/" className="inline-block mb-6">
            <div className="w-10 h-10 mx-auto rounded-lg bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white pb-1 shadow-[0_0_15px_rgba(16,217,126,0.5)]">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                <path d="M14.5 2l5 5" />
                <path d="M2 22l10-10" />
                <path d="M18.5 2l-7 7" />
                <path d="M14 12l-3 3" />
                <path d="M20 18l-2 2" />
                <path d="M12 20l-2 2" />
              </svg>
            </div>
          </Link>
          <h1 className="font-syne text-2xl font-bold text-gray-900 dark:text-[#e8ecf4] mb-2 tracking-tight">ยินดีต้อนรับกลับ</h1>
          <p className="text-sm text-gray-500 dark:text-[#8892a4]">เข้าสู่ระบบเพื่อจัดการเซิร์ฟเวอร์ของคุณ</p>
        </div>

        {globalError && (
          <div className="mb-6 px-4 py-3 rounded-xl bg-red-500/10 border border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold text-center">
            {globalError}
          </div>
        )}

        <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }} className="space-y-4" noValidate>
          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <User size={18} className={fieldErrors.identifier ? "text-red-500" : "text-gray-400 dark:text-[#4a5568]"} />
              </div>
              <input
                type="text"
                name="identifier"
                placeholder="Username หรือ อีเมล"
                value={formData.identifier}
                onChange={handleChange}
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0a0c0f] border focus:outline-none transition-all text-gray-900 dark:text-[#e8ecf4] placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.identifier
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                    : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e]/50 focus:ring-1 focus:ring-[#10d97e]/50"
                  }`}
              />
            </div>
            {fieldErrors.identifier && fieldErrors.identifier !== " " && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.identifier}</p>}
          </div>

          <div>
            <div className="relative">
              <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                <Lock size={18} className={fieldErrors.password ? "text-red-500" : "text-gray-400 dark:text-[#4a5568]"} />
              </div>
              <input
                type="password"
                name="password"
                placeholder="รหัสผ่าน"
                value={formData.password}
                onChange={handleChange}
                className={`w-full pl-11 pr-4 py-3 rounded-xl bg-gray-50 dark:bg-[#0a0c0f] border focus:outline-none transition-all text-gray-900 dark:text-[#e8ecf4] placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.password
                    ? "border-red-500/50 focus:border-red-500/50 focus:ring-1 focus:ring-red-500/50"
                    : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e]/50 focus:ring-1 focus:ring-[#10d97e]/50"
                  }`}
              />
            </div>
            {fieldErrors.password && fieldErrors.password !== " " && <p className="text-red-500 text-xs mt-1.5 ml-1 font-medium">{fieldErrors.password}</p>}
          </div>

          <div className="pt-2">
            <button
              type="submit"
              disabled={loading}
              className="w-full py-3 px-4 rounded-xl bg-[#10d97e] hover:brightness-110 text-white dark:text-[#0a0c0f] font-semibold transition-all flex items-center justify-center gap-2 disabled:opacity-70 disabled:cursor-not-allowed"
            >
              <span>{loading ? "กำลังดำเนินการ..." : "เข้าสู่ระบบ"}</span>
              {!loading && <ArrowRight size={16} />}
            </button>
          </div>
        </form>

        <div className="my-6 flex items-center">
          <div className="flex-1 border-t border-gray-200 dark:border-[#1e2330]"></div>
          <span className="px-4 text-xs text-gray-400 dark:text-[#4a5568] uppercase tracking-widest font-medium">Or</span>
          <div className="flex-1 border-t border-gray-200 dark:border-[#1e2330]"></div>
        </div>

        <button
          onClick={() => signIn("google", { callbackUrl: "/overview" })}
          type="button"
          className="flex items-center justify-center w-full py-3 px-4 rounded-xl bg-gray-50 dark:bg-[#0a0c0f] border border-gray-200 dark:border-[#1e2330] hover:bg-gray-100 dark:hover:border-gray-600 transition-all text-sm font-semibold text-gray-700 dark:text-[#8892a4]"
        >
          <svg className="w-4 h-4 mr-3" viewBox="0 0 24 24">
            <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
            <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
            <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
            <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
          </svg>
          Google
        </button>

        <p className="mt-8 text-center text-sm text-gray-500 dark:text-[#8892a4]">
          ยังไม่มีบัญชีใช่หรือไม่?{" "}
          <Link href="/auth/register" className="text-[#10d97e] font-medium hover:underline">
            สร้างบัญชีใหม่
          </Link>
        </p>
      </div>
    </div>
  );
}

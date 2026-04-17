"use client";

import React, { useState, useEffect } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, User, ArrowRight, Sun, Moon, Pickaxe, AtSign, Sparkles } from "lucide-react";
import { useTheme } from "next-themes";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { Turnstile } from "@marsidev/react-turnstile";

export default function RegisterPage() {
  const [globalError, setGlobalError] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [mounted, setMounted] = useState(false);
  const router = useRouter();
  const { theme, setTheme } = useTheme();
  const settings = useSettings();

  useEffect(() => {
    setMounted(true);
  }, []);

  const [formData, setFormData] = useState({
    username: "",
    email: "",
    password: "",
    confirm: "",
    turnstileToken: "",
  });

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
    if (fieldErrors[e.target.name]) {
      setFieldErrors({ ...fieldErrors, [e.target.name]: null });
    }
  };

  const validate = () => {
    const errs = {};
    if (!formData.username) errs.username = "กรุณากรอก Username";
    else if (!/^[a-zA-Z0-9_]{3,20}$/.test(formData.username)) errs.username = "ใช้ได้เฉพาะ a-z, 0-9, _ (3-20 ตัว)";
    if (!formData.email) errs.email = "กรุณากรอกอีเมล";
    else if (!/^\S+@\S+\.\S+$/.test(formData.email)) errs.email = "รูปแบบอีเมลไม่ถูกต้อง";
    if (!formData.password) errs.password = "กรุณากรอกรหัสผ่าน";
    else if (formData.password.length < 8) errs.password = "รหัสผ่านต้องมีอย่างน้อย 8 ตัวอักษร";
    if (!formData.confirm) errs.confirm = "กรุณายืนยันรหัสผ่าน";
    else if (formData.password !== formData.confirm) errs.confirm = "รหัสผ่านไม่ตรงกัน";
    return errs;
  };

  const handleRegisterSubmit = async () => {
    setGlobalError("");
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          username: formData.username,
          email: formData.email,
          password: formData.password,
          turnstileToken: formData.turnstileToken
        }),
      });

      let data;
      try {
        data = await res.json();
      } catch {
        data = { message: "Internal server error" };
      }

      if (!res.ok) {
        setGlobalError(data.message || "การสมัครสมาชิกขัดข้อง");
        setLoading(false);
      } else {
        const loginRes = await signIn("credentials", {
          redirect: false,
          identifier: formData.email,
          password: formData.password,
        });

        if (!loginRes?.error) {
          router.push("/overview");
        } else {
          setGlobalError("สร้างบัญชีสำเร็จ แต่เข้าระบบอัตโนมัติล้มเหลว");
          setLoading(false);
        }
      }
    } catch (err) {
      setGlobalError("เกิดข้อผิดพลาดที่ไม่รู้จัก");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex lg:flex-row-reverse bg-white dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative">

      {/* Decorative Blob absolute to screen */}
      <div className="absolute top-[-10%] right-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none md:hidden" style={{ backgroundColor: 'rgba(59, 130, 246, 0.1)' }}></div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">

        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 p-2.5 rounded-xl border border-gray-200 dark:border-[#1e2330] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111318] transition-all bg-white/50 dark:bg-[#0a0c10]/50 backdrop-blur-md shadow-sm"
        >
          {mounted ? (theme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
        </button>

        <div className="w-full max-w-[420px] animate-fade-in mt-12 mb-8">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,217,126,0.4)]">
                <Pickaxe size={24} />
              </div>
              <span className="font-syne font-extrabold text-2xl tracking-tight text-gray-900 dark:text-white">{settings.siteName}</span>
            </Link>
          </div>

          <div className="mb-8 text-center lg:text-left">
            <div className="inline-flex lg:hidden items-center gap-2 px-3 py-1.5 rounded-full bg-[#10d97e]/10 border border-[#10d97e]/20 w-fit mb-4">
              <Sparkles size={14} className="text-[#10d97e]" />
              <span className="text-xs font-semibold tracking-wider uppercase text-[#10d97e]">Get Started</span>
            </div>
            <h2 className="font-syne text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">สร้างบัญชีฟรี</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">เริ่มต้นโฮสต์เซิร์ฟเวอร์ของคุณในไม่กี่วินาที ไม่ต้องใช้บัตรเครดิต</p>
          </div>

          {globalError && (
            <div className="mb-6 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold flex items-center gap-3 animate-shake">
              <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0"></div>
              {globalError}
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleRegisterSubmit(); }} className="space-y-4" noValidate>

            {/* Input Group: Username */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1 flex items-center justify-between">
                <span>Username</span>
                {fieldErrors.username && fieldErrors.username !== " " && <span className="text-xs text-red-500 font-medium">{fieldErrors.username}</span>}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                  <AtSign size={18} className={`transition-colors ${fieldErrors.username ? "text-red-500" : "text-gray-400 dark:text-[#5c677d] group-focus-within:text-[#10d97e]"}`} />
                </div>
                <input
                  type="text"
                  name="username"
                  placeholder="steve_craft"
                  value={formData.username}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border shadow-sm focus:outline-none transition-all text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.username
                    ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                />
              </div>
            </div>

            {/* Input Group: Email */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1 flex items-center justify-between">
                <span>อีเมล</span>
                {fieldErrors.email && fieldErrors.email !== " " && <span className="text-xs text-red-500 font-medium">{fieldErrors.email}</span>}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                  <Mail size={18} className={`transition-colors ${fieldErrors.email ? "text-red-500" : "text-gray-400 dark:text-[#5c677d] group-focus-within:text-[#10d97e]"}`} />
                </div>
                <input
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={formData.email}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border shadow-sm focus:outline-none transition-all text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.email
                    ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                    : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                />
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {/* Input Group: Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1 flex items-center justify-between truncate">
                  <span>รหัสผ่าน</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                    <Lock size={18} className={`transition-colors ${fieldErrors.password ? "text-red-500" : "text-gray-400 dark:text-[#5c677d] group-focus-within:text-[#10d97e]"}`} />
                  </div>
                  <input
                    type="password"
                    name="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border shadow-sm focus:outline-none transition-all text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.password
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                  />
                </div>
                {fieldErrors.password && fieldErrors.password !== " " && <p className="text-xs text-red-500 font-medium ml-1 mt-1 leading-tight">{fieldErrors.password}</p>}
              </div>

              {/* Input Group: Confirm Password */}
              <div className="space-y-1.5">
                <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1 flex items-center justify-between truncate">
                  <span>ยืนยันรหัสผ่าน</span>
                </label>
                <div className="relative group">
                  <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                    <Lock size={18} className={`transition-colors ${fieldErrors.confirm ? "text-red-500" : "text-gray-400 dark:text-[#5c677d] group-focus-within:text-[#10d97e]"}`} />
                  </div>
                  <input
                    type="password"
                    name="confirm"
                    placeholder="••••••••"
                    value={formData.confirm}
                    onChange={handleChange}
                    className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border shadow-sm focus:outline-none transition-all text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.confirm
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 hover:border-gray-300 dark:hover:border-gray-700"
                      }`}
                  />
                </div>
                {fieldErrors.confirm && fieldErrors.confirm !== " " && <p className="text-xs text-red-500 font-medium ml-1 mt-1 leading-tight">{fieldErrors.confirm}</p>}
              </div>
            </div>

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div className="pt-2 sm:col-span-2 flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  options={{ theme: theme === "dark" ? "dark" : "light" }}
                  onSuccess={(token) => setFormData({ ...formData, turnstileToken: token })}
                  onError={() => setGlobalError("ระบบตรวจสอบบอทขัดข้อง กรุณารีเฟรชหน้าเว็บ")}
                />
              </div>
            )}

            <div className="pt-4">
              <button
                type="submit"
                disabled={loading}
                className="group relative w-full py-4 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 font-bold overflow-hidden transition-all hover:scale-[1.02] active:scale-[0.98] shadow-[0_8px_20px_rgba(0,0,0,0.1)] dark:shadow-[0_8px_20px_rgba(255,255,255,0.1)] disabled:opacity-70 disabled:hover:scale-100 disabled:cursor-not-allowed"
              >
                {/* Button Hover Effect Layer */}
                <div className="absolute inset-0 w-full h-full bg-gradient-to-r from-[#10d97e] to-[#0ea865] opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

                <span className="relative flex items-center justify-center gap-2">
                  {loading ? (
                    <div className="w-5 h-5 border-2 border-white/30 dark:border-current/30 border-t-white dark:border-t-current rounded-full animate-spin"></div>
                  ) : (
                    <>ยอมรับเงื่อนไขและสมัคร <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
                  )}
                </span>
              </button>
            </div>
          </form>

          <div className="my-8 flex items-center">
            <div className="flex-1 border-t border-gray-200 dark:border-[#1e2330]"></div>
            <span className="px-4 text-[11px] text-gray-400 uppercase tracking-widest font-black">หรือดำเนินการด้วย</span>
            <div className="flex-1 border-t border-gray-200 dark:border-[#1e2330]"></div>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/overview" })}
            type="button"
            className="flex items-center justify-center w-full py-3.5 px-4 rounded-xl bg-white dark:bg-[#0a0c10] border border-gray-200 dark:border-[#1e2330] hover:bg-gray-50 dark:hover:border-gray-600 shadow-sm transition-all text-[14px] font-bold text-gray-700 dark:text-[#e8ecf4] hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-5 h-5 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>

          <p className="mt-10 text-center text-sm font-medium text-gray-500 dark:text-[#8892a4]">
            มีบัญชีอยู่แล้วใช่ไหม?{" "}
            <Link href="/auth/login" className="text-blue-500 font-bold hover:text-blue-600 hover:underline underline-offset-4 decoration-2">
              เข้าสู่ระบบเลย
            </Link>
          </p>
        </div>
      </div>

      {/* Left Panel: Visual/Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[45%] relative items-center justify-center bg-black overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(to bottom right, #0a0c10, #0f1a15, #0a0c10)' }}></div>
        <div className="absolute top-1/4 right-1/4 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse z-0" style={{ backgroundColor: 'rgba(16, 217, 126, 0.2)' }}></div>
        <div className="absolute bottom-1/4 left-1/4 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-1000 z-0" style={{ backgroundColor: 'rgba(14, 168, 101, 0.1)' }}></div>

        {/* Abstract Grid Overlay */}
        <div
          className="absolute inset-0 z-0 opacity-10"
          style={{ backgroundImage: 'linear-gradient(rgba(255,255,255,0.1) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.1) 1px, transparent 1px)', backgroundSize: '40px 40px' }}
        ></div>

        <div className="relative z-10 w-full max-w-lg px-12 flex flex-col text-white">
          <Link href="/" className="inline-flex items-center gap-3 mb-12 hover:opacity-80 transition-opacity w-fit">
            <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,217,126,0.3)]">
              <Pickaxe size={20} />
            </div>
            <span className="font-syne font-extrabold text-2xl tracking-tight">{settings.siteName}</span>
          </Link>

          <div className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/5 border border-white/10 w-fit mb-6 backdrop-blur-md">
            <Sparkles size={14} className="text-[#10d97e]" />
            <span className="text-xs font-semibold tracking-wider uppercase text-gray-300">Join the Community</span>
          </div>

          <h1 className="font-syne text-5xl font-bold leading-[1.1] mb-6 tracking-tight">
            Start Hosting <br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10d97e] to-[#38ef7d]">In Seconds.</span>
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-md font-medium">
            Join thousands of players hosting their servers to the world without complicated network configs.
          </p>

          <div className="mt-16 grid grid-cols-2 gap-6">
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#10d97e] mb-4" style={{ backgroundColor: 'rgba(16, 217, 126, 0.2)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>
              </div>
              <h3 className="text-white font-bold mb-1">Instant Setup</h3>
              <p className="text-gray-400 text-xs leading-relaxed">Get your domain and port instantly without touching your router.</p>
            </div>
            <div className="bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-5">
              <div className="w-10 h-10 rounded-full flex items-center justify-center text-[#10d97e] mb-4" style={{ backgroundColor: 'rgba(14, 168, 101, 0.2)' }}>
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" /></svg>
              </div>
              <h3 className="text-white font-bold mb-1">DDoS Protected</h3>
              <p className="text-gray-400 text-xs leading-relaxed">Enterprise-grade network mitigation pre-configured.</p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
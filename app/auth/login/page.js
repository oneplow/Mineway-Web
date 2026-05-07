"use client";

import React, { useState } from "react";
import { signIn } from "next-auth/react";
import { useRouter } from "next/navigation";
import { Mail, Lock, ArrowRight, Sun, Moon, User, Pickaxe, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";
import { Turnstile } from "@marsidev/react-turnstile";

export default function LoginPage() {
  const [globalError, setGlobalError] = useState("");
  const [unverifiedEmail, setUnverifiedEmail] = useState("");
  const [fieldErrors, setFieldErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const router = useRouter();
  const { resolvedTheme, setTheme } = useTheme();
  const settings = useSettings();
  const hydrated = useHydrated();

  const [formData, setFormData] = useState({
    identifier: "",
    password: "",
    turnstileToken: "",
  });

  const redirectToVerifyEmail = (email) => {
    const targetEmail = email?.trim() || formData.identifier?.trim();
    const targetUrl = targetEmail
      ? `/auth/verify-email?email=${encodeURIComponent(targetEmail)}`
      : "/auth/verify-email";

    if (typeof window !== "undefined") {
      window.location.assign(targetUrl);
      return;
    }

    router.push(targetUrl);
  };

  const getSafeCallbackUrl = () => {
    const callbackUrl = new URLSearchParams(window.location.search).get("callbackUrl");
    if (!callbackUrl) {
      return "/overview";
    }

    try {
      const target = new URL(callbackUrl, window.location.origin);
      if (target.origin !== window.location.origin) {
        return "/overview";
      }

      return `${target.pathname}${target.search}${target.hash}`;
    } catch {
      return callbackUrl.startsWith("/") && !callbackUrl.startsWith("//")
        ? callbackUrl
        : "/overview";
    }
  };

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
    setUnverifiedEmail("");
    setFieldErrors({});

    const errs = validate();
    if (Object.keys(errs).length > 0) {
      setFieldErrors(errs);
      return;
    }

    setLoading(true);

    try {
      // Step 1: Pre-check credentials via custom API (returns specific error codes)
      const preCheck = await fetch("/api/precheck-login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          identifier: formData.identifier,
          password: formData.password,
          turnstileToken: formData.turnstileToken,
        }),
      });

      const preCheckData = await preCheck.json();

      if (preCheckData.requiresVerification) {
        setLoading(false);
        redirectToVerifyEmail(preCheckData.email);
        return;
      }

      if (!preCheck.ok) {
        if (preCheckData.error === "unverified_email") {
          setGlobalError("บัญชีของคุณยังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบกล่องจดหมายและยืนยันอีเมลก่อนเข้าสู่ระบบ");
          setUnverifiedEmail(preCheckData.email || formData.identifier);
        } else {
          setGlobalError(preCheckData.message || "ชื่อผู้ใช้งาน, อีเมล หรือ รหัสผ่านไม่ถูกต้อง");
        }
        setFieldErrors({ identifier: " ", password: " " });
        setLoading(false);
        return;
      }

      // Step 2: Pre-check passed — now sign in via next-auth
      const res = await signIn("credentials", {
        redirect: false,
        identifier: formData.identifier,
        password: formData.password,
      });

      if (res?.error) {
        setGlobalError("ชื่อผู้ใช้งาน, อีเมล หรือ รหัสผ่านไม่ถูกต้อง");
        setFieldErrors({ identifier: " ", password: " " });
        setLoading(false);
        if (typeof window !== 'undefined') {
          window.history.replaceState(null, '', '/auth/login');
        }
      } else if (res?.ok) {
        window.location.replace(getSafeCallbackUrl());
      }
    } catch (err) {
      setGlobalError("เกิดข้อผิดพลาดที่ไม่รู้จัก");
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen w-full flex bg-white dark:bg-[#050505] transition-colors duration-500 overflow-hidden relative">
      
      {/* Decorative Blob absolute to screen */}
      <div className="absolute top-[-10%] left-[-10%] w-[40%] h-[40%] rounded-full blur-[120px] pointer-events-none md:hidden" style={{ backgroundColor: 'rgba(16, 217, 126, 0.2)' }}></div>

      {/* Left Panel: Visual/Branding (Hidden on Mobile) */}
      <div className="hidden lg:flex w-[45%] relative items-center justify-center bg-black overflow-hidden">
        {/* Animated Gradient Background */}
        <div className="absolute inset-0 z-0" style={{ backgroundImage: 'linear-gradient(to bottom right, #0a0c10, #0f1a15, #0a0c10)' }}></div>
        <div className="absolute top-1/4 left-1/4 w-[400px] h-[400px] rounded-full blur-[100px] animate-pulse z-0" style={{ backgroundColor: 'rgba(16, 217, 126, 0.2)' }}></div>
        <div className="absolute bottom-1/4 right-1/4 w-[300px] h-[300px] rounded-full blur-[80px] animate-pulse delay-1000 z-0" style={{ backgroundColor: 'rgba(14, 168, 101, 0.1)' }}></div>
        
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
            <span className="text-xs font-semibold tracking-wider uppercase text-gray-300">Welcome Back</span>
          </div>

          <h1 className="font-syne text-5xl font-bold leading-[1.1] mb-6 tracking-tight">
            Manage your <br/>
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-[#10d97e] to-[#38ef7d]">Server Tunnel</span><br/>
            Seamlessly.
          </h1>
          <p className="text-lg text-gray-400 leading-relaxed max-w-md font-medium">
            {settings.siteTagline || "Expose your Minecraft server to the internet through our secure and high-performance VPS tunnel."}
          </p>

          {/* Testimonial / Features snippet */}
          <div className="mt-16 bg-white/5 border border-white/10 backdrop-blur-md rounded-2xl p-6">
            <div className="flex gap-1 mb-3">
              {[1,2,3,4,5].map(i => <div key={i} className="text-[#10d97e]">★</div>)}
            </div>
            <p className="text-gray-300 italic text-sm mb-4">&quot;The fastest and most reliable way to host my servers for friends without exposing my IP address.&quot;</p>
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-xs font-bold">A</div>
              <div className="text-xs">
                <div className="font-bold text-white">Active User</div>
                <div className="text-gray-500">Premium Plan</div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Right Panel: Form */}
      <div className="flex-1 flex flex-col items-center justify-center p-6 sm:p-12 relative z-10">
        
        {/* Theme Toggle */}
        <button
          type="button"
          onClick={() => setTheme(resolvedTheme === 'dark' ? 'light' : 'dark')}
          className="absolute top-6 right-6 p-2.5 rounded-xl border border-gray-200 dark:border-[#1e2330] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111318] transition-all bg-white/50 dark:bg-[#0a0c10]/50 backdrop-blur-md shadow-sm"
        >
          {hydrated ? (resolvedTheme === 'dark' ? <Sun size={18} /> : <Moon size={18} />) : <Sun size={18} className="opacity-0" />}
        </button>

        <div className="w-full max-w-[420px] animate-fade-in">
          {/* Mobile Logo */}
          <div className="lg:hidden text-center mb-10">
            <Link href="/" className="inline-flex flex-col items-center gap-3">
              <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-[#10d97e] to-[#0ea865] flex items-center justify-center text-white shadow-[0_0_20px_rgba(16,217,126,0.4)]">
                <Pickaxe size={24} />
              </div>
              <span className="font-syne font-extrabold text-2xl tracking-tight text-gray-900 dark:text-white">{settings.siteName}</span>
            </Link>
          </div>

          <div className="mb-10 text-center lg:text-left">
            <h2 className="font-syne text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">เข้าสู่ระบบ</h2>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">ใส่อีเมลและรหัสผ่านเพื่อเข้าสู่แผงควบคุมของคุณ</p>
          </div>

          {globalError && (
            <div className="mb-6 px-4 py-3.5 rounded-xl bg-red-50 dark:bg-red-500/10 border border-red-200 dark:border-red-500/20 text-red-600 dark:text-red-400 text-sm font-semibold animate-shake">
              <div className="flex items-start gap-3">
                <div className="w-1.5 h-1.5 rounded-full bg-red-500 shrink-0 mt-2"></div>
                <div className="flex-1">
                  <p>{globalError}</p>
                  {unverifiedEmail && (
                    <Link
                      href={`/auth/verify-email?email=${encodeURIComponent(unverifiedEmail)}`}
                      className="mt-3 inline-flex text-xs font-bold text-red-700 dark:text-red-300 underline underline-offset-4"
                    >
                      ไปหน้ายืนยันอีเมล / ส่งลิงก์ใหม่
                    </Link>
                  )}
                </div>
              </div>
            </div>
          )}

          <form onSubmit={(e) => { e.preventDefault(); handleLoginSubmit(); }} className="space-y-5" noValidate>
            
            {/* Input Group */}
            <div className="space-y-1.5">
              <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0] ml-1 flex items-center justify-between">
                <span>Username หรือ อีเมล</span>
                {fieldErrors.identifier && fieldErrors.identifier !== " " && <span className="text-xs text-red-500 font-medium">{fieldErrors.identifier}</span>}
              </label>
              <div className="relative group">
                <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none transition-colors duration-300">
                  <User size={18} className={`transition-colors ${fieldErrors.identifier ? "text-red-500" : "text-gray-400 dark:text-[#5c677d] group-focus-within:text-[#10d97e]"}`} />
                </div>
                <input
                  type="text"
                  name="identifier"
                  placeholder="name@example.com"
                  value={formData.identifier}
                  onChange={handleChange}
                  className={`w-full pl-11 pr-4 py-3.5 rounded-xl bg-white dark:bg-[#0a0c10] border shadow-sm focus:outline-none transition-all text-[15px] font-medium text-gray-900 dark:text-white placeholder-gray-400 dark:placeholder-[#4a5568] ${fieldErrors.identifier
                      ? "border-red-500 focus:border-red-500 focus:ring-4 focus:ring-red-500/10"
                      : "border-gray-200 dark:border-[#1e2330] focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 hover:border-gray-300 dark:hover:border-gray-700"
                    }`}
                />
              </div>
            </div>

            {/* Input Group */}
            <div className="space-y-1.5">
              <div className="flex items-center justify-between ml-1">
                <label className="text-sm font-semibold text-gray-700 dark:text-[#a0abc0]">
                  รหัสผ่าน
                </label>
                {fieldErrors.password && fieldErrors.password !== " " ? (
                  <span className="text-xs text-red-500 font-medium">{fieldErrors.password}</span>
                ) : (
                  <Link href="/auth/forgot-password" className="text-xs font-semibold text-[#10d97e] hover:text-[#0ea865] transition-colors">ลืมรหัสผ่าน?</Link>
                )}
              </div>
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
            </div>

            {process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY && (
              <div className="pt-2 flex justify-center">
                <Turnstile
                  siteKey={process.env.NEXT_PUBLIC_TURNSTILE_SITE_KEY}
                  options={{ theme: resolvedTheme === "dark" ? "dark" : "light" }}
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
                    <>เข้าสู่ระบบ <ArrowRight size={18} className="group-hover:translate-x-1 transition-transform" /></>
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
            ยังไม่มีบัญชีใช่หรือไม่?{" "}
            <Link href="/auth/register" className="text-[#10d97e] font-bold hover:text-[#0ea865] hover:underline underline-offset-4 decoration-2">
              สร้างบัญชีใหม่
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}

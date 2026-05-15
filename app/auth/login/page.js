"use client";

import React from "react";
import { signIn } from "next-auth/react";
import { Sun, Moon, Pickaxe, Sparkles } from "lucide-react";
import Link from "next/link";
import { useSettings } from "@/components/SettingsProvider";
import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";

export default function LoginPage() {
  const { resolvedTheme, setTheme } = useTheme();
  const settings = useSettings();
  const hydrated = useHydrated();

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
            <p className="text-gray-300 italic text-sm mb-4">"The fastest and most reliable way to host my servers for friends without exposing my IP address."</p>
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
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">เชื่อมต่อบัญชี Google ของคุณเพื่อเข้าสู่แผงควบคุม</p>
          </div>

          <button
            onClick={() => signIn("google", { callbackUrl: "/overview" })}
            type="button"
            className="flex items-center justify-center w-full py-4 px-4 rounded-xl bg-white dark:bg-[#0a0c10] border border-gray-200 dark:border-[#1e2330] hover:bg-gray-50 dark:hover:border-gray-600 shadow-sm transition-all text-[15px] font-bold text-gray-700 dark:text-[#e8ecf4] hover:scale-[1.02] active:scale-[0.98]"
          >
            <svg className="w-6 h-6 mr-3" viewBox="0 0 24 24">
              <path fill="currentColor" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92c-.26 1.37-1.04 2.53-2.21 3.31v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.09z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" />
              <path fill="#FBBC05" d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" />
              <path fill="#EA4335" d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" />
            </svg>
            Continue with Google
          </button>
        </div>
      </div>
    </div>
  );
}

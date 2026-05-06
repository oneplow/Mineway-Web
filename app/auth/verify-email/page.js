"use client";

import { Suspense, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { Mail, Moon, Sun } from "lucide-react";

import { useTheme } from "@/components/ThemeProvider";
import { useHydrated } from "@/lib/use-hydrated";

const RESEND_COOLDOWN_SECONDS = 60;

function VerifyEmailContent() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const emailFromUrl = searchParams.get("email") || "";
  const [email, setEmail] = useState(emailFromUrl);
  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [message, setMessage] = useState(
    token
      ? "Verifying your email..."
      : "Check your inbox and open the verification link we sent you."
  );
  const [sending, setSending] = useState(false);
  const [cooldownSeconds, setCooldownSeconds] = useState(0);
  const { resolvedTheme, setTheme } = useTheme();
  const hydrated = useHydrated();

  const cooldownStorageKey = email
    ? `mineway:verify-email-resend:${email.trim().toLowerCase()}`
    : null;

  const startCooldown = (seconds) => {
    const normalizedSeconds = Math.max(0, Number(seconds) || 0);
    setCooldownSeconds(normalizedSeconds);

    if (
      typeof window !== "undefined" &&
      cooldownStorageKey &&
      normalizedSeconds > 0
    ) {
      window.localStorage.setItem(
        cooldownStorageKey,
        String(Date.now() + normalizedSeconds * 1000)
      );
    }
  };

  useEffect(() => {
    if (!token) {
      return;
    }

    let cancelled = false;

    const verify = async () => {
      try {
        const response = await fetch("/api/auth/verify-email", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ token }),
        });
        const data = await response.json();

        if (cancelled) {
          return;
        }

        if (!response.ok) {
          setStatus("error");
          setMessage(data.message || "Verification failed");
          return;
        }

        setStatus("success");
        setMessage("Your email is verified. You can sign in now.");
      } catch {
        if (!cancelled) {
          setStatus("error");
          setMessage("Unable to verify your email right now");
        }
      }
    };

    verify();

    return () => {
      cancelled = true;
    };
  }, [token]);

  useEffect(() => {
    if (typeof window === "undefined" || !cooldownStorageKey) {
      return;
    }

    const storedValue = window.localStorage.getItem(cooldownStorageKey);
    if (!storedValue) {
      return;
    }

    const expiresAt = Number(storedValue);
    if (!Number.isFinite(expiresAt)) {
      window.localStorage.removeItem(cooldownStorageKey);
      return;
    }

    const remainingSeconds = Math.ceil((expiresAt - Date.now()) / 1000);
    if (remainingSeconds > 0) {
      setCooldownSeconds(remainingSeconds);
      return;
    }

    window.localStorage.removeItem(cooldownStorageKey);
  }, [cooldownStorageKey]);

  useEffect(() => {
    if (cooldownSeconds <= 0) {
      if (typeof window !== "undefined" && cooldownStorageKey) {
        window.localStorage.removeItem(cooldownStorageKey);
      }
      return;
    }

    const timer = window.setTimeout(() => {
      setCooldownSeconds((current) => Math.max(0, current - 1));
    }, 1000);

    return () => window.clearTimeout(timer);
  }, [cooldownSeconds, cooldownStorageKey]);

  const resendVerification = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Missing email address for resending verification");
      return;
    }

    if (cooldownSeconds > 0) {
      setStatus("error");
      setMessage(
        `Please wait ${cooldownSeconds} seconds before requesting another verification email.`
      );
      return;
    }

    setSending(true);
    try {
      const response = await fetch("/api/auth/resend-verification", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });
      const data = await response.json();

      if (!response.ok) {
        setStatus("error");
        setMessage(data.message || "Unable to resend verification email");
        if (response.status === 429) {
          startCooldown(data.retryAfter || RESEND_COOLDOWN_SECONDS);
        }
        return;
      }

      setStatus("resent");
      setMessage("A fresh verification email has been sent.");
      startCooldown(data.retryAfter || RESEND_COOLDOWN_SECONDS);
    } catch {
      setStatus("error");
      setMessage("Unable to resend verification email right now");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen w-full bg-white dark:bg-[#050505] transition-colors duration-500 relative overflow-hidden">
      <div
        className="pointer-events-none absolute inset-0 opacity-60 dark:opacity-100"
        style={{
          backgroundImage:
            "radial-gradient(circle at top right, rgba(16,217,126,0.12), transparent 35%), radial-gradient(circle at bottom left, rgba(16,217,126,0.08), transparent 30%)",
        }}
      />

      <button
        type="button"
        onClick={() => setTheme(resolvedTheme === "dark" ? "light" : "dark")}
        className="absolute top-6 right-6 p-2.5 rounded-xl border border-gray-200 dark:border-[#1e2330] text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-[#111318] transition-all bg-white/50 dark:bg-[#0a0c10]/50 backdrop-blur-md shadow-sm z-20"
      >
        {hydrated ? (
          resolvedTheme === "dark" ? <Sun size={18} /> : <Moon size={18} />
        ) : (
          <Sun size={18} className="opacity-0" />
        )}
      </button>

      <div className="relative z-10 flex min-h-screen items-center justify-center px-6 py-16">
        <div className="w-full max-w-[430px] animate-fade-in">
          <div className="mb-8 text-center">
            <div className="mx-auto mb-4 flex h-14 w-14 items-center justify-center rounded-2xl bg-[#10d97e]/10 text-[#10d97e] dark:bg-[#10d97e]/15">
              <Mail size={24} />
            </div>
            <h1 className="font-syne text-3xl font-bold text-gray-900 dark:text-white tracking-tight mb-3">
              Verify your account
            </h1>
            <p className="text-gray-500 dark:text-[#8892a4] text-[15px]">
              {message}
            </p>
          </div>

          <div className="w-full rounded-3xl border border-gray-200 dark:border-white/10 bg-white/85 dark:bg-white/5 backdrop-blur-xl p-8 shadow-xl dark:shadow-2xl transition-colors">
            <div className="mb-6">
              <label className="block text-sm font-semibold text-gray-700 dark:text-white/60 mb-2">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(event) => setEmail(event.target.value)}
                disabled={Boolean(emailFromUrl)}
                placeholder="you@example.com"
                className="w-full rounded-2xl border border-gray-200 dark:border-white/10 bg-white dark:bg-black/20 px-4 py-3 text-gray-900 dark:text-white outline-none focus:border-[#10d97e] focus:ring-4 focus:ring-[#10d97e]/10 transition-all disabled:opacity-70"
              />
            </div>

            <div className="flex flex-col gap-3">
              {(status === "idle" || status === "error" || status === "resent") && email ? (
                <button
                  type="button"
                  onClick={resendVerification}
                  disabled={sending || cooldownSeconds > 0}
                  className="rounded-2xl bg-[#10d97e] px-4 py-3 font-semibold text-[#04110a] disabled:opacity-60"
                >
                  {sending
                    ? "Sending..."
                    : cooldownSeconds > 0
                      ? `Resend available in ${cooldownSeconds}s`
                      : "Resend verification email"}
                </button>
              ) : null}

              <Link
                href="/auth/login"
                className="rounded-2xl border border-gray-200 dark:border-white/10 px-4 py-3 text-center font-semibold text-gray-700 dark:text-white/90 hover:bg-gray-50 dark:hover:bg-white/5 transition-colors"
              >
                Go to login
              </Link>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default function VerifyEmailPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-white dark:bg-[#050505]" />}>
      <VerifyEmailContent />
    </Suspense>
  );
}

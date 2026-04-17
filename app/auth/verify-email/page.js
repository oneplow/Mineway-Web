"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";

export default function VerifyEmailPage() {
  const searchParams = useSearchParams();
  const token = searchParams.get("token");
  const email = searchParams.get("email") || "";
  const [status, setStatus] = useState(token ? "verifying" : "idle");
  const [message, setMessage] = useState(
    token
      ? "Verifying your email..."
      : "Check your inbox and open the verification link we sent you."
  );
  const [sending, setSending] = useState(false);

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

  const resendVerification = async () => {
    if (!email) {
      setStatus("error");
      setMessage("Missing email address for resending verification");
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
        return;
      }

      setStatus("resent");
      setMessage("A fresh verification email has been sent.");
    } catch {
      setStatus("error");
      setMessage("Unable to resend verification email right now");
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#050505] text-white flex items-center justify-center px-6">
      <div className="w-full max-w-lg rounded-3xl border border-white/10 bg-white/5 backdrop-blur-xl p-8 shadow-2xl">
        <p className="text-xs uppercase tracking-[0.3em] text-[#10d97e] font-semibold mb-4">
          Email Verification
        </p>
        <h1 className="text-3xl font-bold mb-4">Verify your account</h1>
        <p className="text-white/70 leading-7 mb-6">{message}</p>
        {email ? (
          <p className="text-sm text-white/50 mb-6">
            Email: <span className="text-white">{email}</span>
          </p>
        ) : null}
        <div className="flex flex-col gap-3">
          {(status === "idle" || status === "error" || status === "resent") &&
          email ? (
            <button
              type="button"
              onClick={resendVerification}
              disabled={sending}
              className="rounded-2xl bg-[#10d97e] px-4 py-3 font-semibold text-[#04110a] disabled:opacity-60"
            >
              {sending ? "Sending..." : "Resend verification email"}
            </button>
          ) : null}
          <Link
            href="/auth/login"
            className="rounded-2xl border border-white/10 px-4 py-3 text-center font-semibold text-white/90"
          >
            Go to login
          </Link>
        </div>
      </div>
    </div>
  );
}

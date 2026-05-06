import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import {
  getEmailSendErrorMessage,
  isEmailVerificationConfigured,
  issueAndSendVerificationEmail,
} from "@/lib/email-verification";

const RESEND_COOLDOWN_MS = 60 * 1000;
const RESEND_COOLDOWN_CLEANUP_MS = 10 * 60 * 1000;

const resendCooldownState = globalThis.__minewayResendCooldownState || {
  lastSentByEmail: new Map(),
  lastCleanupAt: 0,
};

if (!globalThis.__minewayResendCooldownState) {
  globalThis.__minewayResendCooldownState = resendCooldownState;
}

function cleanupCooldownState(now) {
  if (now - resendCooldownState.lastCleanupAt < RESEND_COOLDOWN_CLEANUP_MS) {
    return;
  }

  resendCooldownState.lastCleanupAt = now;

  for (const [email, sentAt] of resendCooldownState.lastSentByEmail.entries()) {
    if (now - sentAt >= RESEND_COOLDOWN_CLEANUP_MS) {
      resendCooldownState.lastSentByEmail.delete(email);
    }
  }
}

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email) {
      return NextResponse.json(
        { message: "Email is required" },
        { status: 400 }
      );
    }

    if (!isEmailVerificationConfigured()) {
      return NextResponse.json(
        { message: "Email verification is not configured" },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { emailVerified: true },
    });

    if (!user) {
      return NextResponse.json(
        { message: "Account not found" },
        { status: 404 }
      );
    }

    if (user.emailVerified) {
      return NextResponse.json(
        { message: "Email is already verified" },
        { status: 409 }
      );
    }

    const now = Date.now();
    cleanupCooldownState(now);

    const lastSentAt = resendCooldownState.lastSentByEmail.get(email);
    if (lastSentAt) {
      const remainingMs = RESEND_COOLDOWN_MS - (now - lastSentAt);
      if (remainingMs > 0) {
        return NextResponse.json(
          {
            message: `Please wait ${Math.ceil(remainingMs / 1000)} seconds before requesting another verification email.`,
            retryAfter: Math.ceil(remainingMs / 1000),
          },
          { status: 429 }
        );
      }
    }

    await issueAndSendVerificationEmail(email);
    resendCooldownState.lastSentByEmail.set(email, now);

    return NextResponse.json({
      message: "Verification email sent",
      retryAfter: Math.ceil(RESEND_COOLDOWN_MS / 1000),
    });
  } catch (error) {
    console.error("POST /api/auth/resend-verification error:", error);
    return NextResponse.json(
      { message: getEmailSendErrorMessage(error) },
      { status: error?.code === "EMAIL_SEND_FAILED" ? 503 : 500 }
    );
  }
}

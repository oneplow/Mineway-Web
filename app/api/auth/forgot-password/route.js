import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import {
  getEmailSendErrorMessage,
  isEmailVerificationConfigured,
  issueAndSendPasswordResetEmail,
} from "@/lib/email-verification";

export async function POST(req) {
  try {
    const body = await req.json();
    const email = body?.email?.trim().toLowerCase();

    if (!email || !/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: "Please enter a valid email address" },
        { status: 400 }
      );
    }

    if (!isEmailVerificationConfigured()) {
      return NextResponse.json(
        { message: "Email delivery is not configured" },
        { status: 503 }
      );
    }

    const user = await prisma.user.findUnique({
      where: { email },
      select: { id: true, password: true },
    });

    if (user?.password) {
      await issueAndSendPasswordResetEmail(email);
    }

    return NextResponse.json({
      message: "If an account exists for this email, a reset link has been sent.",
    });
  } catch (error) {
    console.error("POST /api/auth/forgot-password error:", error);
    return NextResponse.json(
      { message: getEmailSendErrorMessage(error) },
      { status: error?.code === "EMAIL_SEND_FAILED" ? 503 : 500 }
    );
  }
}

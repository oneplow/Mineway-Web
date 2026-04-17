import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";
import {
  isEmailVerificationConfigured,
  issueAndSendVerificationEmail,
} from "@/lib/email-verification";

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

    await issueAndSendVerificationEmail(email);

    return NextResponse.json({
      message: "Verification email sent",
    });
  } catch (error) {
    console.error("POST /api/auth/resend-verification error:", error);
    return NextResponse.json(
      { message: "Unable to send verification email" },
      { status: 500 }
    );
  }
}

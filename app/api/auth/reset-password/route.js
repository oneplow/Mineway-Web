import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/auth";
import { consumePasswordResetToken } from "@/lib/email-verification";

export async function POST(req) {
  try {
    const body = await req.json();
    const token = body?.token;
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;

    if (!token || !email || !password) {
      return NextResponse.json(
        { message: "Missing reset token, email, or password" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const result = await consumePasswordResetToken(token, email);
    if (!result.ok) {
      return NextResponse.json(
        {
          message:
            result.reason === "expired_token"
              ? "Password reset link has expired"
              : "Password reset link is invalid",
        },
        { status: 400 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);
    await prisma.user.update({
      where: { email: result.email },
      data: { password: hashedPassword },
    });

    return NextResponse.json({
      message: "Password has been reset. You can sign in now.",
    });
  } catch (error) {
    console.error("POST /api/auth/reset-password error:", error);
    return NextResponse.json(
      { message: "Unable to reset password right now" },
      { status: 500 }
    );
  }
}

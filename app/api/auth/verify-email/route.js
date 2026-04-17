import { NextResponse } from "next/server";
import { consumeEmailVerificationToken } from "@/lib/email-verification";

export async function POST(req) {
  try {
    const body = await req.json();
    const token = body?.token;

    if (!token) {
      return NextResponse.json(
        { message: "Verification token is required" },
        { status: 400 }
      );
    }

    const result = await consumeEmailVerificationToken(token);

    if (!result.ok) {
      return NextResponse.json(
        {
          message:
            result.reason === "expired_token"
              ? "Verification link has expired"
              : "Verification link is invalid",
        },
        { status: 400 }
      );
    }

    return NextResponse.json({
      message: "Email verified successfully",
      email: result.email,
    });
  } catch (error) {
    console.error("POST /api/auth/verify-email error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

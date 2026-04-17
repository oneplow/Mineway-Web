import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/auth";
import {
  isEmailVerificationConfigured,
  issueAndSendVerificationEmail,
} from "@/lib/email-verification";

export async function POST(req) {
  try {
    const body = await req.json();
    const username = body?.username?.trim();
    const email = body?.email?.trim().toLowerCase();
    const password = body?.password;
    const turnstileToken = body?.turnstileToken;

    if (!username || !email || !password) {
      return NextResponse.json(
        { message: "Please fill in all required fields" },
        { status: 400 }
      );
    }

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json(
          { message: "กรุณายืนยันว่าคุณไม่ใช่บอท (reCAPTCHA)" },
          { status: 400 }
        );
      }
      const verifyRes = await fetch("https://challenges.cloudflare.com/turnstile/v0/siteverify", {
        method: "POST",
        headers: { "Content-Type": "application/x-www-form-urlencoded" },
        body: new URLSearchParams({
          secret: process.env.TURNSTILE_SECRET_KEY,
          response: turnstileToken
        }).toString()
      });
      const verifyData = await verifyRes.json();
      if (!verifyData.success) {
        return NextResponse.json(
          { message: "การยืนยันตัวตนล้มเหลว กรุณาลองใหม่ (reCAPTCHA)" },
          { status: 400 }
        );
      }
    }

    if (!isEmailVerificationConfigured()) {
      return NextResponse.json(
        { message: "Email verification is not configured" },
        { status: 503 }
      );
    }

    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json(
        {
          message:
            "Username must use only letters, numbers, or underscore (3-20 characters)",
        },
        { status: 400 }
      );
    }

    if (!/^\S+@\S+\.\S+$/.test(email)) {
      return NextResponse.json(
        { message: "Invalid email format" },
        { status: 400 }
      );
    }

    if (password.length < 8) {
      return NextResponse.json(
        { message: "Password must be at least 8 characters" },
        { status: 400 }
      );
    }

    const [existingEmail, existingUsername] = await Promise.all([
      prisma.user.findUnique({ where: { email } }),
      prisma.user.findUnique({ where: { username: username.toLowerCase() } }),
    ]);

    if (existingEmail) {
      return NextResponse.json(
        { message: "This email is already in use" },
        { status: 409 }
      );
    }

    if (existingUsername) {
      return NextResponse.json(
        { message: "This username is already in use" },
        { status: 409 }
      );
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email,
        password: hashedPassword,
      },
    });

    await issueAndSendVerificationEmail(email);

    return NextResponse.json(
      {
        message: "Registered successfully. Please verify your email before signing in.",
        requiresVerification: true,
        user: { email: newUser.email },
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json(
      { message: "Internal server error" },
      { status: 500 }
    );
  }
}

import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/auth";

export async function POST(req) {
  try {
    const body = await req.json();
    const identifier = body?.identifier?.trim();
    const password = body?.password;
    const turnstileToken = body?.turnstileToken;

    if (!identifier || !password) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "กรุณากรอกข้อมูลให้ครบ" },
        { status: 400 }
      );
    }

    if (process.env.TURNSTILE_SECRET_KEY) {
      if (!turnstileToken) {
        return NextResponse.json(
          { error: "captcha_required", message: "กรุณายืนยันว่าคุณไม่ใช่บอท (reCAPTCHA)" },
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
          { error: "captcha_failed", message: "การยืนยันตัวตนล้มเหลว กรุณาลองใหม่ (reCAPTCHA)" },
          { status: 400 }
        );
      }
    }

    const user = await prisma.user.findFirst({
      where: {
        OR: [
          { email: String(identifier).toLowerCase() },
          { username: String(identifier).toLowerCase() },
        ],
      },
    });

    if (!user || !user.password) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "ชื่อผู้ใช้งาน, อีเมล หรือ รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    const isPasswordValid = await bcrypt.compare(password, user.password);

    if (!isPasswordValid) {
      return NextResponse.json(
        { error: "invalid_credentials", message: "ชื่อผู้ใช้งาน, อีเมล หรือ รหัสผ่านไม่ถูกต้อง" },
        { status: 401 }
      );
    }

    if (!user.emailVerified) {
      return NextResponse.json(
        {
          error: "unverified_email",
          message: "บัญชีของคุณยังไม่ได้ยืนยันอีเมล กรุณาตรวจสอบกล่องจดหมายและยืนยันอีเมลก่อนเข้าสู่ระบบ",
          email: user.email,
        },
        { status: 403 }
      );
    }

    // All checks passed — client can now safely call signIn()
    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("Login pre-check error:", error);
    return NextResponse.json(
      { error: "server_error", message: "เกิดข้อผิดพลาดภายในระบบ" },
      { status: 500 }
    );
  }
}

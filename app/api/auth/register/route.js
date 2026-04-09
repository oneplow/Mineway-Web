import { NextResponse } from "next/server";
import bcrypt from "bcryptjs";
import { prisma } from "@/lib/auth";

export async function POST(req) {
  try {
    const { username, email, password } = await req.json();

    if (!username || !email || !password) {
      return NextResponse.json({ message: "กรุณากรอกข้อมูลให้ครบถ้วน" }, { status: 400 });
    }

    // Validate username format: alphanumeric + underscore only, 3-20 chars
    if (!/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      return NextResponse.json({ message: "Username ต้องเป็นตัวอักษรภาษาอังกฤษ ตัวเลข หรือ _ เท่านั้น (3-20 ตัว)" }, { status: 400 });
    }

    // Check duplicate email
    const existingEmail = await prisma.user.findUnique({
      where: { email },
    });
    if (existingEmail) {
      return NextResponse.json({ message: "อีเมลนี้ถูกใช้งานไปแล้ว" }, { status: 409 });
    }

    // Check duplicate username
    const existingUsername = await prisma.user.findUnique({
      where: { username: username.toLowerCase() },
    });
    if (existingUsername) {
      return NextResponse.json({ message: "Username นี้ถูกใช้งานไปแล้ว" }, { status: 409 });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username.toLowerCase(),
        email,
        password: hashedPassword,
      },
    });

    return NextResponse.json({ message: "Registered successfully", user: { email: newUser.email } }, { status: 201 });
  } catch (error) {
    console.error("Registration error:", error);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

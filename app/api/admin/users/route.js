import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, role, action, pointAmount } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (action === "updateRole") {
      if (!role || (role !== "ADMIN" && role !== "USER")) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });
      return NextResponse.json({ success: true, user: { id: updatedUser.id, role: updatedUser.role } });
    } 
    
    if (action === "adjustPoints") {
      if (typeof pointAmount !== "number" || pointAmount === 0) {
        return NextResponse.json({ error: "Invalid point amount" }, { status: 400 });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: pointAmount }
        },
      });
      return NextResponse.json({ success: true, user: { id: updatedUser.id, points: updatedUser.points } });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { username, email, password, role = "USER" } = await req.json();
    if (!email || !password) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    // Check if user exists
    const existing = await prisma.user.findFirst({
      where: {
        OR: [{ email }, { username: username || undefined }]
      }
    });

    if (existing) {
      return NextResponse.json({ error: "Email or username already exists" }, { status: 400 });
    }

    // Hash password
    const bcrypt = await import("bcryptjs");
    const hashedPassword = await bcrypt.hash(password, 10);

    const newUser = await prisma.user.create({
      data: {
        username: username || null,
        email,
        password: hashedPassword,
        role,
      }
    });

    return NextResponse.json({ success: true, user: newUser });
  } catch (error) {
    console.error("POST /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { searchParams } = new URL(req.url);
    const userId = searchParams.get("userId");

    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (userId === session.user.id) {
      return NextResponse.json({ error: "Cannot delete yourself" }, { status: 400 });
    }

    await prisma.user.delete({
      where: { id: userId }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

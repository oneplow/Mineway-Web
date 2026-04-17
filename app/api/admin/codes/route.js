import { NextResponse } from "next/server";
import { prisma, auth } from "@/lib/auth";

async function checkAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return false;
  }
  return true;
}

export async function GET(req) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const codes = await prisma.redemptionCode.findMany({
      orderBy: { createdAt: "desc" },
      include: {
        _count: {
          select: { logs: true }
        }
      }
    });
    return NextResponse.json(codes);
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { code, points, maxUses, expiresAt } = await req.json();

    if (!code || !points || isNaN(parseInt(points))) {
      return NextResponse.json({ message: "Invalid payload parameters" }, { status: 400 });
    }

    const upperCode = String(code).trim().toUpperCase();

    const exists = await prisma.redemptionCode.findUnique({ where: { code: upperCode } });
    if (exists) {
      return NextResponse.json({ message: "Code already exists" }, { status: 409 });
    }

    const newCode = await prisma.redemptionCode.create({
      data: {
        code: upperCode,
        points: parseInt(points),
        maxUses: parseInt(maxUses) || 1,
        expiresAt: expiresAt ? new Date(expiresAt) : null,
      }
    });

    return NextResponse.json(newCode, { status: 201 });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  if (!(await checkAdmin())) return NextResponse.json({ message: "Forbidden" }, { status: 403 });

  try {
    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) return NextResponse.json({ message: "Missing id" }, { status: 400 });

    await prisma.redemptionCode.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error(err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

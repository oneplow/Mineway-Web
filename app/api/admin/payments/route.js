import { NextResponse } from "next/server";
import { prisma, auth } from "@/lib/auth";

async function checkAdmin() {
  const session = await auth();
  if (!session || !session.user || session.user.role !== "ADMIN") {
    return false;
  }
  return session;
}

/**
 * GET /api/admin/payments
 * Lists payments, optionally filtered by status (e.g. pending_review).
 */
export async function GET(req) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(req.url);
  const status = searchParams.get("status"); // e.g. "pending_review"

  const where = {};
  if (status) where.status = status;

  const payments = await prisma.payment.findMany({
    where,
    include: {
      user: { select: { id: true, username: true, email: true } },
    },
    orderBy: { createdAt: "desc" },
    take: 100,
  });

  return NextResponse.json(payments);
}

/**
 * POST /api/admin/payments
 * Approve or reject a pending_review payment.
 * Body: { paymentId: string, action: "approve" | "reject" }
 */
export async function POST(req) {
  const session = await checkAdmin();
  if (!session) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json();
  const { paymentId, action } = body;

  if (!paymentId || !["approve", "reject"].includes(action)) {
    return NextResponse.json(
      { error: "paymentId and action (approve/reject) are required" },
      { status: 400 }
    );
  }

  const payment = await prisma.payment.findUnique({
    where: { id: paymentId },
  });

  if (!payment) {
    return NextResponse.json({ error: "Payment not found" }, { status: 404 });
  }

  if (payment.status !== "pending_review") {
    return NextResponse.json(
      { error: "This payment is not in pending_review status" },
      { status: 400 }
    );
  }

  if (action === "approve") {
    // Approve: mark completed and credit points
    await prisma.$transaction([
      prisma.payment.update({
        where: { id: paymentId },
        data: { status: "completed" },
      }),
      prisma.user.update({
        where: { id: payment.userId },
        data: { points: { increment: payment.points } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `อนุมัติสำเร็จ — เพิ่ม ${payment.points} Points ให้ผู้ใช้แล้ว`,
    });
  } else {
    // Reject: mark as failed
    await prisma.payment.update({
      where: { id: paymentId },
      data: { status: "failed" },
    });

    return NextResponse.json({
      success: true,
      message: "ปฏิเสธรายการเรียบร้อย",
    });
  }
}

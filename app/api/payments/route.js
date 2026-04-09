import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const payments = await prisma.payment.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    return NextResponse.json(payments);
  } catch (error) {
    console.error("GET /api/payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { amount, points, method } = body;

    // TODO: Integrate actual Payment Gateway here...
    // For now, auto approve and add points
    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount,
        points,
        method,
        status: "completed", // Auto complete for mock gateway
        ref: "TRX_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    });

    // Add points to user
    await prisma.user.update({
      where: { id: session.user.id },
      data: { points: { increment: points } },
    });

    return NextResponse.json(payment, { status: 201 });
  } catch (error) {
    console.error("POST /api/payments error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

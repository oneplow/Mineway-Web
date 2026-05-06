import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/create
 * Creates a new pending payment order with a unique decimal amount.
 * Body: { packageIndex: number }  (index into TOPUP_PACKAGES)
 */

const TOPUP_PACKAGES = [
  { points: 100, price: 100, bonus: 0 },
  { points: 300, price: 300, bonus: 10 },
  { points: 600, price: 600, bonus: 30 },
  { points: 1200, price: 1200, bonus: 100 },
];

const PROMPTPAY_DISABLED = true;

export async function POST(req) {
  try {
    if (PROMPTPAY_DISABLED) {
      return NextResponse.json(
        { error: "ระบบสแกน QR PromptPay กำลังจะอัปเดตในอนาคต" },
        { status: 503 }
      );
    }

    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { packageIndex, customAmount } = body;

    let pkg;

    if (customAmount) {
      const amount = parseFloat(customAmount);
      if (isNaN(amount) || amount < 10) {
        return NextResponse.json({ error: "ต้องเติมเงินขั้นต่ำ 10 บาท" }, { status: 400 });
      }
      pkg = { price: amount, points: amount, bonus: 0 };
    } else if (packageIndex !== undefined && packageIndex !== null) {
      pkg = TOPUP_PACKAGES[packageIndex];
      if (!pkg) {
        return NextResponse.json({ error: "Invalid package" }, { status: 400 });
      }
    } else {
      return NextResponse.json({ error: "Missing amount or package" }, { status: 400 });
    }

    // Check for existing pending order from this user (prevent spam)
    const existingPending = await prisma.payment.findFirst({
      where: {
        userId: session.user.id,
        status: "pending",
        createdAt: { gte: new Date(Date.now() - 30 * 60 * 1000) }, // within last 30 minutes
      },
    });

    if (existingPending) {
      // Return the existing pending order instead of creating a new one
      const promptpayNumber = await getPromptPayNumber();
      return NextResponse.json({
        orderId: existingPending.id,
        amount: existingPending.amount,
        points: existingPending.points,
        promptpayNumber,
        existing: true,
      });
    }

    // Generate unique amount: base price + random satang (0.01 - 0.99)
    let uniqueAmount;
    let attempts = 0;
    const maxAttempts = 50;

    do {
      const randomSatang = (Math.floor(Math.random() * 99) + 1) / 100; // 0.01 - 0.99
      uniqueAmount = pkg.price + randomSatang;
      uniqueAmount = Math.round(uniqueAmount * 100) / 100; // Fix floating point

      // Check if this amount is already used in a pending order
      const duplicate = await prisma.payment.findFirst({
        where: {
          amount: uniqueAmount,
          status: "pending",
          createdAt: { gte: new Date(Date.now() - 60 * 60 * 1000) }, // within last hour
        },
      });

      if (!duplicate) break;
      attempts++;
    } while (attempts < maxAttempts);

    if (attempts >= maxAttempts) {
      return NextResponse.json(
        { error: "ไม่สามารถสร้างยอดเงินที่ไม่ซ้ำได้ กรุณาลองใหม่" },
        { status: 500 }
      );
    }

    const totalPoints = pkg.points + pkg.bonus;

    const payment = await prisma.payment.create({
      data: {
        userId: session.user.id,
        amount: uniqueAmount,
        points: totalPoints,
        method: "promptpay",
        status: "pending",
        ref: "PP_" + Math.random().toString(36).substring(2, 10).toUpperCase(),
      },
    });

    const promptpayNumber = await getPromptPayNumber();

    return NextResponse.json({
      orderId: payment.id,
      amount: payment.amount,
      points: totalPoints,
      promptpayNumber,
      existing: false,
    }, { status: 201 });

  } catch (error) {
    console.error("POST /api/payments/create error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

async function getPromptPayNumber() {
  const setting = await prisma.siteSetting.findUnique({
    where: { key: "promptpay_number" },
  });
  return setting?.value || null;
}

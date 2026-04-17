import { NextResponse } from "next/server";
import { prisma, auth } from "@/lib/auth";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session || !session.user) {
      return NextResponse.json({ message: "Unauthorized" }, { status: 401 });
    }

    const { code } = await req.json();
    if (!code || typeof code !== "string" || code.trim() === "") {
      return NextResponse.json({ message: "Invalid code" }, { status: 400 });
    }

    const upperCode = code.trim().toUpperCase();

    // Look up the code
    const redemptionCode = await prisma.redemptionCode.findUnique({
      where: { code: upperCode }
    });

    if (!redemptionCode) {
      return NextResponse.json({ message: "โค้ดนี้ไม่มีอยู่จริง หรือสะกดผิด" }, { status: 404 });
    }

    // Check expiration
    if (redemptionCode.expiresAt && new Date() > new Date(redemptionCode.expiresAt)) {
      return NextResponse.json({ message: "โค้ดนี้หมดอายุแล้ว" }, { status: 400 });
    }

    // Check max usages
    if (redemptionCode.maxUses > 0 && redemptionCode.currentUses >= redemptionCode.maxUses) {
      return NextResponse.json({ message: "โค้ดนี้ถูกใช้งานครบจำนวนแล้ว" }, { status: 400 });
    }

    // Check if user already redeemed this code
    const existingLog = await prisma.redemptionLog.findUnique({
      where: {
        codeId_userId: {
          codeId: redemptionCode.id,
          userId: session.user.id
        }
      }
    });

    if (existingLog) {
      return NextResponse.json({ message: "คุณทำการเติมโค้ดนี้ไปแล้ว" }, { status: 400 });
    }

    // Perform transaction: increment usage, add log, add points, add payment record
    await prisma.$transaction([
      prisma.redemptionCode.update({
        where: { id: redemptionCode.id },
        data: { currentUses: { increment: 1 } }
      }),
      prisma.redemptionLog.create({
        data: {
          codeId: redemptionCode.id,
          userId: session.user.id
        }
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { points: { increment: redemptionCode.points } }
      }),
      prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: 0,
          points: redemptionCode.points,
          method: "redeem_code",
          status: "completed",
          ref: upperCode
        }
      })
    ]);

    return NextResponse.json({
      success: true,
      message: `แลกโค้ดสำเร็จ! ได้รับ ${redemptionCode.points} Points`,
      points: redemptionCode.points
    });

  } catch (err) {
    console.error("Redeem code error:", err);
    return NextResponse.json({ message: "Internal server error" }, { status: 500 });
  }
}

import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/voucher
 * Validates and redeems a TrueMoney Voucher (Angpao) link using @opecgame/twapi.
 * If successful, creates a completed payment record and credits points.
 */
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { url } = body;

    if (!url || typeof url !== "string" || !url.includes("gift.truemoney.com")) {
      return NextResponse.json({ error: "ลิงก์ซองอั่งเปาไม่ถูกต้อง" }, { status: 400 });
    }

    // Get the configured phone number
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "truemoney_phone" },
    });
    const phone = setting?.value;

    if (!phone) {
      return NextResponse.json(
        { error: "ระบบยังไม่ได้ตั้งค่าเบอร์รับเงิน (TrueMoney) กรุณาติดต่อแอดมิน" },
        { status: 500 }
      );
    }

    // Redeem the voucher using @opecgame/twapi
    let tw;
    try {
      const twApi = require("@opecgame/twapi");
      tw = await twApi(url, phone);
    } catch (apiError) {
      console.error("TrueMoney twapi error:", apiError);
      return NextResponse.json(
        { error: "ไม่สามารถเชื่อมต่อกับ TrueMoney ได้ กรุณาลองใหม่" },
        { status: 502 }
      );
    }

    const statusCode = tw?.status?.code;

    if (statusCode !== "SUCCESS") {
      const errorMap = {
        CANNOT_GET_OWN_VOUCHER: "รับซองตัวเองไม่ได้ (เบอร์ผู้ส่งตรงกับเบอร์แอดมิน)",
        TARGET_USER_NOT_FOUND: "ไม่พบเบอร์นี้ในระบบ TrueMoney",
        INTERNAL_ERROR: "ไม่พบซองนี้ในระบบ หรือ URL ผิด",
        VOUCHER_OUT_OF_STOCK: "ซองอั่งเปานี้ถูกรับไปแล้ว",
        VOUCHER_NOT_FOUND: "ไม่พบซองในระบบ",
        VOUCHER_EXPIRED: "ซองอั่งเปานี้หมดอายุแล้ว",
      };

      const errMsg = errorMap[statusCode] || tw?.status?.message || "ไม่สามารถรับซองอั่งเปาได้";
      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    // SUCCESS — extract amount
    const amount = parseFloat(tw.data?.my_ticket?.amount_baht || "0");

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "ยอดเงินอั่งเปาไม่ถูกต้อง" }, { status: 400 });
    }

    // Extract voucher hash for tracking
    let voucherHash = "";
    try {
      const urlObj = new URL(url);
      voucherHash = urlObj.searchParams.get("v") || "";
    } catch {
      const match = url.match(/[0-9A-Za-z]{18,}/);
      if (match) voucherHash = match[0];
    }

    // Create completed payment & credit points
    await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: amount,
          points: Math.floor(amount), // 1 THB = 1 Point
          method: "truemoney_voucher",
          status: "completed",
          ref: `VOUCHER_${voucherHash.substring(0, 10)}`,
        },
      }),
      prisma.user.update({
        where: { id: session.user.id },
        data: { points: { increment: Math.floor(amount) } },
      }),
    ]);

    return NextResponse.json({
      success: true,
      message: `เติมเงินสำเร็จ! ได้รับ ${Math.floor(amount)} Points`,
      points: Math.floor(amount),
    });

  } catch (error) {
    console.error("POST /api/payments/voucher error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

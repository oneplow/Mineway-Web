import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/voucher
 * Validates a TrueMoney Voucher (Angpao) link using @mrchimky/voucherjs
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

    // Extract the voucher hash/code strictly
    let voucherHash = "";
    try {
      const urlObj = new URL(url);
      voucherHash = urlObj.searchParams.get("v") || "";
    } catch {
      // If URL parsing fails, try regex
      const match = url.match(/[0-9A-Za-z]{35}/);
      if (match) voucherHash = match[0];
    }

    if (!voucherHash) {
      const match = url.match(/[0-9A-Za-z]{35}/);
      if (match) voucherHash = match[0];
    }

    if (!voucherHash || voucherHash.length !== 35) {
      return NextResponse.json({ error: "รูปแบบลิงก์ซองอั่งเปาไม่ถูกต้อง (หรือขาดรหัส 35 ตัว)" }, { status: 400 });
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

    // Call voucher API with the clean hash
    let data;
    try {
      const voucher = require("@mrchimky/voucherjs");
      // passing the clean 35-char hash prevents voucherjs crash
      data = await voucher(phone, voucherHash);
      // data.status, data.amount
    } catch (apiError) {
      if (!apiError?.message?.includes("invaild") && !apiError?.message?.includes("invalid") && !apiError?.message?.includes("phone")) {
        console.error("Voucher API Error:", apiError);
      }
      let errMsg = "ระบบไม่สามารถตรวจสอบซองอั่งเปาได้ (ซองอาจถูกรับไปแล้ว หรือลิงก์ผิด)";
      if (apiError?.message?.includes("invaild_voucher") || apiError?.message?.includes("invalid_voucher")) {
        errMsg = "ลิงก์ซองอั่งเปาไม่ถูกต้อง หรือซองนี้ถูกใช้งานไปแล้ว";
      } else if (apiError?.message?.includes("phone")) {
        errMsg = "เบอร์วอเล็ตรับเงินปลายทางไม่ถูกต้อง (กรุณาแจ้งแอดมิน)";
      } else if (apiError?.message) {
        errMsg = apiError.message; // fallback
      }

      return NextResponse.json({ error: errMsg }, { status: 400 });
    }

    if (data?.status !== "SUCCESS") {
      return NextResponse.json(
        { error: "คุณไม่สามารถใช้ซองนี้ได้ (อาจมีผู้รับไปแล้ว หรือยอดเงินไม่พอ)" },
        { status: 400 }
      );
    }

    const amount = parseFloat(data.amount);

    if (isNaN(amount) || amount <= 0) {
      return NextResponse.json({ error: "ยอดเงินอั่งเปาไม่ถูกต้อง" }, { status: 400 });
    }

    // Successful redemption — create completed payment
    const [payment] = await prisma.$transaction([
      prisma.payment.create({
        data: {
          userId: session.user.id,
          amount: amount,
          points: Math.floor(amount), // 1 THB = 1 Point
          method: "truemoney_voucher",
          status: "completed",
          ref: `VOUCHER_${voucherHash.substring(0, 10)}`, // Just tracking which link was used
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

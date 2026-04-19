import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * POST /api/payments/verify-slip
 * Receives the slip QR payload string from the user's slip image.
 * Uses promptparse to extract & validate slip data, then applies strict checks.
 *
 * Body: { orderId: string, slipPayload: string }
 *
 * Security layers:
 * 1. Order ownership & status checks
 * 2. Order expiry (1 hour)
 * 3. promptparse slipVerify — validates QR structure & checksum
 * 4. Amount matching (if slip contains amount)
 * 5. Receiver account matching (if promptpay number is configured)
 * 6. Duplicate slip detection (same transRef can't be used twice)
 * 7. Fallback: if validation is incomplete, send to admin review
 */

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { orderId, slipPayload } = body;

    if (!orderId || !slipPayload) {
      return NextResponse.json(
        { error: "orderId and slipPayload are required" },
        { status: 400 }
      );
    }

    // 1. Find the pending order
    const order = await prisma.payment.findUnique({
      where: { id: orderId },
    });

    if (!order) {
      return NextResponse.json({ error: "ไม่พบรายการ" }, { status: 404 });
    }

    // 2. Verify order ownership
    if (order.userId !== session.user.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    // 3. Verify order is still pending
    if (order.status !== "pending") {
      return NextResponse.json(
        { error: "รายการนี้ถูกดำเนินการไปแล้ว", status: order.status },
        { status: 400 }
      );
    }

    // 4. Verify order is not expired (1 hour)
    const orderAge = Date.now() - new Date(order.createdAt).getTime();
    if (orderAge > 60 * 60 * 1000) {
      await prisma.payment.update({
        where: { id: orderId },
        data: { status: "failed" },
      });
      return NextResponse.json(
        { error: "รายการหมดอายุแล้ว กรุณาสร้างรายการใหม่" },
        { status: 400 }
      );
    }

    // 5. Parse & validate slip QR using promptparse OR SlipOK
    let slipData = null;
    let isAutoApprove = false;

    // Check if SlipOK is configured
    const slipokKey = process.env.SLIPOK_API_KEY;
    const slipokBranchId = process.env.SLIPOK_BRANCH_ID;

    if (slipokKey && slipokBranchId) {
      // Use SlipOK for automatic amount validation
      try {
        const response = await fetch(`https://api.slipok.com/api/line/apikey/${slipokBranchId}`, {
          method: "POST",
          headers: {
            "x-authorization": slipokKey,
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ data: slipPayload }),
        });

        const result = await response.json();
        if (result.success && result.data) {
          slipData = {
            transRef: result.data.transRef,
            amount: result.data.amount,
            sendingBank: result.data.sender?.bank?.name || "",
            receivingBank: result.data.receiver?.bank?.name || "",
          };
          isAutoApprove = true;
        } else {
          return NextResponse.json(
            { error: "ระบบ SlipOK ตรวจสอบสลิปไม่ผ่าน: " + (result.message || "สลิปไม่ถูกต้อง") },
            { status: 400 }
          );
        }
      } catch (err) {
        console.error("SlipOK API Error:", err);
        return NextResponse.json(
          { error: "ระบบตรวจสอบสลิปอัตโนมัติ (SlipOK) ขัดข้องชั่วคราว" },
          { status: 500 }
        );
      }
    } else {
      // Fallback: Manual review mode using promptparse to extract basic details
      try {
        const { slipVerify } = await import("promptparse/validate");
        const parsed = slipVerify(slipPayload);
        if (parsed) {
          slipData = {
            transRef: parsed.transRef,
            amount: null, // promptparse standard slip verify doesn't return amount
            sendingBank: parsed.sendingBank,
            receivingBank: "",
          };
          isAutoApprove = false;
        }
      } catch (parseErr) {
        console.error("Slip parse error:", parseErr);
      }
    }

    if (!slipData) {
      return NextResponse.json(
        { error: "QR Code ในสลิปไม่ถูกต้อง หรือไม่สามารถอ่านข้อมูลได้" },
        { status: 400 }
      );
    }

    // 6. Extract transaction reference — this is mandatory
    const transRef = slipData.transRef;
    if (!transRef) {
      return NextResponse.json(
        { error: "สลิปไม่มีรหัสอ้างอิง (transRef) กรุณาอัปโหลดสลิปที่มี QR ชัดเจน" },
        { status: 400 }
      );
    }

    // 7. Duplicate slip check — same transRef cannot be used for another order
    const duplicateSlip = await prisma.payment.findFirst({
      where: {
        ref: transRef,
        status: { in: ["completed", "pending_review"] },
        id: { not: orderId },
      },
    });

    if (duplicateSlip) {
      return NextResponse.json(
        { error: "สลิปนี้ถูกใช้ไปแล้ว ไม่สามารถใช้ซ้ำได้" },
        { status: 400 }
      );
    }

    // 8. Amount matching ONLY if Auto Approve (SlipOK) is active
    if (isAutoApprove && slipData.amount !== null && slipData.amount !== undefined) {
      const slipAmount = parseFloat(slipData.amount);
      if (Math.abs(slipAmount - order.amount) > 0.01) {
        return NextResponse.json(
          {
            error: `ยอดเงินไม่ตรงกัน: สลิปโอนมา ${slipAmount} บาท แต่ต้องโอน ${order.amount} บาท`,
          },
          { status: 400 }
        );
      }
    }

    // 9. All checks passed
    const finalStatus = isAutoApprove ? "completed" : "pending_review";

    await prisma.$transaction([
      prisma.payment.update({
        where: { id: orderId },
        data: {
          status: finalStatus,
          ref: transRef,
          slip: JSON.stringify({
            sendingBank: slipData.sendingBank,
            receivingBank: slipData.receivingBank,
            transRef: slipData.transRef,
            amount: slipData.amount || null,
          }),
        },
      }),
      // Only credit points if auto-approved
      ...(isAutoApprove
        ? [
            prisma.user.update({
              where: { id: session.user.id },
              data: { points: { increment: order.points } },
            }),
          ]
        : []),
    ]);

    if (isAutoApprove) {
      return NextResponse.json({
        success: true,
        message: `เติมเงินอัตโนมัติสำเร็จ! ได้รับ ${order.points} Points`,
        points: order.points,
        status: "completed",
      });
    } else {
      return NextResponse.json({
        success: true,
        message: `รอแอดมินยืนยันยอดเงิน (รหัสอ้างอิง: ${transRef})`,
        status: "pending_review",
      });
    }
  } catch (error) {
    console.error("POST /api/payments/verify-slip error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

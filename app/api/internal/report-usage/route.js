// app/api/internal/report-usage/route.js
// เรียกโดย VPS Tunnel Server ทุก 30 วินาที และตอน session ปิด

import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";

export async function POST(req) {
  // ─── ตรวจ internal secret ───────────────────────────────────────────
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { keyId, rxBytes, txBytes } = body || {};

  if (!keyId || rxBytes === undefined || txBytes === undefined) {
    return NextResponse.json({ ok: false, reason: "missing_fields" }, { status: 400 });
  }

  // ─── เพิ่ม bytes เข้า DB แบบ atomic (increment) ────────────────────
  try {
    const now = new Date();
    const currentHour = new Date(now.getFullYear(), now.getMonth(), now.getDate(), now.getHours());

    await prisma.$transaction([
      prisma.apiKey.updateMany({
        where: { id: keyId },
        data: {
          rxBytes:    { increment: BigInt(rxBytes) },
          txBytes:    { increment: BigInt(txBytes) },
          lastUsedAt: now,
        },
      }),
      prisma.bandwidthLog.upsert({
        where: {
          apiKeyId_timestamp: {
            apiKeyId: keyId,
            timestamp: currentHour
          }
        },
        update: {
          rxBytes: { increment: BigInt(rxBytes) },
          txBytes: { increment: BigInt(txBytes) },
        },
        create: {
          apiKeyId: keyId,
          timestamp: currentHour,
          rxBytes: BigInt(rxBytes),
          txBytes: BigInt(txBytes),
        }
      })
    ]);

    return NextResponse.json({ ok: true });
  } catch (error) {
    console.error("POST /api/internal/report-usage error:", error);
    return NextResponse.json({ ok: false, reason: "internal_error" }, { status: 500 });
  }
}

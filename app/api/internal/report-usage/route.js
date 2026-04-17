import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";

export async function POST(req) {
  const secret = req.headers.get("x-internal-secret");
  if (!secret || secret !== process.env.INTERNAL_SECRET) {
    return NextResponse.json({ ok: false }, { status: 401 });
  }

  const body = await req.json().catch(() => null);
  const { keyId, rxBytes, txBytes } = body || {};

  if (!keyId || rxBytes === undefined || txBytes === undefined) {
    return NextResponse.json(
      { ok: false, reason: "missing_fields" },
      { status: 400 }
    );
  }

  try {
    const existingKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: { id: true },
    });

    if (!existingKey) {
      return NextResponse.json(
        { ok: false, reason: "key_not_found" },
        { status: 404 }
      );
    }

    const now = new Date();
    const currentHour = new Date(
      now.getFullYear(),
      now.getMonth(),
      now.getDate(),
      now.getHours()
    );

    let retries = 3;
    while (retries > 0) {
      try {
        await prisma.apiKey.updateMany({
          where: { id: keyId },
          data: {
            rxBytes: { increment: BigInt(rxBytes) },
            txBytes: { increment: BigInt(txBytes) },
            lastUsedAt: now,
          },
        });

        try {
          await prisma.bandwidthLog.update({
            where: {
              apiKeyId_timestamp: { apiKeyId: keyId, timestamp: currentHour },
            },
            data: {
              rxBytes: { increment: BigInt(rxBytes) },
              txBytes: { increment: BigInt(txBytes) },
            },
          });
        } catch (updateErr) {
          if (updateErr.code === "P2025") {
            await prisma.bandwidthLog.create({
              data: {
                apiKeyId: keyId,
                timestamp: currentHour,
                rxBytes: BigInt(rxBytes),
                txBytes: BigInt(txBytes),
              },
            });
          } else {
            throw updateErr;
          }
        }

        break;
      } catch (err) {
        if (
          err.code === "P2002" ||
          err.code === "1020" ||
          (err.message && err.message.includes("1020"))
        ) {
          retries -= 1;
          if (retries === 0) {
            throw err;
          }
          await new Promise((resolve) =>
            setTimeout(resolve, Math.random() * 50 + 10)
          );
        } else {
          throw err;
        }
      }
    }

    const updatedKey = await prisma.apiKey.findUnique({
      where: { id: keyId },
      select: {
        status: true,
        rxBytes: true,
        txBytes: true,
        user: {
          select: {
            plan: {
              select: { bandwidthGB: true },
            },
          },
        },
      },
    });

    let shouldDisconnect = false;
    if (updatedKey?.user?.plan) {
      const limitBytes =
        BigInt(updatedKey.user.plan.bandwidthGB) * 1_000_000_000n;
      const usedBytes = updatedKey.rxBytes + updatedKey.txBytes;

      if (usedBytes >= limitBytes) {
        shouldDisconnect = true;
        if (updatedKey.status !== "suspended") {
          await prisma.apiKey.update({
            where: { id: keyId },
            data: { status: "suspended" },
          });
        }
      }
    }

    return NextResponse.json({
      ok: true,
      shouldDisconnect,
      reason: shouldDisconnect ? "quota_exceeded" : null,
    });
  } catch (error) {
    console.error("POST /api/internal/report-usage error:", error);
    return NextResponse.json(
      { ok: false, reason: "internal_error" },
      { status: 500 }
    );
  }
}

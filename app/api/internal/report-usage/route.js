import { NextResponse } from "next/server";
import { prisma } from "@/lib/auth";

export async function POST(req) {
  const token = req.headers.get("x-node-token");
  if (!token) {
    return NextResponse.json({ ok: false, reason: "missing_token" }, { status: 401 });
  }

  const node = await prisma.node.findUnique({ where: { token } });
  if (!node || !node.isActive) {
    return NextResponse.json({ ok: false, reason: "unauthorized_node" }, { status: 401 });
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
      select: { id: true, lastUsedAt: true, status: true, createdAt: true },
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

    // --- LAZY 30-DAY CYCLE RESET LOGIC ---
    let isNewCycle = false;
    if (existingKey.lastUsedAt && existingKey.createdAt) {
      const MS_PER_30_DAYS = 30 * 24 * 60 * 60 * 1000;
      const lastCycle = Math.floor((existingKey.lastUsedAt.getTime() - existingKey.createdAt.getTime()) / MS_PER_30_DAYS);
      const currentCycle = Math.floor((now.getTime() - existingKey.createdAt.getTime()) / MS_PER_30_DAYS);
      isNewCycle = currentCycle > lastCycle;
    }

    if (isNewCycle) {
      console.log(`[Lazy Reset] Triggered 30-day cycle reset for Key ${keyId}`);
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          rxBytes: 0,
          txBytes: 0,
          status: existingKey.status === "suspended" ? "active" : existingKey.status
        }
      });
    }
    // ------------------------

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

        await prisma.bandwidthLog.upsert({
          where: {
            apiKeyId_timestamp: { apiKeyId: keyId, timestamp: currentHour },
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
          },
        });

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

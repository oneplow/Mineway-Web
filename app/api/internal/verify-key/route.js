import { prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Internal endpoint — only Tunnel Server can call this
// Protected by x-internal-secret header
export async function POST(req) {
  try {
    // Verify internal secret
    const secret = req.headers.get("x-internal-secret");
    if (!secret || secret !== process.env.INTERNAL_SECRET) {
      return NextResponse.json({ valid: false, reason: "unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { key_hash } = body;

    if (!key_hash) {
      return NextResponse.json({ valid: false, reason: "missing_key_hash" }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash: key_hash },
      include: { user: { include: { plan: true } } },
    });

    if (!apiKey || apiKey.status !== "active") {
      return NextResponse.json({ valid: false, reason: "invalid_or_inactive" });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }

    // Check bandwidth quota
    const plan = apiKey.user.plan;
    if (plan) {
      const limitBytes = BigInt(plan.bandwidthGB) * 1_000_000_000n;
      const usedBytes = apiKey.rxBytes + apiKey.txBytes;
      if (usedBytes >= limitBytes) {
        return NextResponse.json({ valid: false, reason: "quota_exceeded" });
      }
    }

    // Update lastUsedAt
    await prisma.apiKey.update({
      where: { id: apiKey.id },
      data: { lastUsedAt: new Date() },
    });

    return NextResponse.json({
      valid: true,
      keyId: apiKey.id,
      userId: apiKey.userId,
      plan: plan?.name ?? "free",
      maxPlayers: plan?.maxPlayers ?? 5,
      bandwidthRemaining: plan
        ? Number(BigInt(plan.bandwidthGB) * 1_000_000_000n - (apiKey.rxBytes + apiKey.txBytes))
        : null,
    });
  } catch (error) {
    console.error("POST /api/internal/verify-key error:", error);
    return NextResponse.json({ valid: false, reason: "internal_error" }, { status: 500 });
  }
}

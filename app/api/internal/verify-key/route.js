import { prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

// Internal endpoint — only Tunnel Server can call this
// Protected by x-internal-secret header
export async function POST(req) {
  try {
    // Verify node token
    const token = req.headers.get("x-node-token");
    if (!token) {
      return NextResponse.json({ valid: false, reason: "missing_token" }, { status: 401 });
    }

    const node = await prisma.node.findUnique({ where: { token } });
    if (!node || !node.isActive) {
      return NextResponse.json({ valid: false, reason: "unauthorized_node" }, { status: 401 });
    }

    const body = await req.json();
    const { key_hash } = body;

    if (!key_hash) {
      return NextResponse.json({ valid: false, reason: "missing_key_hash" }, { status: 400 });
    }

    const apiKey = await prisma.apiKey.findUnique({
      where: { keyHash: key_hash },
      include: { user: { include: { plan: true } }, domain: { include: { node: true } } },
    });

    if (!apiKey || apiKey.status !== "active") {
      return NextResponse.json({ valid: false, reason: "invalid_or_inactive" });
    }

    // Reject if key is already connected on another server
    if (apiKey.isConnected) {
      return NextResponse.json({ valid: false, reason: "already_connected" });
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

    // ── Dynamic Port Assignment (ngrok-style) ──────────────────────────
    // If no port assigned yet, assign one now (on first plugin connection)
    let assignedPort = apiKey.assignedPort;

    if (!assignedPort) {
      const portRangeStart = parseInt(process.env.PORT_RANGE_START || "10000", 10);
      const portRangeEnd = parseInt(process.env.PORT_RANGE_END || "60000", 10);
      const totalRange = portRangeEnd - portRangeStart + 1;

      const usedPorts = await prisma.apiKey.findMany({
        where: { assignedPort: { not: null } },
        select: { assignedPort: true },
      });

      const usedPortSet = new Set(usedPorts.map((p) => p.assignedPort));

      if (usedPortSet.size >= totalRange) {
        return NextResponse.json({ valid: false, reason: "no_available_ports" });
      }

      // Pick a random available port
      do {
        assignedPort = portRangeStart + Math.floor(Math.random() * totalRange);
      } while (usedPortSet.has(assignedPort));

      // Save to DB — this port persists for future reconnections
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { assignedPort, lastUsedAt: new Date() },
      });

      console.log(`[verify-key] Dynamically assigned port ${assignedPort} to key ${apiKey.id}`);
    } else {
      // Update lastUsedAt
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
    }

    // Build full subdomain string
    const fullSubdomain = apiKey.subdomain && apiKey.domain
      ? `${apiKey.subdomain}.${apiKey.domain.domain}`
      : null;

    return NextResponse.json({
      valid: true,
      keyId: apiKey.id,
      userId: apiKey.userId,
      assignedPort,
      isCustomPort: apiKey.isCustomPort || false,
      subdomain: fullSubdomain,
      nodeName: apiKey.domain?.node?.name || "Unknown Node",
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

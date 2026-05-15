import { prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

const PORT_ASSIGNMENT_ATTEMPTS = 16;

function randomPort(start, totalRange) {
  return start + crypto.randomInt(totalRange);
}

function isUniqueConstraintError(error) {
  return error?.code === "P2002";
}

function isMissingRecordError(error) {
  return error?.code === "P2025";
}

async function assignAvailablePort(apiKeyId) {
  const portRangeStart = parseInt(process.env.PORT_RANGE_START || "10000", 10);
  const portRangeEnd = parseInt(process.env.PORT_RANGE_END || "60000", 10);
  const totalRange = portRangeEnd - portRangeStart + 1;

  if (!Number.isInteger(portRangeStart) || !Number.isInteger(portRangeEnd) || totalRange <= 0) {
    throw new Error("invalid_port_range");
  }

  const usedPorts = await prisma.apiKey.findMany({
    where: { assignedPort: { not: null } },
    select: { assignedPort: true },
  });
  const usedPortSet = new Set(usedPorts.map((p) => p.assignedPort));

  if (usedPortSet.size >= totalRange) {
    return null;
  }

  for (let attempt = 0; attempt < PORT_ASSIGNMENT_ATTEMPTS; attempt += 1) {
    const assignedPort = randomPort(portRangeStart, totalRange);
    if (usedPortSet.has(assignedPort)) {
      continue;
    }

    try {
      const result = await prisma.apiKey.updateMany({
        where: { id: apiKeyId, assignedPort: null },
        data: { assignedPort, lastUsedAt: new Date() },
      });
      if (result.count === 1) {
        return assignedPort;
      }
      throw new Error("P2025"); // Simulate missing record if count is 0
    } catch (error) {
      if (error.message === "P2025" || isMissingRecordError(error)) {
        const currentKey = await prisma.apiKey.findUnique({
          where: { id: apiKeyId },
          select: { assignedPort: true },
        });
        return currentKey?.assignedPort ?? null;
      }
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
      usedPortSet.add(assignedPort);
    }
  }

  const refreshedPorts = await prisma.apiKey.findMany({
    where: { assignedPort: { not: null } },
    select: { assignedPort: true },
  });
  const refreshedPortSet = new Set(refreshedPorts.map((p) => p.assignedPort));

  for (let assignedPort = portRangeStart; assignedPort <= portRangeEnd; assignedPort += 1) {
    if (refreshedPortSet.has(assignedPort)) {
      continue;
    }

    try {
      const result = await prisma.apiKey.updateMany({
        where: { id: apiKeyId, assignedPort: null },
        data: { assignedPort, lastUsedAt: new Date() },
      });
      if (result.count === 1) {
        return assignedPort;
      }
      throw new Error("P2025"); // Simulate missing record
    } catch (error) {
      if (error.message === "P2025" || isMissingRecordError(error)) {
        const currentKey = await prisma.apiKey.findUnique({
          where: { id: apiKeyId },
          select: { assignedPort: true },
        });
        return currentKey?.assignedPort ?? null;
      }
      if (!isUniqueConstraintError(error)) {
        throw error;
      }
    }
  }

  return null;
}

export async function POST(req) {
  try {
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

    if (apiKey.isConnected) {
      return NextResponse.json({ valid: false, reason: "already_connected" });
    }

    if (apiKey.expiresAt && apiKey.expiresAt < new Date()) {
      return NextResponse.json({ valid: false, reason: "expired" });
    }

    const plan = apiKey.user.plan;
    if (plan) {
      const limitBytes = BigInt(plan.bandwidthGB) * 1_000_000_000n;
      const usedBytes = BigInt(apiKey.rxBytes) + BigInt(apiKey.txBytes);
      if (usedBytes >= limitBytes) {
        return NextResponse.json({ valid: false, reason: "quota_exceeded" });
      }
    }

    let assignedPort = apiKey.assignedPort;

    if (!assignedPort) {
      assignedPort = await assignAvailablePort(apiKey.id);
      if (!assignedPort) {
        return NextResponse.json({ valid: false, reason: "no_available_ports" });
      }

      console.log(`[verify-key] Dynamically assigned port ${assignedPort} to key ${apiKey.id}`);
    } else {
      await prisma.apiKey.update({
        where: { id: apiKey.id },
        data: { lastUsedAt: new Date() },
      });
    }

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
        ? Number(BigInt(plan.bandwidthGB) * 1_000_000_000n - (BigInt(apiKey.rxBytes) + BigInt(apiKey.txBytes)))
        : null,
    });
  } catch (error) {
    console.error("POST /api/internal/verify-key error:", error);
    return NextResponse.json({ valid: false, reason: "internal_error" }, { status: 500 });
  }
}

import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

const MS_PER_30_DAYS = 30 * 24 * 60 * 60 * 1000;

function isNewCycle(key, now) {
  if (!key.lastUsedAt || !key.createdAt) {
    return false;
  }

  const lastCycle = Math.floor(
    (key.lastUsedAt.getTime() - key.createdAt.getTime()) / MS_PER_30_DAYS
  );
  const currentCycle = Math.floor(
    (now.getTime() - key.createdAt.getTime()) / MS_PER_30_DAYS
  );

  return currentCycle > lastCycle;
}

function serializeKey(key, now) {
  const reset = isNewCycle(key, now);

  return {
    id: key.id,
    userId: key.userId,
    name: key.name,
    subdomain:
      key.subdomain && key.domain
        ? `${key.subdomain}.${key.domain.domain}`
        : null,
    prefix: key.prefix,
    region: key.region,
    assignedPort: key.assignedPort,
    isCustomPort: key.isCustomPort,
    status: reset && key.status === "suspended" ? "active" : key.status,
    isConnected: key.isConnected,
    connectedAt: key.connectedAt,
    rxBytes: reset ? 0 : Number(key.rxBytes),
    txBytes: reset ? 0 : Number(key.txBytes),
    expiresAt: key.expiresAt,
    createdAt: key.createdAt,
  };
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const now = new Date();
    const [allKeys, domains] = await Promise.all([
      prisma.apiKey.findMany({
        where: {
          userId: session.user.id,
          status: { not: "deleted" },
        },
        orderBy: { createdAt: "desc" },
        include: {
          domain: true,
        },
      }),
      prisma.domain.findMany({
        where: { isActive: true },
        orderBy: [{ isDefault: "desc" }, { domain: "asc" }],
        select: {
          id: true,
          domain: true,
          description: true,
          isDefault: true,
          nodeId: true,
        },
      }),
    ]);

    return NextResponse.json({
      keys: allKeys.map((key) => serializeKey(key, now)),
      sharedKeys: [],
      domains,
    });
  } catch (error) {
    console.error("GET /api/overview/bootstrap error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

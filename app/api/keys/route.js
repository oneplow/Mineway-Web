import { Prisma } from "@prisma/client";
import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSrvRecord } from "@/lib/cloudflare";

function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const allKeys = await prisma.apiKey.findMany({
      where: {
        OR: [
          { userId: session.user.id },
          { collaborators: { some: { userId: session.user.id } } },
        ],
      },
      orderBy: { createdAt: "desc" },
      include: {
        domain: true,
        collaborators: {
          where: { userId: session.user.id },
          select: { role: true },
        },
      },
    });

    const myKeys = allKeys.filter((key) => key.userId === session.user.id);
    const sharedKeys = allKeys.filter((key) => key.userId !== session.user.id);

    const serialize = (key) => ({
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
      status: key.status,
      rxBytes: Number(key.rxBytes),
      txBytes: Number(key.txBytes),
      expiresAt: key.expiresAt,
      createdAt: key.createdAt,
      role: key.collaborators?.[0]?.role,
    });

    return NextResponse.json({
      keys: myKeys.map(serialize),
      sharedKeys: sharedKeys.map(serialize),
    });
  } catch (error) {
    console.error("GET /api/keys error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { name, region, domainId, isCustomPort } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = generateSlug(name);
    if (!slug || slug.length < 3 || slug.length > 32) {
      return NextResponse.json(
        {
          error:
            "Tunnel name must use letters or numbers only and be 3-32 characters long",
        },
        { status: 400 }
      );
    }

    let selectedDomain;
    if (domainId) {
      selectedDomain = await prisma.domain.findFirst({
        where: { id: domainId, isActive: true },
      });
      if (!selectedDomain) {
        return NextResponse.json(
          { error: "Selected domain is unavailable" },
          { status: 400 }
        );
      }
    } else {
      selectedDomain =
        (await prisma.domain.findFirst({
          where: { isDefault: true, isActive: true },
        })) ||
        (await prisma.domain.findFirst({ where: { isActive: true } }));

      if (!selectedDomain) {
        return NextResponse.json(
          { error: "No active domain is configured" },
          { status: 500 }
        );
      }
    }

    const [existingName, existingSubdomain, user, siteSettings] =
      await Promise.all([
        prisma.apiKey.findFirst({
          where: { userId: session.user.id, name: name.trim() },
        }),
        prisma.apiKey.findFirst({
          where: { subdomain: slug, domainId: selectedDomain.id },
        }),
        prisma.user.findUnique({
          where: { id: session.user.id },
          include: { plan: true, apiKeys: { select: { id: true } } },
        }),
        prisma.siteSetting.findMany({
          where: {
            key: { in: ["customPortPrice", "defaultTunnelExpiryDays"] },
          },
        }),
      ]);

    if (existingName) {
      return NextResponse.json(
        { error: `You already have a tunnel named "${name.trim()}"` },
        { status: 409 }
      );
    }

    if (existingSubdomain) {
      return NextResponse.json(
        { error: `${slug}.${selectedDomain.domain} is already in use` },
        { status: 409 }
      );
    }

    const maxKeys = (user?.plan?.maxKeys || 1) + (user?.extraKeys || 0);
    if (!user || user.apiKeys.length >= maxKeys) {
      return NextResponse.json(
        { error: `You have reached your API key quota (${maxKeys})` },
        { status: 403 }
      );
    }

    const settingsMap = siteSettings.reduce((acc, setting) => {
      acc[setting.key] = setting.value;
      return acc;
    }, {});

    const customPortPrice =
      Number.parseInt(settingsMap.customPortPrice, 10) || 500;
    const expiryDays =
      Number.parseInt(settingsMap.defaultTunnelExpiryDays, 10) || 30;

    if (isCustomPort && user.points < customPortPrice) {
      return NextResponse.json(
        { error: `You need ${customPortPrice} points to use a custom port` },
        { status: 403 }
      );
    }

    const rawSecret = crypto.randomBytes(24).toString("base64url");
    const tunnelHost =
      process.env.TUNNEL_NODE_HOST || `tunnel.${selectedDomain.domain}`;
    const tunnelPort = process.env.TUNNEL_NODE_PORT || "443";
    const encodedPayload = Buffer.from(
      `${tunnelHost}:${tunnelPort}|${rawSecret}`
    ).toString("base64url");
    const rawKey = `mw_live_${encodedPayload}`;
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
    const prefix = `mw_live_${encodedPayload.slice(0, 8)}`;

    const portRangeStart = Number.parseInt(
      process.env.PORT_RANGE_START || "10000",
      10
    );
    const portRangeEnd = Number.parseInt(
      process.env.PORT_RANGE_END || "60000",
      10
    );

    const newKey = await prisma.$transaction(
      async (tx) => {
        const transactionalUser = await tx.user.findUnique({
          where: { id: session.user.id },
          include: { plan: true, apiKeys: { select: { id: true } } },
        });

        const transactionalMaxKeys =
          (transactionalUser?.plan?.maxKeys || 1) +
          (transactionalUser?.extraKeys || 0);

        if (
          !transactionalUser ||
          transactionalUser.apiKeys.length >= transactionalMaxKeys
        ) {
          throw new Error("KEY_LIMIT_REACHED");
        }

        if (isCustomPort && transactionalUser.points < customPortPrice) {
          throw new Error("INSUFFICIENT_POINTS");
        }

        // Only assign port at creation for Custom Port (VIP) users
        // Regular users get port dynamically when plugin connects (ngrok-style)
        let assignedPort = null;

        if (isCustomPort) {
          const usedPorts = await tx.apiKey.findMany({
            where: { assignedPort: { not: null } },
            select: { assignedPort: true },
          });

          const usedPortSet = new Set(usedPorts.map((p) => p.assignedPort));
          const totalRange = portRangeEnd - portRangeStart + 1;

          if (usedPortSet.size >= totalRange) {
            throw new Error("NO_AVAILABLE_PORTS");
          }

          do {
            assignedPort =
              portRangeStart +
              Math.floor(Math.random() * totalRange);
          } while (usedPortSet.has(assignedPort));

          await tx.user.update({
            where: { id: session.user.id },
            data: { points: { decrement: customPortPrice } },
          });
        }

        return tx.apiKey.create({
          data: {
            userId: session.user.id,
            name: name.trim(),
            subdomain: slug,
            domainId: selectedDomain.id,
            prefix,
            keyHash,
            region: region || "ap-southeast-1",
            assignedPort,
            isCustomPort: Boolean(isCustomPort),
            status: "active",
            expiresAt: new Date(
              Date.now() + expiryDays * 24 * 60 * 60 * 1000
            ),
          },
        });
      },
      { isolationLevel: Prisma.TransactionIsolationLevel.Serializable }
    );

    if (isCustomPort && newKey.assignedPort) {
      if (selectedDomain.cloudflareZoneId) {
        try {
          await createSrvRecord({
            zoneId: selectedDomain.cloudflareZoneId,
            subdomain: slug,
            domain: selectedDomain.domain,
            port: newKey.assignedPort,
            targetIp: selectedDomain.domain,
          });
        } catch (srvError) {
          console.error("SRV Error:", srvError);
        }
      } else {
        console.warn(
          `isCustomPort requested but domain ${selectedDomain.domain} has no zoneId.`
        );
      }
    }

    return NextResponse.json(
      {
        id: newKey.id,
        name: newKey.name,
        subdomain: `${slug}.${selectedDomain.domain}`,
        prefix: newKey.prefix,
        region: newKey.region,
        assignedPort: newKey.assignedPort,
        status: newKey.status,
        rxBytes: Number(newKey.rxBytes),
        txBytes: Number(newKey.txBytes),
        expiresAt: newKey.expiresAt,
        createdAt: newKey.createdAt,
        keyValue: rawKey,
      },
      { status: 201 }
    );
  } catch (error) {
    console.error("POST /api/keys error:", error);

    if (error.message === "KEY_LIMIT_REACHED") {
      return NextResponse.json(
        { error: "API key quota exceeded" },
        { status: 403 }
      );
    }

    if (error.message === "INSUFFICIENT_POINTS") {
      return NextResponse.json(
        { error: "Not enough points for custom port" },
        { status: 403 }
      );
    }

    if (error.message === "NO_AVAILABLE_PORTS") {
      return NextResponse.json(
        { error: "No available ports found (System Full)" },
        { status: 500 }
      );
    }

    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

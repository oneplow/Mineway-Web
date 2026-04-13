import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";
import { createSrvRecord } from "@/lib/cloudflare";

// Convert a name to a valid subdomain slug (e-g. "Survival Server" -> "survival-server")
function generateSlug(name) {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9\s-]/g, "") // Remove special characters
    .replace(/\s+/g, "-")         // Replace spaces with hyphens
    .replace(/-+/g, "-")          // Remove consecutive hyphens
    .replace(/^-|-$/g, "");       // Remove leading/trailing hyphens
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
          { collaborators: { some: { userId: session.user.id } } }
        ]
      },
      orderBy: { createdAt: "desc" },
      include: { domain: true, collaborators: { where: { userId: session.user.id }, select: { role: true } } },
    });

    const myKeys = allKeys.filter(k => k.userId === session.user.id);
    const sharedKeys = allKeys.filter(k => k.userId !== session.user.id);

    const serializer = (k) => {
      const subdomainStr = k.subdomain && k.domain 
        ? `${k.subdomain}.${k.domain.domain}` 
        : null;

      return {
        id: k.id,
        userId: k.userId,
        name: k.name,
        subdomain: subdomainStr,
        prefix: k.prefix,
        region: k.region,
        assignedPort: k.assignedPort,
        isCustomPort: k.isCustomPort,
        status: k.status,
        rxBytes: Number(k.rxBytes),
        txBytes: Number(k.txBytes),
        expiresAt: k.expiresAt,
        createdAt: k.createdAt,
        role: k.collaborators?.[0]?.role
      };
    };

    return NextResponse.json({
      keys: myKeys.map(serializer),
      sharedKeys: sharedKeys.map(serializer)
    });
  } catch (error) {
    console.error("GET /api/keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
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
        { error: "ชื่อ Tunnel ต้องเป็นภาษาอังกฤษ/ตัวเลข ความยาว 3-32 ตัวอักษรเท่านั้น (เว้นวรรคได้)" }, 
        { status: 400 }
      );
    }

    // Find the requested domain or fallback to a default active domain
    let selectedDomain;
    if (domainId) {
      selectedDomain = await prisma.domain.findUnique({ where: { id: domainId, isActive: true } });
      if (!selectedDomain) {
        return NextResponse.json({ error: "Domain ที่เลือกไม่สามารถใช้งานได้ หรือถูกปิดใช้งานไปแล้ว" }, { status: 400 });
      }
    } else {
      selectedDomain = await prisma.domain.findFirst({ where: { isDefault: true, isActive: true } }) ||
                       await prisma.domain.findFirst({ where: { isActive: true } });
      
      if (!selectedDomain) {
        return NextResponse.json({ error: "ไม่มี Domain เปิดใช้อยู่ในระบบ กรุณาติดต่อแอดมิน" }, { status: 500 });
      }
    }

    // Check unique subdomain + domain combination
    const existingSubdomain = await prisma.apiKey.findFirst({
      where: { subdomain: slug, domainId: selectedDomain.id }
    });

    if (existingSubdomain) {
      return NextResponse.json(
        { error: `ที่อยู่ ${slug}.${selectedDomain.domain} มีคนใช้งานไปแล้ว กรุณาตั้งชื่ออื่น` },
        { status: 409 }
      );
    }

    // Check plan limit
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: { plan: true, apiKeys: { select: { id: true } } },
    });

    const maxKeys = user?.plan?.maxKeys || 1; // Default to 1 if no plan
    if (user.apiKeys.length >= maxKeys) {
      return NextResponse.json(
        { error: `คุณมี API key ครบ ${maxKeys} keys ตาม plan แล้ว` },
        { status: 403 }
      );
    }

    // Fetch dynamic settings
    const siteSettings = await prisma.siteSetting.findMany({
      where: { key: { in: ["customPortPrice", "defaultTunnelExpiryDays"] } }
    });
    const settingsMap = siteSettings.reduce((acc, s) => { acc[s.key] = s.value; return acc; }, {});
    const VIP_COST = parseInt(settingsMap.customPortPrice) || 500;
    const EXPIRY_DAYS = parseInt(settingsMap.defaultTunnelExpiryDays) || 30;

    if (isCustomPort && user.points < VIP_COST) {
      return NextResponse.json(
        { error: `โควต้า VIP Custom Port ของคุณไม่สามารถใช้งานได้ (ต้องการ ${VIP_COST} Points)` },
        { status: 403 }
      );
    }

    // 1. Generate a cryptographically secure random secret
    const rawSecret = crypto.randomBytes(24).toString("base64url");
    
    // 2. Pack the connection info and secret into a self-contained token
    const tunnelHost = process.env.TUNNEL_NODE_HOST || "tunnel.mineway.io";
    const tunnelPort = process.env.TUNNEL_NODE_PORT || "8765";
    const payloadBuffer = Buffer.from(`${tunnelHost}:${tunnelPort}|${rawSecret}`);
    const encodedPayload = payloadBuffer.toString("base64url");
    
    const rawKey = `mw_live_${encodedPayload}`;

    // 3. Hash the entire key before storing
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    // 4. Create a safe prefix for UI display
    const prefix = `mw_live_${encodedPayload.slice(0, 8)}`;

    // 4. Allocate a dedicated port
    const PORT_START = parseInt(process.env.PORT_RANGE_START || "10000");
    const PORT_END = parseInt(process.env.PORT_RANGE_END || "60000");
    
    let assignedPort;
    let attempts = 0;
    
    while (!assignedPort && attempts < 100) {
      const randomPort = Math.floor(Math.random() * (PORT_END - PORT_START + 1)) + PORT_START;
      const existingPort = await prisma.apiKey.findUnique({
        where: { assignedPort: randomPort },
        select: { id: true },
      });
      if (!existingPort) assignedPort = randomPort;
      attempts++;
    }

    if (!assignedPort) return NextResponse.json({ error: "No available ports found (System Full)" }, { status: 500 });

    // 5. Store in DB & deduct points (using transaction)
    const newKey = await prisma.$transaction(async (tx) => {
      if (isCustomPort) {
        await tx.user.update({
          where: { id: session.user.id },
          data: { points: { decrement: VIP_COST } },
        });
      }

      return await tx.apiKey.create({
        data: {
          userId: session.user.id,
          name: name.trim(),
          subdomain: slug,
          domainId: selectedDomain.id,
          prefix,
          keyHash,
          region: region || "ap-southeast-1",
          assignedPort,
          isCustomPort: !!isCustomPort,
          status: "inactive",
          expiresAt: new Date(Date.now() + EXPIRY_DAYS * 24 * 60 * 60 * 1000),
        },
      });
    });

    // 5.5 Handle Cloudflare SRV Record if requested
    if (isCustomPort) {
      if (selectedDomain.cloudflareZoneId) {
        try {
          await createSrvRecord({
            zoneId: selectedDomain.cloudflareZoneId,
            subdomain: slug,
            domain: selectedDomain.domain,
            port: assignedPort,
            targetIp: selectedDomain.domain,
          });
        } catch (srvError) {
          console.error("SRV Error:", srvError);
          // Non-fatal, but we should probably warn or revert. We'll proceed with warning on server logs.
        }
      } else {
        console.warn(`isCustomPort requested but domain ${selectedDomain.domain} has no zoneId.`);
      }
    }

    // 6. Return response
    return NextResponse.json({
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
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}


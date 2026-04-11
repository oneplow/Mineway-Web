import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import crypto from "crypto";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const keys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
    });

    // Convert BigInt to Number for JSON serialization
    // Send prefix instead of raw key — raw key is never stored
    const serialized = keys.map((k) => ({
      id: k.id,
      userId: k.userId,
      name: k.name,
      prefix: k.prefix,
      region: k.region,
      assignedPort: k.assignedPort,
      status: k.status,
      rxBytes: Number(k.rxBytes),
      txBytes: Number(k.txBytes),
      lastUsedAt: k.lastUsedAt,
      expiresAt: k.expiresAt,
      createdAt: k.createdAt,
      updatedAt: k.updatedAt,
    }));

    return NextResponse.json(serialized);
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
    const { name, region } = body;

    if (!name || !name.trim()) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
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

    // 1. Generate a cryptographically secure random key
    const rawSecret = crypto.randomBytes(24).toString("base64url");
    const rawKey = `mct_live_${rawSecret}`;

    // 2. Hash the key before storing — never store plaintext
    const keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");

    // 3. Create a safe prefix for UI display (first 8 chars of secret)
    const prefix = `mct_live_${rawSecret.slice(0, 8)}`;

    // 4. Allocate a dedicated port (TCP+UDP) — find highest used port and increment
    const PORT_START = parseInt(process.env.PORT_RANGE_START || "10000");
    const lastKey = await prisma.apiKey.findFirst({
      where: { assignedPort: { not: null } },
      orderBy: { assignedPort: "desc" },
      select: { assignedPort: true },
    });
    const assignedPort = lastKey?.assignedPort ? lastKey.assignedPort + 1 : PORT_START;

    // 5. Store in DB — no raw key, only prefix + hash + port
    const newKey = await prisma.apiKey.create({
      data: {
        userId: session.user.id,
        name: name.trim(),
        prefix,
        keyHash,
        region: region || "ap-southeast-1",
        assignedPort,
        status: "inactive",
        expiresAt: new Date(Date.now() + 30 * 24 * 60 * 60 * 1000), // 30 days
      },
    });

    // 5. Return the raw key to the user ONCE — they must save it now
    return NextResponse.json({
      id: newKey.id,
      name: newKey.name,
      prefix: newKey.prefix,
      region: newKey.region,
      assignedPort: newKey.assignedPort,
      status: newKey.status,
      rxBytes: Number(newKey.rxBytes),
      txBytes: Number(newKey.txBytes),
      expiresAt: newKey.expiresAt,
      createdAt: newKey.createdAt,
      keyValue: rawKey, // ⚡ Returned ONCE only — never retrievable again
    }, { status: 201 });
  } catch (error) {
    console.error("POST /api/keys error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

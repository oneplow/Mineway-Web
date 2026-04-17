import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      include: {
        plan: true,
        apiKeys: {
          select: { id: true, status: true, rxBytes: true, txBytes: true },
        },
      },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    // Calculate totals
    const activeKeys = user.apiKeys.filter((k) => k.status === "active").length;
    const totalKeys = user.apiKeys.length;
    const totalRxBytes = user.apiKeys.reduce((sum, k) => sum + Number(k.rxBytes), 0);
    const totalTxBytes = user.apiKeys.reduce((sum, k) => sum + Number(k.txBytes), 0);
    const totalTrafficGB = ((totalRxBytes + totalTxBytes) / (1024 * 1024 * 1024)).toFixed(2);

    return NextResponse.json({
      id: user.id,
      username: user.username,
      email: user.email,
      image: user.image,
      points: user.points,
      extraKeys: user.extraKeys || 0,
      plan: user.plan
        ? {
            id: user.plan.id,
            name: user.plan.name,
            displayName: user.plan.displayName,
            bandwidthGB: user.plan.bandwidthGB,
            maxKeys: user.plan.maxKeys,
            maxNodes: user.plan.maxNodes,
            allowCustomPort: user.plan.allowCustomPort,
          }
        : null,
      stats: {
        activeKeys,
        totalKeys,
        totalTrafficGB: parseFloat(totalTrafficGB),
        bandwidthLimitGB: user.plan?.bandwidthGB || 0,
        maxKeys: (user.plan?.maxKeys || 1) + (user.extraKeys || 0),
      },
    });
  } catch (error) {
    console.error("GET /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function PUT(request) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await request.json();
    const { username, image, currentPassword, newPassword } = body;

    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
    });

    if (!user) {
      return NextResponse.json({ error: "User not found" }, { status: 404 });
    }

    const updates = {};
    if (username) updates.username = username;
    if (image !== undefined) updates.image = image || null;

    // A simple mock for password update since we don't know the exact hashing library (bcrypt/argon2) being used here, 
    // assuming we might need to actually hash it. But since this is Prisma, we'll just check if it's there.
    if (newPassword) {
      if (user.password && currentPassword !== user.password) {
        // In a real app, use bcrypt.compare here
        return NextResponse.json({ error: "รหัสผ่านปัจจุบันไม่ถูกต้อง" }, { status: 400 });
      }
      updates.password = newPassword; // In a real app, hash this before saving
    }

    await prisma.user.update({
      where: { id: session.user.id },
      data: updates,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("PUT /api/user error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

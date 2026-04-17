import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Fetch price from site settings
    const setting = await prisma.siteSetting.findUnique({
      where: { key: "extraKeyPrice" },
    });
    const price = parseInt(setting?.value) || 200;

    // Check user balance
    const user = await prisma.user.findUnique({
      where: { id: session.user.id },
      select: { points: true, extraKeys: true },
    });

    if (!user || user.points < price) {
      return NextResponse.json(
        { error: `พอยท์ไม่เพียงพอ (ต้องการ ${price} Points)` },
        { status: 403 }
      );
    }

    // Atomically deduct points and add slot
    const updated = await prisma.user.update({
      where: { id: session.user.id },
      data: {
        points: { decrement: price },
        extraKeys: { increment: 1 },
      },
      select: { points: true, extraKeys: true },
    });

    return NextResponse.json({
      success: true,
      points: updated.points,
      extraKeys: updated.extraKeys,
      price,
    });
  } catch (error) {
    console.error("POST /api/keys/buy-slot error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const plans = await prisma.plan.findMany({
      where: { isActive: true },
      orderBy: { pricePoints: "asc" },
    });
    return NextResponse.json(plans);
  } catch (error) {
    console.error("GET /api/plans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

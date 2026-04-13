import { prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

// Public API — returns all settings as a key-value object
export async function GET() {
  try {
    const settings = await prisma.siteSetting.findMany();

    // Convert list to key-value object
    const config = settings.reduce((acc, s) => {
      acc[s.key] = s.value;
      return acc;
    }, {});

    return NextResponse.json(config);
  } catch (error) {
    console.error("GET /api/settings error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

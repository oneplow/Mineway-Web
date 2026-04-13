import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET — List active domains (for user to choose when creating a tunnel)
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domains = await prisma.domain.findMany({
      where: { isActive: true },
      orderBy: [{ isDefault: "desc" }, { domain: "asc" }],
      select: {
        id: true,
        domain: true,
        description: true,
        isDefault: true,
      },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error("GET /api/domains error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

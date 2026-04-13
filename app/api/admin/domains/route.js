import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

// GET — List all domains with tunnel count
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const domains = await prisma.domain.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { apiKeys: true } } },
    });

    return NextResponse.json(domains);
  } catch (error) {
    console.error("GET /api/admin/domains error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create a new domain
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { domain, description, isDefault, cloudflareZoneId } = body;

    if (!domain || !domain.trim()) {
      return NextResponse.json({ error: "Domain is required" }, { status: 400 });
    }

    // Validate domain format (e.g. lexten.store, mineway.me)
    const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i;
    const cleanDomain = domain.trim().toLowerCase();
    if (!domainRegex.test(cleanDomain)) {
      return NextResponse.json({ error: "รูปแบบโดเมนไม่ถูกต้อง (เช่น lexten.store)" }, { status: 400 });
    }

    // Check unique
    const existing = await prisma.domain.findUnique({ where: { domain: cleanDomain } });
    if (existing) {
      return NextResponse.json({ error: "โดเมนนี้มีอยู่ในระบบแล้ว" }, { status: 409 });
    }

    // If setting as default, unset previous default
    if (isDefault) {
      await prisma.domain.updateMany({ where: { isDefault: true }, data: { isDefault: false } });
    }

    const newDomain = await prisma.domain.create({
      data: {
        domain: cleanDomain,
        description: description?.trim() || null,
        cloudflareZoneId: cloudflareZoneId?.trim() || null,
        isDefault: isDefault || false,
      },
      include: { _count: { select: { apiKeys: true } } },
    });

    return NextResponse.json(newDomain, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/domains error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Update domain (description, isDefault, isActive)
export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id, domain, description, isDefault, isActive, cloudflareZoneId } = body;

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    const existing = await prisma.domain.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "ไม่พบโดเมนนี้" }, { status: 404 });
    }

    // If setting as default, unset previous default
    if (isDefault) {
      await prisma.domain.updateMany({ where: { isDefault: true, NOT: { id } }, data: { isDefault: false } });
    }

    const updateData = {};
    if (domain !== undefined) {
      const cleanDomain = domain.trim().toLowerCase();
      const domainRegex = /^[a-z0-9]([a-z0-9-]*[a-z0-9])?(\.[a-z]{2,})+$/i;
      if (!domainRegex.test(cleanDomain)) {
        return NextResponse.json({ error: "รูปแบบโดเมนไม่ถูกต้อง" }, { status: 400 });
      }
      updateData.domain = cleanDomain;
    }
    if (description !== undefined) updateData.description = description?.trim() || null;
    if (cloudflareZoneId !== undefined) updateData.cloudflareZoneId = cloudflareZoneId?.trim() || null;
    if (isDefault !== undefined) updateData.isDefault = isDefault;
    if (isActive !== undefined) updateData.isActive = isActive;

    const updated = await prisma.domain.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { apiKeys: true } } },
    });

    return NextResponse.json({ success: true, domain: updated });
  } catch (error) {
    console.error("PATCH /api/admin/domains error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Delete a domain
export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { id } = body;

    if (!id) {
      return NextResponse.json({ error: "Domain ID is required" }, { status: 400 });
    }

    // Unlink any apiKeys using this domain before deleting
    await prisma.apiKey.updateMany({
      where: { domainId: id },
      data: { domainId: null },
    });

    await prisma.domain.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "ลบโดเมนเรียบร้อยแล้ว" });
  } catch (error) {
    console.error("DELETE /api/admin/domains error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

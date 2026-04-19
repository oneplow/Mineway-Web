import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import { randomBytes } from "crypto";

// Helper to generate secure token
const generateToken = () => randomBytes(32).toString('hex');

// GET — List all nodes
export async function GET() {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const nodes = await prisma.node.findMany({
      orderBy: { createdAt: "desc" },
      include: { _count: { select: { domains: true } } },
    });

    return NextResponse.json(nodes);
  } catch (error) {
    console.error("GET /api/admin/nodes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// POST — Create a new node
export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { name, url, isActive } = await req.json();

    if (!name || !url) {
      return NextResponse.json({ error: "Name and URL are required" }, { status: 400 });
    }

    // Validate URL
    let cleanUrl = url.trim();
    if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
      cleanUrl = "http://" + cleanUrl;
    }

    const existing = await prisma.node.findUnique({ where: { url: cleanUrl } });
    if (existing) {
      return NextResponse.json({ error: "A Node with this URL already exists" }, { status: 409 });
    }

    const newNode = await prisma.node.create({
      data: {
        name: name.trim(),
        url: cleanUrl,
        token: generateToken(),
        isActive: isActive !== undefined ? isActive : true,
      },
      include: { _count: { select: { domains: true } } },
    });

    return NextResponse.json(newNode, { status: 201 });
  } catch (error) {
    console.error("POST /api/admin/nodes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// PATCH — Update node (name, url, isActive) or regenerate token
export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id, name, url, isActive, regenerateToken } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
    }

    const existing = await prisma.node.findUnique({ where: { id } });
    if (!existing) {
      return NextResponse.json({ error: "Node not found" }, { status: 404 });
    }

    const updateData = {};
    if (name !== undefined) updateData.name = name.trim();
    if (url !== undefined) {
      let cleanUrl = url.trim();
      if (!cleanUrl.startsWith("http://") && !cleanUrl.startsWith("https://")) {
        cleanUrl = "http://" + cleanUrl;
      }
      updateData.url = cleanUrl;
    }
    if (isActive !== undefined) updateData.isActive = isActive;
    if (regenerateToken) updateData.token = generateToken();

    const updated = await prisma.node.update({
      where: { id },
      data: updateData,
      include: { _count: { select: { domains: true } } },
    });

    return NextResponse.json({ success: true, node: updated });
  } catch (error) {
    console.error("PATCH /api/admin/nodes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

// DELETE — Delete a node
export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await req.json();

    if (!id) {
      return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
    }
    
    // Unlink domains before deleting
    await prisma.domain.updateMany({
      where: { nodeId: id },
      data: { nodeId: null },
    });

    await prisma.node.delete({ where: { id } });

    return NextResponse.json({ success: true, message: "Node deleted successfully" });
  } catch (error) {
    console.error("DELETE /api/admin/nodes error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

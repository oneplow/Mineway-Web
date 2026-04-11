import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;
    const body = await req.json();

    // Verify ownership
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    // Build update data — only allow safe fields
    const updateData = {};
    if (body.action === "reset") {
      const crypto = require("crypto");
      const rawSecret = crypto.randomBytes(24).toString("base64url");
      const rawKey = `mw_live_${rawSecret}`;
      updateData.keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      updateData.prefix = `mw_live_${rawSecret.slice(0, 8)}`;
      
      const updated = await prisma.apiKey.update({ where: { id }, data: updateData });
      return NextResponse.json({ ...updated, rxBytes: Number(updated.rxBytes), txBytes: Number(updated.txBytes), keyValue: rawKey });
    }

    if (body.name !== undefined) updateData.name = body.name.trim();
    if (body.region !== undefined) updateData.region = body.region;
    if (body.status !== undefined && ["active", "inactive"].includes(body.status)) {
      updateData.status = body.status;
    }

    const updated = await prisma.apiKey.update({
      where: { id },
      data: updateData,
    });

    return NextResponse.json({
      ...updated,
      rxBytes: Number(updated.rxBytes),
      txBytes: Number(updated.txBytes),
    });
  } catch (error) {
    console.error("PATCH /api/keys/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req, { params }) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { id } = await params;

    // Verify ownership
    const existing = await prisma.apiKey.findUnique({ where: { id } });
    if (!existing || existing.userId !== session.user.id) {
      return NextResponse.json({ error: "Not found" }, { status: 404 });
    }

    await prisma.apiKey.delete({ where: { id } });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/keys/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

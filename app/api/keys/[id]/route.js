import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import { findSrvRecord, deleteSrvRecord } from "@/lib/cloudflare";

async function getTunnelUrl(apiKey) {
  let tunnelUrl = process.env.TUNNEL_SERVER_URL;
  if (!tunnelUrl && apiKey.domainId) {
    const domain = await prisma.domain.findUnique({ where: { id: apiKey.domainId } });
    if (domain) {
      const tunnelHost = process.env.TUNNEL_NODE_HOST || `tunnel.${domain.domain}`;
      const tunnelPort = process.env.TUNNEL_NODE_PORT || "443";
      tunnelUrl = `http://${tunnelHost}:${tunnelPort}`;
    }
  }
  return tunnelUrl || "http://127.0.0.1:8765";
}

async function tunnelCommand(apiKey, command) {
  try {
    const tunnelUrl = await getTunnelUrl(apiKey);
    const res = await fetch(`${tunnelUrl}/${command}/${apiKey.id}`, {
      method: "POST",
      headers: { "x-internal-secret": process.env.INTERNAL_SECRET }
    });
    console.log(`[Tunnel] ${command} → ${tunnelUrl}/${command}/${apiKey.id} - Status: ${res.status}`);
  } catch (err) {
    console.log(`[Tunnel Error] ${command} failed for ${apiKey.id}:`, err.message);
  }
}

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
      
      let tunnelHost = process.env.TUNNEL_NODE_HOST || "tunnel.mineway.cloud";
      const tunnelPort = process.env.TUNNEL_NODE_PORT || "443";
      
      if (!process.env.TUNNEL_NODE_HOST && existing.domainId) {
        const domain = await prisma.domain.findUnique({ where: { id: existing.domainId } });
        if (domain) tunnelHost = `tunnel.${domain.domain}`;
      }

      const payloadBuffer = Buffer.from(`${tunnelHost}:${tunnelPort}|${rawSecret}`);
      const encodedPayload = payloadBuffer.toString("base64url");

      const rawKey = `mw_live_${encodedPayload}`;
      
      updateData.keyHash = crypto.createHash("sha256").update(rawKey).digest("hex");
      updateData.prefix = `mw_live_${encodedPayload.slice(0, 8)}`;
      
      const updated = await prisma.apiKey.update({ where: { id }, data: updateData });
      
      // Kick existing tunnel (full destroy — key changed)
      await tunnelCommand(existing, "kick");

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

    // Suspend/Resume tunnel instantly based on status change
    if (body.status === "inactive") {
      await tunnelCommand(existing, "suspend");
    } else if (body.status === "active") {
      await tunnelCommand(existing, "resume");
    }

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

    // If it's a VIP custom port key, delete its SRV record from Cloudflare
    if (existing.isCustomPort) {
      try {
        const domain = await prisma.domain.findUnique({ where: { id: existing.domainId } });
        if (domain && domain.cfZoneId) {
          const srv = await findSrvRecord({
            zoneId: domain.cfZoneId,
            subdomain: existing.name,
            domain: domain.domain
          });
          if (srv) {
            await deleteSrvRecord({ zoneId: domain.cfZoneId, recordId: srv.id });
          }
        }
      } catch (err) {
        console.error(`Failed to delete Cloudflare SRV record for ${id}:`, err.message);
      }
    }

    await prisma.apiKey.delete({ where: { id } });

    // Kick active tunnel connection
    await tunnelCommand(existing, "kick");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/keys/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

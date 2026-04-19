import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";
import { findSrvRecord, deleteSrvRecord } from "@/lib/cloudflare";

async function getTunnelTarget(apiKey) {
  if (!apiKey.domainId) return null;

  const domain = await prisma.domain.findUnique({ 
    where: { id: apiKey.domainId },
    include: { node: true }
  });

  if (domain?.node?.url && domain?.node?.token) {
    return { url: domain.node.url, token: domain.node.token };
  }
  return null;
}

async function tunnelCommand(apiKey, command) {
  try {
    const target = await getTunnelTarget(apiKey);
    if (!target) {
      console.log(`[Tunnel] Missing target for ${apiKey.id}, cannot send ${command}`);
      return;
    }
    
    const baseUrl = target.url.replace(/\/$/, '');
    const res = await fetch(`${baseUrl}/${command}/${apiKey.id}`, {
      method: "POST",
      headers: { "x-node-token": target.token }
    });
    console.log(`[Tunnel] ${command} → ${baseUrl}/${command}/${apiKey.id} - Status: ${res.status}`);
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
      
      let tunnelHost = null;
      let tunnelPort = "443";
      
      if (existing.domainId) {
        const domain = await prisma.domain.findUnique({ 
          where: { id: existing.domainId },
          include: { node: true }
        });
        if (domain) {
          tunnelHost = `tunnel.${domain.domain}`;
          
          if (domain.node?.url) {
            try {
              const parsedNode = new URL(domain.node.url);
              const isIp = require("net").isIP(parsedNode.hostname);
              if (!isIp && parsedNode.hostname !== "localhost") {
                tunnelHost = parsedNode.hostname;
              }
              // Use the port from the URL if explicitly specified
              if (parsedNode.port) {
                tunnelPort = parsedNode.port;
              }
            } catch (e) { /* ignore */ }
          }
        }
      }

      if (!tunnelHost) {
        return NextResponse.json(
          { error: "No Physical Node is linked to this domain. Please configure it in Admin > Nodes." },
          { status: 400 }
        );
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
        if (domain && domain.cloudflareZoneId) {
          const srv = await findSrvRecord({
            zoneId: domain.cloudflareZoneId,
            subdomain: existing.subdomain,
            domain: domain.domain
          });
          if (srv) {
            await deleteSrvRecord({ zoneId: domain.cloudflareZoneId, recordId: srv.id });
          }
        }
      } catch (err) {
        console.error(`Failed to delete Cloudflare SRV record for ${id}:`, err.message);
      }
    }

    // Perform soft-delete to preserve bandwidth history without colliding with new keys
    await prisma.apiKey.update({
      where: { id },
      data: {
        status: "deleted",
        name: `${existing.name}_del_${Date.now()}`,
        subdomain: existing.subdomain ? `${existing.subdomain}_del_${Date.now()}` : null,
        assignedPort: null, // Free up the port
      }
    });

    // Kick active tunnel connection
    await tunnelCommand(existing, "kick");

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/keys/[id] error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

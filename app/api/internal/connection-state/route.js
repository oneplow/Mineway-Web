import { prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * Internal endpoint for Tunnel Server to report connection state changes.
 * 
 * POST /api/internal/connection-state
 * Body: { keyId: string, state: "connected" | "disconnected" }
 * Header: x-node-token
 * 
 * Special: keyId = "__ALL__" with state = "disconnected" resets all keys
 * connected through this node (used on tunnel server startup to clear stale flags).
 */
export async function POST(req) {
  try {
    // Verify node token
    const token = req.headers.get("x-node-token");
    if (!token) {
      return NextResponse.json({ success: false, reason: "missing_token" }, { status: 401 });
    }

    const node = await prisma.node.findUnique({ where: { token } });
    if (!node || !node.isActive) {
      return NextResponse.json({ success: false, reason: "unauthorized_node" }, { status: 401 });
    }

    const body = await req.json();
    const { keyId, state } = body;

    if (!keyId || !["connected", "disconnected"].includes(state)) {
      return NextResponse.json({ success: false, reason: "invalid_params" }, { status: 400 });
    }

    // ── Bulk reset: clear ALL stale connections for this node ──
    // Used on tunnel server startup to handle crash recovery
    if (keyId === "__ALL__" && state === "disconnected") {
      const result = await prisma.apiKey.updateMany({
        where: {
          isConnected: true,
          domain: { nodeId: node.id },
        },
        data: {
          isConnected: false,
          connectedAt: null,
        },
      });

      console.log(`[connection-state] Bulk reset: cleared ${result.count} stale connections for node ${node.name}`);
      return NextResponse.json({ success: true, cleared: result.count });
    }

    // ── Single key update ──
    if (state === "connected") {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          isConnected: true,
          connectedAt: new Date(),
          lastUsedAt: new Date(),
        },
      });
    } else {
      await prisma.apiKey.update({
        where: { id: keyId },
        data: {
          isConnected: false,
          connectedAt: null,
          lastUsedAt: new Date(),
        },
      });
    }

    console.log(`[connection-state] Key ${keyId} → ${state}`);
    return NextResponse.json({ success: true, keyId, state });
  } catch (error) {
    console.error("POST /api/internal/connection-state error:", error);
    return NextResponse.json({ success: false, reason: "internal_error" }, { status: 500 });
  }
}

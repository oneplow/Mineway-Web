import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

/**
 * GET /api/keys/connection-status
 * Queries each tunnel server to check which API keys have active sessions.
 * Returns a map of keyId -> { connected: boolean, tcpPlayers, udpClients, uptime }
 */
export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    // Get user's API keys with their domain info
    const apiKeys = await prisma.apiKey.findMany({
      where: { userId: session.user.id },
      select: { id: true, domainId: true, domain: { select: { domain: true, tunnelNode: true } } },
    });

    if (apiKeys.length === 0) {
      return NextResponse.json({ connections: {} });
    }

    // Group keys by their tunnel server URL
    const tunnelGroups = new Map(); // tunnelUrl -> [keyId, ...]
    for (const key of apiKeys) {
      let tunnelUrl = key.domain?.tunnelNode;
      if (!tunnelUrl) {
        tunnelUrl = process.env.TUNNEL_SERVER_URL || "http://127.0.0.1:8765";
      }

      // Ensure we hit the node directly, don't ping wss or https generally if we can assume it's internal API.
      // But keeping it flexible if users set https://.
      
      if (!tunnelGroups.has(tunnelUrl)) {
        tunnelGroups.set(tunnelUrl, []);
      }
      tunnelGroups.get(tunnelUrl).push(key.id);
    }

    const connections = {};

    // Query each tunnel server's /stats endpoint
    const fetchPromises = [...tunnelGroups.entries()].map(
      async ([tunnelUrl, keyIds]) => {
        try {
          const res = await fetch(`${tunnelUrl}/stats`, {
            headers: { "x-internal-secret": process.env.INTERNAL_SECRET },
            signal: AbortSignal.timeout(5000),
          });

          if (res.ok) {
            const data = await res.json();
            const activeSessions = new Set(
              (data.sessions || []).map((s) => s.keyId)
            );

            for (const keyId of keyIds) {
              const sessionInfo = (data.sessions || []).find(
                (s) => s.keyId === keyId
              );
              connections[keyId] = {
                connected: activeSessions.has(keyId),
                tcpPlayers: sessionInfo?.tcpPlayers || 0,
                udpClients: sessionInfo?.udpClients || 0,
                uptime: sessionInfo?.uptime || 0,
              };
            }
          } else {
            // Tunnel server responded but with error
            for (const keyId of keyIds) {
              connections[keyId] = { connected: false, tcpPlayers: 0, udpClients: 0, uptime: 0 };
            }
          }
        } catch (err) {
          // Tunnel server unreachable
          for (const keyId of keyIds) {
            connections[keyId] = { connected: false, tcpPlayers: 0, udpClients: 0, uptime: 0 };
          }
        }
      }
    );

    await Promise.all(fetchPromises);

    return NextResponse.json({ connections });
  } catch (error) {
    console.error("GET /api/keys/connection-status error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

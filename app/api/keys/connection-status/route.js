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
      select: { id: true, rxBytes: true, txBytes: true, domainId: true, domain: { select: { domain: true, node: true } } },
    });

    if (apiKeys.length === 0) {
      return NextResponse.json({ connections: {} });
    }

    // Group keys by their mapped Node
    const nodeGroups = new Map(); // nodeId -> { node, keys: [] }
    for (const key of apiKeys) {
      const node = key.domain?.node;
      if (!node) continue; // Skip if no node assigned

      if (!nodeGroups.has(node.id)) {
        nodeGroups.set(node.id, { node, keys: [] });
      }
      nodeGroups.get(node.id).keys.push(key);
    }

    const connections = {};

    // Query each Node's /stats endpoint
    const fetchPromises = [...nodeGroups.values()].map(
      async ({ node, keys }) => {
        try {
          const res = await fetch(`${node.url}/stats`, {
            cache: "no-store",
            headers: { 
              "x-node-token": node.token
            },
            signal: AbortSignal.timeout(5000),
          });

          if (res.ok) {
            const data = await res.json();
            const activeSessions = new Set(
              (data.sessions || []).map((s) => s.keyId)
            );

            const now = new Date();
            const MS_PER_30_DAYS = 30 * 24 * 60 * 60 * 1000;
            const isNewCycle = (key) => {
              if (!key.lastUsedAt || !key.createdAt) return false;
              const lastCycle = Math.floor((key.lastUsedAt.getTime() - key.createdAt.getTime()) / MS_PER_30_DAYS);
              const currentCycle = Math.floor((now.getTime() - key.createdAt.getTime()) / MS_PER_30_DAYS);
              return currentCycle > lastCycle;
            };

            for (const key of keys) {
              const sessionInfo = (data.sessions || []).find(
                (s) => s.keyId === key.id
              );
              
              const reset = isNewCycle(key);
              
              connections[key.id] = {
                connected: activeSessions.has(key.id),
                assignedPort: sessionInfo?.assignedPort || null,
                tcpPlayers: sessionInfo?.tcpPlayers || 0,
                udpClients: sessionInfo?.udpClients || 0,
                uptime: sessionInfo?.uptime || 0,
                rxBytes: reset ? 0 : Number(key.rxBytes),
                txBytes: reset ? 0 : Number(key.txBytes),
              };
            }
          } else {
            // Tunnel server responded but with error
            for (const key of keys) {
              connections[key.id] = { connected: false, tcpPlayers: 0, udpClients: 0, uptime: 0, rxBytes: Number(key.rxBytes), txBytes: Number(key.txBytes) };
            }
          }
        } catch (err) {
          // Tunnel server unreachable
          for (const key of keys) {
            connections[key.id] = { connected: false, tcpPlayers: 0, udpClients: 0, uptime: 0, rxBytes: Number(key.rxBytes), txBytes: Number(key.txBytes) };
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

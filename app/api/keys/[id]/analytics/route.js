// app/api/keys/[id]/analytics/route.js
// Returns hourly bandwidth logs for a specific tunnel (last 24h or 7d)

import { NextResponse } from "next/server";
import { auth, prisma } from "@/lib/auth";

export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const { searchParams } = new URL(req.url);
  const range = searchParams.get("range") || "24h"; // "24h" or "7d"

  // Verify ownership or collaborator access
  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
    select: { userId: true, collaborators: { where: { userId: session.user.id } } },
  });

  if (!apiKey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = apiKey.userId === session.user.id;
  const isCollaborator = apiKey.collaborators.length > 0;
  const isAdmin = session.user.role === "ADMIN";

  if (!isOwner && !isCollaborator && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Calculate time range
  const now = new Date();
  const since = new Date(now);
  if (range === "7d") {
    since.setDate(since.getDate() - 7);
  } else {
    since.setHours(since.getHours() - 24);
  }

  const logs = await prisma.bandwidthLog.findMany({
    where: {
      apiKeyId: id,
      timestamp: { gte: since },
    },
    orderBy: { timestamp: "asc" },
    select: {
      rxBytes: true,
      txBytes: true,
      timestamp: true,
    },
  });

  // Serialize BigInt to string
  const serialized = logs.map((l) => ({
    rx: l.rxBytes.toString(),
    tx: l.txBytes.toString(),
    time: l.timestamp.toISOString(),
  }));

  return NextResponse.json({ logs: serialized });
}

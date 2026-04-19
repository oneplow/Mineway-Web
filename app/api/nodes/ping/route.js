import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function GET(req) {
  try {
    const session = await auth();
    if (!session?.user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { searchParams } = new URL(req.url);
    const nodeId = searchParams.get("nodeId");

    if (!nodeId) {
      return NextResponse.json({ error: "Node ID is required" }, { status: 400 });
    }

    const node = await prisma.node.findUnique({
      where: { id: nodeId },
    });

    if (!node || !node.url) {
      return NextResponse.json({ error: "Node not found or has no URL" }, { status: 404 });
    }

    const start = performance.now();
    
    // Attempt to fetch the /health endpoint of the Node
    // Using an AbortSignal to timeout after 3 seconds
    const res = await fetch(`${node.url}/health`, {
      method: "GET",
      cache: "no-store",
      signal: AbortSignal.timeout(3000),
    });

    if (!res.ok) {
      return NextResponse.json({ error: "Node returned non-200 status" }, { status: res.status });
    }

    const pingTime = Math.round(performance.now() - start);

    return NextResponse.json({ ping: pingTime });

  } catch (error) {
    if (error.name === "AbortError" || error.name === "TimeoutError") {
      return NextResponse.json({ error: "Ping timeout" }, { status: 504 });
    }
    return NextResponse.json({ error: "Network error" }, { status: 500 });
  }
}

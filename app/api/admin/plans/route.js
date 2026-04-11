import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const data = await req.json();
    const newPlan = await prisma.plan.create({
      data: {
        name: data.name,
        displayName: data.displayName,
        pricePoints: Number(data.pricePoints),
        bandwidthGB: Number(data.bandwidthGB),
        maxPlayers: Number(data.maxPlayers),
        maxKeys: Number(data.maxKeys),
        maxNodes: Number(data.maxNodes),
        features: data.features || [],
        isPopular: Boolean(data.isPopular),
        isActive: Boolean(data.isActive)
      }
    });

    return NextResponse.json({ success: true, plan: newPlan });
  } catch (error) {
    console.error("POST /api/admin/plans error:", error);
    return NextResponse.json({ error: "Duplicate plan name or bad request" }, { status: 400 });
  }
}

export async function PUT(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { id, ...data } = await req.json();
    
    const updatedPlan = await prisma.plan.update({
      where: { id },
      data: {
        name: data.name,
        displayName: data.displayName,
        pricePoints: Number(data.pricePoints),
        bandwidthGB: Number(data.bandwidthGB),
        maxPlayers: Number(data.maxPlayers),
        maxKeys: Number(data.maxKeys),
        maxNodes: Number(data.maxNodes),
        features: data.features || [],
        isPopular: Boolean(data.isPopular),
        isActive: Boolean(data.isActive)
      }
    });

    return NextResponse.json({ success: true, plan: updatedPlan });
  } catch (error) {
    console.error("PUT /api/admin/plans error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export async function DELETE(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const url = new URL(req.url);
    const id = url.searchParams.get("id");

    if (!id) return NextResponse.json({ error: "Missing ID" }, { status: 400 });

    // Check if any users are on this plan
    const userCount = await prisma.user.count({ where: { planId: id } });
    if (userCount > 0) {
      return NextResponse.json({ error: `Cannot delete plan because ${userCount} users are subscribed to it.` }, { status: 400 });
    }

    await prisma.plan.delete({
      where: { id }
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("DELETE /api/admin/plans error:", error);
    return NextResponse.json({ error: "Failed to delete" }, { status: 500 });
  }
}

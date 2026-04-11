import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 403 });
    }

    const { userId, role, action, pointAmount } = await req.json();
    if (!userId) {
      return NextResponse.json({ error: "Missing userId" }, { status: 400 });
    }

    if (action === "updateRole") {
      if (!role || (role !== "ADMIN" && role !== "USER")) {
        return NextResponse.json({ error: "Invalid role" }, { status: 400 });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: { role },
      });
      return NextResponse.json({ success: true, user: { id: updatedUser.id, role: updatedUser.role } });
    } 
    
    if (action === "adjustPoints") {
      if (typeof pointAmount !== "number" || pointAmount === 0) {
        return NextResponse.json({ error: "Invalid point amount" }, { status: 400 });
      }
      const updatedUser = await prisma.user.update({
        where: { id: userId },
        data: {
          points: { increment: pointAmount }
        },
      });
      return NextResponse.json({ success: true, user: { id: updatedUser.id, points: updatedUser.points } });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });
  } catch (error) {
    console.error("PATCH /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

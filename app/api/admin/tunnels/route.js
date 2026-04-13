import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function PATCH(req) {
  try {
    const session = await auth();
    if (!session?.user || session.user.role !== "ADMIN") {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const body = await req.json();
    const { tunnelId, action } = body;

    if (!tunnelId || !action) {
      return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
    }

    if (action === "delete") {
      await prisma.apiKey.delete({
        where: { id: tunnelId }
      });
      return NextResponse.json({ success: true, message: "ลบ Tunnel สำเร็จ" });
    } 
    
    if (action === "suspend" || action === "activate") {
      const newStatus = action === "activate" ? "active" : "suspended";
      await prisma.apiKey.update({
        where: { id: tunnelId },
        data: { status: newStatus }
      });
      return NextResponse.json({ success: true, message: `อัปเดตสถานะเป็น ${newStatus} สำเร็จ` });
    }

    return NextResponse.json({ error: "Invalid action" }, { status: 400 });

  } catch (error) {
    console.error("Update tunnel error:", error);
    return NextResponse.json({ error: "เกิดข้อผิดพลาดในการดำเนินการ" }, { status: 500 });
  }
}

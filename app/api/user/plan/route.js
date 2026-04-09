import { auth, prisma } from "@/lib/auth";
import { NextResponse } from "next/server";

export async function POST(req) {
  try {
    const session = await auth();
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const { planId } = await req.json();

    const [user, plan] = await Promise.all([
      prisma.user.findUnique({ where: { id: session.user.id } }),
      prisma.plan.findUnique({ where: { id: planId } })
    ]);

    if (!user) return NextResponse.json({ error: "User not found in database. Please log out and sign in again." }, { status: 401 });
    if (!plan) return NextResponse.json({ error: "Plan not found" }, { status: 404 });
    
    if (user.points < plan.pricePoints) {
      return NextResponse.json({ error: "ยอดเงินสะสมไม่เพียงพอ กรุณาเติมเงิน" }, { status: 400 });
    }

    // Deduct points and assign plan
    await prisma.user.update({
      where: { id: user.id },
      data: {
        points: { decrement: plan.pricePoints },
        planId: plan.id
      }
    });

    return NextResponse.json({ success: true, newPoints: user.points - plan.pricePoints, plan: plan });

  } catch (error) {
    console.error("POST /api/user/plan error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

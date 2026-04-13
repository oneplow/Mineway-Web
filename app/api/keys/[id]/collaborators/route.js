// app/api/keys/[id]/collaborators/route.js
// CRUD for tunnel collaborators (team management)

import { NextResponse } from "next/server";
import { auth, prisma } from "@/lib/auth";

// GET — list collaborators for a tunnel
export async function GET(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;

  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
    select: {
      userId: true,
      collaborators: {
        include: {
          user: { select: { id: true, username: true, email: true, image: true } },
        },
        orderBy: { createdAt: "desc" },
      },
    },
  });

  if (!apiKey) return NextResponse.json({ error: "Not found" }, { status: 404 });

  const isOwner = apiKey.userId === session.user.id;
  const isAdmin = session.user.role === "ADMIN";
  if (!isOwner && !isAdmin) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({ collaborators: apiKey.collaborators });
}

// POST — invite a collaborator by email or username
export async function POST(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { identifier, role } = body || {}; // identifier = email or username

  if (!identifier) {
    return NextResponse.json({ error: "กรุณาระบุอีเมลหรือ Username" }, { status: 400 });
  }

  // Verify tunnel ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
    select: { userId: true, name: true },
  });

  if (!apiKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (apiKey.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Find target user
  const targetUser = await prisma.user.findFirst({
    where: {
      OR: [
        { email: identifier },
        { username: identifier },
      ],
    },
    select: { id: true, username: true, email: true },
  });

  if (!targetUser) {
    return NextResponse.json({ error: "ไม่พบผู้ใช้งานนี้ในระบบ" }, { status: 404 });
  }

  // Cannot invite yourself
  if (targetUser.id === session.user.id) {
    return NextResponse.json({ error: "ไม่สามารถเพิ่มตัวเองเป็นผู้ร่วมจัดการได้" }, { status: 400 });
  }

  // Check if already exists
  const existing = await prisma.tunnelCollaborator.findUnique({
    where: {
      apiKeyId_userId: { apiKeyId: id, userId: targetUser.id },
    },
  });

  if (existing) {
    return NextResponse.json({ error: "ผู้ใช้นี้เข้าร่วมจัดการอยู่แล้ว" }, { status: 409 });
  }

  const collaborator = await prisma.tunnelCollaborator.create({
    data: {
      apiKeyId: id,
      userId: targetUser.id,
      role: role === "manager" ? "manager" : "viewer",
    },
    include: {
      user: { select: { id: true, username: true, email: true, image: true } },
    },
  });

  return NextResponse.json({ collaborator }, { status: 201 });
}

// DELETE — remove a collaborator
export async function DELETE(req, { params }) {
  const session = await auth();
  if (!session) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

  const { id } = await params;
  const body = await req.json().catch(() => null);
  const { collaboratorId } = body || {};

  if (!collaboratorId) {
    return NextResponse.json({ error: "Missing collaboratorId" }, { status: 400 });
  }

  // Verify tunnel ownership
  const apiKey = await prisma.apiKey.findUnique({
    where: { id },
    select: { userId: true },
  });

  if (!apiKey) return NextResponse.json({ error: "Not found" }, { status: 404 });
  if (apiKey.userId !== session.user.id && session.user.role !== "ADMIN") {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await prisma.tunnelCollaborator.delete({
    where: { id: collaboratorId },
  });

  return NextResponse.json({ ok: true });
}

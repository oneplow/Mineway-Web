import crypto from "crypto";
import { prisma } from "@/lib/auth";

const TOKEN_TTL_MS = 24 * 60 * 60 * 1000;

function getBaseUrl() {
  return (
    process.env.NEXTAUTH_URL ||
    process.env.APP_URL ||
    process.env.AUTH_URL ||
    "http://localhost:3000"
  ).replace(/\/$/, "");
}

function hashToken(token) {
  return crypto.createHash("sha256").update(token).digest("hex");
}

export function isEmailVerificationConfigured() {
  if (process.env.EMAIL_VERIFICATION_BYPASS === "true") {
    return true;
  }

  return Boolean(process.env.RESEND_API_KEY && process.env.EMAIL_FROM);
}

export async function createEmailVerificationToken(email) {
  const normalizedEmail = email.trim().toLowerCase();
  const rawToken = crypto.randomBytes(32).toString("hex");

  await prisma.verificationToken.deleteMany({
    where: { identifier: normalizedEmail },
  });

  await prisma.verificationToken.create({
    data: {
      identifier: normalizedEmail,
      token: hashToken(rawToken),
      expires: new Date(Date.now() + TOKEN_TTL_MS),
    },
  });

  return rawToken;
}

export async function sendVerificationEmail(email, rawToken) {
  const verifyUrl = `${getBaseUrl()}/auth/verify-email?token=${encodeURIComponent(rawToken)}&email=${encodeURIComponent(email)}`;

  if (process.env.EMAIL_VERIFICATION_BYPASS === "true") {
    console.warn("EMAIL_VERIFICATION_BYPASS is enabled. Verification URL:", verifyUrl);
    return { delivered: false, verifyUrl };
  }

  if (!process.env.RESEND_API_KEY || !process.env.EMAIL_FROM) {
    throw new Error("EMAIL_VERIFICATION_NOT_CONFIGURED");
  }

  const response = await fetch("https://api.resend.com/emails", {
    method: "POST",
    headers: {
      Authorization: `Bearer ${process.env.RESEND_API_KEY}`,
      "Content-Type": "application/json",
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM,
      to: [email],
      subject: "Verify your Mineway account",
      html: `
        <div style="font-family:Arial,sans-serif;line-height:1.6;color:#111827">
          <h2>Verify your email</h2>
          <p>Click the button below to activate your account.</p>
          <p>
            <a href="${verifyUrl}" style="display:inline-block;padding:12px 18px;background:#10d97e;color:#04110a;text-decoration:none;border-radius:10px;font-weight:700">
              Verify email
            </a>
          </p>
          <p>If the button does not work, open this link:</p>
          <p><a href="${verifyUrl}">${verifyUrl}</a></p>
          <p>This link expires in 24 hours.</p>
        </div>
      `,
    }),
  });

  if (!response.ok) {
    const errorText = await response.text();
    throw new Error(`EMAIL_SEND_FAILED:${response.status}:${errorText}`);
  }

  return { delivered: true, verifyUrl };
}

export async function issueAndSendVerificationEmail(email) {
  const rawToken = await createEmailVerificationToken(email);
  return sendVerificationEmail(email, rawToken);
}

export async function consumeEmailVerificationToken(rawToken) {
  const token = hashToken(rawToken);
  const verification = await prisma.verificationToken.findUnique({
    where: { token },
  });

  if (!verification) {
    return { ok: false, reason: "invalid_token" };
  }

  if (verification.expires < new Date()) {
    await prisma.verificationToken.delete({
      where: { token: verification.token },
    });
    return { ok: false, reason: "expired_token" };
  }

  const user = await prisma.user.findUnique({
    where: { email: verification.identifier },
    select: { id: true, emailVerified: true },
  });

  if (!user) {
    await prisma.verificationToken.deleteMany({
      where: { identifier: verification.identifier },
    });
    return { ok: false, reason: "user_not_found" };
  }

  if (!user.emailVerified) {
    await prisma.user.update({
      where: { id: user.id },
      data: { emailVerified: new Date() },
    });
  }

  await prisma.verificationToken.deleteMany({
    where: { identifier: verification.identifier },
  });

  return { ok: true, email: verification.identifier };
}

import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/overview", "/plans", "/payments", "/admin"];
const authPaths = ["/auth/login", "/auth/register"];

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AUTH_WINDOW_MS = 10 * 60 * 1000;
const REGISTRATION_WINDOW_MS = 15 * 60 * 1000;
const RATE_LIMIT_MAX_KEYS = 10_000;
const RATE_LIMIT_CLEANUP_INTERVAL_MS = 60 * 1000;

const rateLimitState = globalThis.__minewayRateLimitState || {
  store: new Map(),
  lastCleanupAt: 0,
};
if (!globalThis.__minewayRateLimitState) {
  globalThis.__minewayRateLimitState = rateLimitState;
}

function normalizeIp(value) {
  if (!value) {
    return null;
  }
  const firstValue = value.split(",")[0]?.trim();
  if (!firstValue) {
    return null;
  }
  return firstValue.replace(/^\[|\]$/g, "");
}

function getClientIp(req) {
  return (
    normalizeIp(req.headers.get("cf-connecting-ip")) ||
    normalizeIp(req.headers.get("x-real-ip")) ||
    normalizeIp(req.headers.get("x-forwarded-for")) ||
    "unknown"
  );
}

function getRateLimitRule(pathname) {
  if (pathname === "/api/auth/register") {
    return { limit: 5, windowMs: REGISTRATION_WINDOW_MS };
  }

  if (pathname.startsWith("/api/internal/report-usage")) {
    return { limit: 600, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (pathname.startsWith("/api/internal/connection-state")) {
    return { limit: 300, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (pathname.startsWith("/api/internal/verify-key")) {
    return { limit: 240, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  if (pathname.startsWith("/api/auth/") || pathname.startsWith("/auth/")) {
    return { limit: 30, windowMs: AUTH_WINDOW_MS };
  }

  if (pathname.startsWith("/api/")) {
    return { limit: 120, windowMs: RATE_LIMIT_WINDOW_MS };
  }

  return null;
}

function cleanupRateLimitStore(now) {
  if (now - rateLimitState.lastCleanupAt < RATE_LIMIT_CLEANUP_INTERVAL_MS) {
    return;
  }

  rateLimitState.lastCleanupAt = now;

  for (const [key, value] of rateLimitState.store.entries()) {
    if (value.expiresAt <= now) {
      rateLimitState.store.delete(key);
    }
  }

  if (rateLimitState.store.size <= RATE_LIMIT_MAX_KEYS) {
    return;
  }

  const overflow = rateLimitState.store.size - RATE_LIMIT_MAX_KEYS;
  let removed = 0;
  for (const key of rateLimitState.store.keys()) {
    rateLimitState.store.delete(key);
    removed += 1;
    if (removed >= overflow) {
      break;
    }
  }
}

function checkRateLimit(req) {
  const pathname = req.nextUrl.pathname;
  const rule = getRateLimitRule(pathname);
  if (!rule) {
    return null;
  }

  const now = Date.now();
  cleanupRateLimitStore(now);

  const key = `${pathname}:${getClientIp(req)}`;
  const current = rateLimitState.store.get(key);

  if (!current || current.expiresAt <= now) {
    rateLimitState.store.set(key, {
      count: 1,
      expiresAt: now + rule.windowMs,
    });

    return {
      limited: false,
      limit: rule.limit,
      remaining: rule.limit - 1,
      resetMs: rule.windowMs,
    };
  }

  current.count += 1;
  rateLimitState.store.set(key, current);

  return {
    limited: current.count > rule.limit,
    limit: rule.limit,
    remaining: Math.max(rule.limit - current.count, 0),
    resetMs: Math.max(current.expiresAt - now, 0),
  };
}

function attachRateLimitHeaders(response, rateLimit) {
  if (!rateLimit) {
    return response;
  }

  response.headers.set("X-RateLimit-Limit", String(rateLimit.limit));
  response.headers.set("X-RateLimit-Remaining", String(rateLimit.remaining));
  response.headers.set(
    "X-RateLimit-Reset",
    String(Math.ceil(rateLimit.resetMs / 1000))
  );
  return response;
}

export default async function middleware(req) {
  const { pathname } = req.nextUrl;

  if (pathname === "/manager" || pathname.startsWith("/manager/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace("/manager", "/overview");
    return NextResponse.redirect(url);
  }

  const rateLimit = checkRateLimit(req);
  if (rateLimit?.limited) {
    if (pathname.startsWith("/api/")) {
      return attachRateLimitHeaders(
        NextResponse.json({ error: "Too many requests" }, { status: 429 }),
        rateLimit
      );
    }

    const url = req.nextUrl.clone();
    url.searchParams.set("error", "rate_limited");
    return attachRateLimitHeaders(NextResponse.redirect(url), rateLimit);
  }

  const isProtected = protectedPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );
  const isAuthPage = authPaths.some(
    (path) => pathname === path || pathname.startsWith(`${path}/`)
  );

  if (!isProtected && !isAuthPage) {
    return attachRateLimitHeaders(NextResponse.next(), rateLimit);
  }

  const session = await auth();

  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return attachRateLimitHeaders(NextResponse.redirect(url), rateLimit);
  }

  if (pathname.startsWith("/admin") && session?.user?.role !== "ADMIN") {
    const url = req.nextUrl.clone();
    url.pathname = "/overview";
    return attachRateLimitHeaders(NextResponse.redirect(url), rateLimit);
  }

  if (isAuthPage && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/overview";
    return attachRateLimitHeaders(NextResponse.redirect(url), rateLimit);
  }

  return attachRateLimitHeaders(NextResponse.next(), rateLimit);
}

export const config = {
  matcher: [
    "/admin/:path*",
    "/overview/:path*",
    "/plans/:path*",
    "/payments/:path*",
    "/api/:path*",
    "/auth/:path*",
    "/manager/:path*",
  ],
};

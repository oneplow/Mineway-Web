import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const protectedPaths = ["/overview", "/plans", "/payments", "/admin"];
const authPaths = ["/auth/login", "/auth/register"];

const RATE_LIMIT_WINDOW_MS = 60 * 1000;
const AUTH_WINDOW_MS = 10 * 60 * 1000;
const REGISTRATION_WINDOW_MS = 15 * 60 * 1000;

const rateLimitStore = globalThis.__minewayRateLimitStore || new Map();
if (!globalThis.__minewayRateLimitStore) {
  globalThis.__minewayRateLimitStore = rateLimitStore;
}

function getClientIp(req) {
  const forwardedFor = req.headers.get("x-forwarded-for");
  if (forwardedFor) {
    return forwardedFor.split(",")[0].trim();
  }

  return (
    req.headers.get("x-real-ip") ||
    req.headers.get("cf-connecting-ip") ||
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

function checkRateLimit(req) {
  const pathname = req.nextUrl.pathname;
  const rule = getRateLimitRule(pathname);
  if (!rule) {
    return null;
  }

  const now = Date.now();
  const key = `${pathname}:${getClientIp(req)}`;
  const current = rateLimitStore.get(key);

  if (!current || current.expiresAt <= now) {
    rateLimitStore.set(key, {
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
  rateLimitStore.set(key, current);

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

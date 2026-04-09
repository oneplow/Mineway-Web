import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

// Protected routes that require authentication
const protectedPaths = ["/overview", "/plans", "/payments"];

// Public paths that should redirect to /overview if already logged in
const authPaths = ["/auth/login", "/auth/register"];

export default async function middleware(req) {
  const { pathname } = req.nextUrl;

  // Redirect old /manager route to /overview
  if (pathname === "/manager" || pathname.startsWith("/manager/")) {
    const url = req.nextUrl.clone();
    url.pathname = pathname.replace("/manager", "/overview");
    return NextResponse.redirect(url);
  }

  const session = await auth();

  // Check if the path is protected
  const isProtected = protectedPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // Check if the path is an auth page (login/register)
  const isAuthPage = authPaths.some(
    (p) => pathname === p || pathname.startsWith(p + "/")
  );

  // If trying to access a protected route without a session, redirect to login
  if (isProtected && !session) {
    const url = req.nextUrl.clone();
    url.pathname = "/auth/login";
    url.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(url);
  }

  // If logged in and trying to access auth pages, redirect to overview
  if (isAuthPage && session) {
    const url = req.nextUrl.clone();
    url.pathname = "/overview";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    "/overview/:path*",
    "/plans/:path*",
    "/payments/:path*",
    "/auth/:path*",
    "/manager/:path*",
  ],
};

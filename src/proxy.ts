import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

const PUBLIC_PATHS = ["/login", "/api/auth", "/api/register"];

/**
 * Auth-aware proxy handler for Next.js 16+
 * Replaces the deprecated middleware.ts convention.
 *
 * The `auth()` wrapper from next-auth v5 injects `req.auth`
 * with the current session, then delegates to our callback.
 */
const handler = auth((req) => {
  const { pathname } = req.nextUrl;

  // Allow public paths
  if (PUBLIC_PATHS.some((p) => pathname.startsWith(p))) {
    return NextResponse.next();
  }

  // Allow static assets
  if (
    pathname.startsWith("/_next") ||
    pathname.startsWith("/icon") ||
    pathname === "/favicon.ico"
  ) {
    return NextResponse.next();
  }

  // Check auth - also verify session hasn't expired
  const session = req.auth;
  const expiresAt = session?.expiresAt;
  const isExpired = expiresAt ? Date.now() > expiresAt : false;

  if (!session?.user || isExpired) {
    // For API routes, return 401 instead of redirect
    if (pathname.startsWith("/api/")) {
      return NextResponse.json({ error: "Session expired" }, { status: 401 });
    }
    const loginUrl = new URL("/login", req.url);
    loginUrl.searchParams.set("callbackUrl", pathname);
    return NextResponse.redirect(loginUrl);
  }

  // Authenticated user hitting "/" -> redirect to dashboard
  if (pathname === "/") {
    return NextResponse.redirect(new URL("/dashboard", req.url));
  }

  return NextResponse.next();
});

// Named export for Next.js 16+ proxy convention
export const proxy = handler;

// Default export for backward compatibility with middleware convention
export default handler;

export const config = {
  matcher: ["/((?!_next/static|_next/image|icon|favicon.ico).*)"],
};

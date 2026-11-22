import { NextRequest, NextResponse } from "next/server";

const protectedRoutes = [
  "/",
  "/transactions",
  "/loans",
  "/houses",
  "/settings",
];
const authRoutes = ["/login"];

// Fast JWT expiration check for middleware
function isTokenExpired(token: string): boolean {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return true;
    const payloadJson = Buffer.from(parts[1], "base64url").toString("utf-8");
    const payload = JSON.parse(payloadJson);
    if (typeof payload.exp === "number") {
      const nowSeconds = Math.floor(Date.now() / 1000);
      return nowSeconds >= payload.exp;
    }
    return false;
  } catch {
    return true;
  }
}

export default async function proxy(req: NextRequest) {
  const token = req.cookies.get("finvault_token")?.value;
  const { pathname } = req.nextUrl;

  const isProtectedRoute = protectedRoutes.some((route) =>
    route === "/" ? pathname === "/" : pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  const hasExpired = token ? isTokenExpired(token) : true;
  const isAuthenticated = Boolean(token && !hasExpired);

  // If user is accessing protected route without a valid non-expired token, redirect to login
  if (isProtectedRoute && !isAuthenticated) {
    const response = NextResponse.redirect(new URL("/login", req.url));
    if (token) {
      // Clear expired cookie
      response.cookies.delete("finvault_token");
    }
    return response;
  }

  // If user has a valid (non-expired) token and tries to access /login, redirect to dashboard
  if (isAuthRoute && isAuthenticated) {
    return NextResponse.redirect(new URL("/", req.url));
  }

  // If user visits /login with an expired token, clear it from browser response
  if (isAuthRoute && token && hasExpired) {
    const response = NextResponse.next();
    response.cookies.delete("finvault_token");
    return response;
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/((?!api|_next/static|_next/image|favicon.ico).*)"],
};

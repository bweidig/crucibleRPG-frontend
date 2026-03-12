import { NextResponse } from "next/server";

export function middleware(request) {
  const { pathname } = request.nextUrl;

  if (pathname === "/") {
    return NextResponse.next();
  }

  const hasAccess = request.cookies.has("crucible_access");

  if (!hasAccess) {
    const url = request.nextUrl.clone();
    url.pathname = "/";
    return NextResponse.redirect(url);
  }

  return NextResponse.next();
}

export const config = {
  matcher: [
    /*
     * Protect everything except:
     * - / (Coming Soon page)
     * - /api (API routes — auth-check needs to be reachable)
     * - /_next (Next.js internals)
     * - /fonts, /favicon.ico (static assets)
     */
    "/((?!api|_next|fonts|favicon\\.ico$).*)",
  ],
};

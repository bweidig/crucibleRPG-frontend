import { NextResponse } from "next/server";

// Public routes that don't require authentication
const PUBLIC_ROUTES = ["/", "/landing", "/auth", "/pricing", "/faq", "/rulebook"];

export function middleware(request) {
  const { pathname } = request.nextUrl;

  // Allow public routes
  if (PUBLIC_ROUTES.includes(pathname)) {
    return NextResponse.next();
  }

  // Allow cookie-based access (coming-soon gate) OR JWT token
  const hasCookie = request.cookies.has("crucible_access");
  // We can't check localStorage from middleware, so cookie presence is
  // enough to let the request through. Client-side useAuth() handles
  // the JWT redirect for protected pages.
  if (hasCookie) {
    return NextResponse.next();
  }

  // No cookie — redirect to auth page
  const url = request.nextUrl.clone();
  url.pathname = "/auth";
  return NextResponse.redirect(url);
}

export const config = {
  matcher: [
    "/((?!api|_next|fonts|favicon\\.ico$).*)",
  ],
};

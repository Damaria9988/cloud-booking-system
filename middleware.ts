import { NextResponse } from "next/server"
import type { NextRequest } from "next/server"

// Protected routes that require authentication
const protectedRoutes = ["/bookings", "/profile", "/booking/checkout", "/booking/success", "/booking/ticket"]

// Note: Admin routes are protected by the page component itself
// which checks for both authentication and admin status from the JWT token

export function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl
  const accessToken = request.cookies.get("accessToken")

  // Check if route is protected
  const isProtectedRoute = protectedRoutes.some((route) => pathname.startsWith(route))

  // If no access token and trying to access protected route, redirect to home
  // The auth modal will open automatically via the page components
  if (isProtectedRoute && !accessToken) {
    const homeUrl = new URL("/", request.url)
    homeUrl.searchParams.set("redirect", pathname)
    homeUrl.searchParams.set("auth", "required")
    return NextResponse.redirect(homeUrl)
  }

  return NextResponse.next()
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public files (public folder)
     */
    "/((?!api|_next/static|_next/image|favicon.ico|.*\\.(?:svg|png|jpg|jpeg|gif|webp)$).*)",
  ],
}


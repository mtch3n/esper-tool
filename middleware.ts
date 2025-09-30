import { NextRequest, NextResponse } from "next/server"

export function middleware(request: NextRequest) {
  // Get the pathname of the request
  const { pathname } = request.nextUrl

  // Define protected routes
  const protectedRoutes = ["/dashboard", "/devices", "/settings"]

  // Check if the current route is protected
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route),
  )

  // If it's a protected route, check for authentication
  if (isProtectedRoute) {
    // Check if user data exists in the request (this is client-side storage)
    // For middleware, we'll redirect to login and let the client-side handle the auth check
    const loginUrl = new URL("/login", request.url)

    // Add the original URL as a redirect parameter
    loginUrl.searchParams.set("redirect", pathname)

    // For now, we'll let the client-side auth context handle the redirect
    // This middleware serves as a backup and for API routes if needed
  }

  // Allow the request to continue
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
     * - login (login page)
     * - public folder
     */
    "/((?!api|_next/static|_next/image|favicon.ico|login|public).*)",
  ],
}

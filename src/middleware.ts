import { withAuth } from "next-auth/middleware";
import { NextResponse } from "next/server";

export default withAuth(
  function middleware(req) {
    const { pathname } = req.nextUrl;
    const token = req.nextauth.token;

    // Admin routes require isAdmin — redirect non-admins to /auth
    if (pathname.startsWith("/admin") && !token?.isAdmin) {
      return NextResponse.redirect(new URL("/auth", req.url));
    }

    return NextResponse.next();
  },
  {
    pages: {
      signIn: "/auth",
    },
    callbacks: {
      authorized: ({ token, req }) => {
        const { pathname } = req.nextUrl;

        // Public routes that don't need auth
        if (
          pathname === "/" ||
          pathname.startsWith("/auth") ||
          pathname.startsWith("/routes") ||
          pathname.startsWith("/book") ||
          pathname.startsWith("/mybookings") ||
          pathname.startsWith("/notifications") ||
          pathname.startsWith("/profile") ||
          pathname.startsWith("/editbooking") ||
          pathname.startsWith("/payment") ||
          pathname.startsWith("/api/auth")
        ) {
          return true;
        }

        // Everything else requires a valid token
        return !!token;
      },
    },
  }
);

export const config = {
  matcher: [
    "/routes/:path*",
    "/book/:path*",
    "/mybookings/:path*",
    "/notifications/:path*",
    "/profile/:path*",
    "/editbooking/:path*",
    "/payment/:path*",
    "/admin/:path*",
    "/api/bookings/:path*",
    "/api/timeslots/:path*",
    "/api/routes-manage/:path*",
    "/api/payments/:path*",
    "/api/notifications/:path*",
    "/api/seats/:path*",
    "/api/users/:path*",
    "/api/admin/:path*",
  ],
};

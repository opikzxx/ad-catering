import { auth } from "@/lib/auth";
import { NextResponse } from "next/server";

export default auth((req) => {
  const { nextUrl } = req;
  const isLoggedIn = !!req.auth;
  const userRole = req.auth?.user?.role;

  // Check if accessing administrator routes
  const isAdministratorRoute = nextUrl.pathname.startsWith("/administrator");

  // Handle session expiry for protected routes
  if (isAdministratorRoute && !isLoggedIn) {
    console.log("Session expired or not authenticated, redirecting to login");

    // Clear any existing session cookies
    const response = NextResponse.redirect(
      new URL("/login?expired=true", req.url)
    );

    // Clear NextAuth cookies
    response.cookies.delete("next-auth.session-token");
    response.cookies.delete("__Secure-next-auth.session-token");
    response.cookies.delete("next-auth.csrf-token");
    response.cookies.delete("__Host-next-auth.csrf-token");

    return response;
  }

  // Protect /administrator routes - check role
  if (isAdministratorRoute && isLoggedIn) {
    if (userRole !== "ADMIN") {
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Handle login page
  if (nextUrl.pathname === "/login") {
    // If user is already logged in, redirect based on role
    if (isLoggedIn) {
      console.log("User already logged in, redirecting based on role");

      if (userRole === "ADMIN") {
        return NextResponse.redirect(new URL("/administrator", req.url));
      }
      return NextResponse.redirect(new URL("/", req.url));
    }
  }

  // Handle register page
  if (nextUrl.pathname === "/register" && isLoggedIn) {
    console.log("User already logged in, redirecting from register");

    if (userRole === "ADMIN") {
      return NextResponse.redirect(new URL("/administrator", req.url));
    }
    return NextResponse.redirect(new URL("/", req.url));
  }

  return NextResponse.next();
});

export const config = {
  matcher: ["/administrator/:path*", "/login"],
};

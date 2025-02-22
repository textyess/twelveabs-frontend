import { authMiddleware } from "@clerk/nextjs";
import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { checkUserNeedsOnboarding } from "@/lib/utils/check-onboarding";

export default authMiddleware({
  publicRoutes: ["/", "/api/webhook/clerk"],
  async afterAuth(auth, req) {
    // Handle unauthorized requests
    if (!auth.userId && !auth.isPublicRoute) {
      return NextResponse.redirect(new URL("/sign-in", req.url));
    }

    // If user is signed in and the current path is / redirect to /dashboard
    if (auth.userId && req.nextUrl.pathname === "/") {
      return NextResponse.redirect(new URL("/dashboard", req.url));
    }

    // Check if user needs onboarding
    if (
      auth.userId &&
      !req.nextUrl.pathname.startsWith("/onboarding") &&
      !req.nextUrl.pathname.startsWith("/api")
    ) {
      const needsOnboarding = await checkUserNeedsOnboarding(auth.userId);

      if (needsOnboarding) {
        return NextResponse.redirect(new URL("/onboarding", req.url));
      }
    }

    // Get the JWT from Clerk
    const token = await auth.getToken({ template: "supabase" });

    // Forward the token to Supabase
    let supabaseResponse = NextResponse.next({
      request: {
        headers: new Headers(req.headers),
      },
    });

    if (token) {
      supabaseResponse.headers.set("Authorization", `Bearer ${token}`);
    }

    return supabaseResponse;
  },
});

export const config = {
  matcher: ["/((?!.+\\.[\\w]+$|_next).*)", "/", "/(api|trpc)(.*)"],
};

/**
 * Supabase Auth Middleware
 * 
 * Refreshes the user's session on every request to keep it alive.
 * This runs on the Edge runtime.
 */

import { createServerClient } from "@supabase/ssr";
import { NextResponse, type NextRequest } from "next/server";

// Read env vars directly - middleware runs in Edge runtime
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    console.warn("Supabase env vars not configured, skipping auth middleware");
    return null;
  }
  
  return { url, key };
}

export async function updateSession(request: NextRequest) {
  const config = getSupabaseConfig();
  
  // If no config, just pass through
  if (!config) {
    return NextResponse.next({ request });
  }

  let supabaseResponse = NextResponse.next({
    request,
  });

  const supabase = createServerClient(
    config.url,
    config.key,
    {
      cookies: {
        getAll() {
          return request.cookies.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value }) =>
            request.cookies.set(name, value)
          );
          supabaseResponse = NextResponse.next({
            request,
          });
          cookiesToSet.forEach(({ name, value, options }) =>
            supabaseResponse.cookies.set(name, value, options)
          );
        },
      },
    }
  );

  // Refresh session - important for keeping auth alive
  // Do not remove this line
  await supabase.auth.getUser();

  return supabaseResponse;
}

// Protected routes that require authentication
const protectedRoutes = ["/ideas/new", "/profile", "/admin"];

// Auth routes that should redirect to home if already logged in
const authRoutes = ["/login"];

export async function authMiddleware(request: NextRequest) {
  const config = getSupabaseConfig();
  
  // If no config, just pass through
  if (!config) {
    return NextResponse.next({ request });
  }

  const response = await updateSession(request);
  const pathname = request.nextUrl.pathname;

  // Check if route needs protection
  const isProtectedRoute = protectedRoutes.some((route) =>
    pathname.startsWith(route)
  );
  const isAuthRoute = authRoutes.some((route) => pathname.startsWith(route));

  if (isProtectedRoute || isAuthRoute) {
    const supabase = createServerClient(
      config.url,
      config.key,
      {
        cookies: {
          getAll() {
            return request.cookies.getAll();
          },
          setAll() {},
        },
      }
    );

    const {
      data: { user },
    } = await supabase.auth.getUser();

    // Redirect unauthenticated users from protected routes
    if (isProtectedRoute && !user) {
      const url = request.nextUrl.clone();
      url.pathname = "/login";
      url.searchParams.set("redirectTo", pathname);
      return NextResponse.redirect(url);
    }

    // Role-based protection: Admin
    if (pathname.startsWith("/admin") && user) {
       // Hardcoded admin check to match client-side logic
       // Ideally this matches constants.ts but for safety in edge runtime we can duplicate or ensure import works
       // Importing constants.ts should work if it has no node-dependencies
       const ADMIN_EMAILS = ["sachin@mulearn.org", "admin@debrief.com", "awindsr@gmail.com"];
       
       if (!user.email || !ADMIN_EMAILS.includes(user.email)) {
          const url = request.nextUrl.clone();
          url.pathname = "/"; // Redirect unauthorized access to home
          return NextResponse.redirect(url);
       }
    }

    // Redirect authenticated users from auth routes
    if (isAuthRoute && user) {
      const url = request.nextUrl.clone();
      url.pathname = "/";
      return NextResponse.redirect(url);
    }
  }

  return response;
}

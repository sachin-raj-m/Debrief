/**
 * Supabase Client - Server Components & API Routes
 * 
 * ⚠️  THIS FILE MUST ONLY BE IMPORTED IN SERVER COMPONENTS OR API ROUTES
 * 
 * Provides two clients:
 * 1. createServerClient - Uses user's session, respects RLS
 * 2. createAdminClient - Uses SECRET key, bypasses RLS (for atomic operations)
 */

import "server-only";

import { createServerClient as createSupabaseServerClient } from "@supabase/ssr";
import { createClient } from "@supabase/supabase-js";
import { cookies } from "next/headers";
import { publicEnv, serverEnv } from "@/lib/env.server";

// Note: Using untyped Supabase client because manually-created Database types
// don't work with Supabase's complex generic inference system.
// For full type safety, generate types using: npx supabase gen types typescript

/**
 * Creates a Supabase client for server components that respects RLS.
 * Uses the user's session from cookies.
 */
export async function createServerClient() {
  const cookieStore = await cookies();

  return createSupabaseServerClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    publicEnv.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          try {
            cookiesToSet.forEach(({ name, value, options }) =>
              cookieStore.set(name, value, options)
            );
          } catch {
            // The `setAll` method was called from a Server Component.
            // This can be ignored if you have middleware refreshing sessions.
          }
        },
      },
    }
  );
}

/**
 * Creates an admin Supabase client that BYPASSES RLS.
 * 
 * ⚠️  USE WITH EXTREME CAUTION - only for:
 * - Atomic transactions that need to update multiple tables
 * - Background jobs
 * - Admin operations
 * 
 * NEVER use this client with user-provided data without validation.
 * ALWAYS validate user permissions manually before operations.
 */
export function createAdminClient() {
  return createClient(
    publicEnv.NEXT_PUBLIC_SUPABASE_URL,
    serverEnv.SUPABASE_SECRET_KEY,
    {
      auth: {
        autoRefreshToken: false,
        persistSession: false,
      },
    }
  );
}

/**
 * Gets the current authenticated user from the session.
 * Returns null if not authenticated.
 */
export async function getUser() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();
  
  if (error || !user) {
    return null;
  }
  
  return user;
}

/**
 * Gets the current authenticated user or throws an error.
 * Use in protected routes/actions.
 */
export async function requireUser() {
  const user = await getUser();
  
  if (!user) {
    throw new Error("Unauthorized: User not authenticated");
  }
  
  return user;
}

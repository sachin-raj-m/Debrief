/**
 * Admin Utilities
 * 
 * Centralized admin check functions for consistent access control.
 */

import { ADMIN_EMAILS } from "@/lib/simulation-game/constants";
import { createServerClient } from "@/lib/supabase/server";

/**
 * Check if an email belongs to an admin user
 */
export function isAdmin(email: string | null | undefined): boolean {
  if (!email) return false;
  return ADMIN_EMAILS.includes(email);
}

/**
 * Server-side admin validation
 * Throws an error if the current user is not an admin
 * Returns the user if they are an admin
 */
export async function requireAdmin() {
  const supabase = await createServerClient();
  const { data: { user }, error } = await supabase.auth.getUser();

  if (error || !user) {
    throw new Error("Unauthorized: Not authenticated");
  }

  if (!isAdmin(user.email)) {
    throw new Error("Forbidden: Admin access required");
  }

  return user;
}

/**
 * Get admin status for the current user (non-throwing)
 * Useful for conditional rendering
 */
export async function getAdminStatus(): Promise<{ isAdmin: boolean; email: string | null }> {
  try {
    const supabase = await createServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    
    return {
      isAdmin: isAdmin(user?.email),
      email: user?.email ?? null
    };
  } catch {
    return { isAdmin: false, email: null };
  }
}

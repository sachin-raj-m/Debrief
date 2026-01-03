/**
 * Supabase Client - Browser/Client Components
 * 
 * Uses the PUBLISHABLE key only - safe for client-side usage.
 * This client respects RLS policies and is tied to the user's session.
 */

import { createBrowserClient } from "@supabase/ssr";
import type { Database } from "@/types/database";
import { env } from "@/lib/env";

export function createClient() {
  return createBrowserClient<Database>(
    env.NEXT_PUBLIC_SUPABASE_URL,
    env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY
  );
}

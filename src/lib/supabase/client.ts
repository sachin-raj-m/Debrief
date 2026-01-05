/**
 * Supabase Browser Client
 * 
 * Creates a Supabase client for use in Client Components.
 * This client handles authentication state and session management.
 */

import { createBrowserClient } from "@supabase/ssr";

// Note: Using untyped Supabase client because manually-created Database types
// don't work with Supabase's complex generic inference system.
// For full type safety, generate types using: npx supabase gen types typescript

// Read env vars directly to avoid import issues
function getSupabaseConfig() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
  
  if (!url || !key) {
    throw new Error(
      "Missing Supabase environment variables. " +
      "Please set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in .env.local"
    );
  }
  
  return { url, key };
}

export function createClient() {
  const config = getSupabaseConfig();
  return createBrowserClient(config.url, config.key);
}

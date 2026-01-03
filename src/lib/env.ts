/**
 * Environment Variables - Client Safe
 * 
 * ONLY variables prefixed with NEXT_PUBLIC_ are exposed here.
 * These are safe to use in client components.
 */

// Validate at build/runtime that required public env vars exist
function getPublicEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required public environment variable: ${key}`);
  }
  return value;
}

export const env = {
  NEXT_PUBLIC_SUPABASE_URL: getPublicEnv("NEXT_PUBLIC_SUPABASE_URL"),
  NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY: getPublicEnv("NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY"),
  NEXT_PUBLIC_APP_URL: process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
} as const;

// Type for client-safe environment
export type PublicEnv = typeof env;

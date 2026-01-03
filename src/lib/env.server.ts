/**
 * Environment Variables - Server Only
 * 
 * ⚠️  THIS FILE MUST ONLY BE IMPORTED IN SERVER COMPONENTS OR API ROUTES
 * 
 * Contains secret keys that must NEVER be exposed to the client.
 * Next.js will throw an error if you try to import this in a client component.
 */

import "server-only";

// Re-export public env for convenience
export { env as publicEnv } from "./env";

// Validate at runtime that required server env vars exist
function getServerEnv(key: string): string {
  const value = process.env[key];
  if (!value) {
    throw new Error(`Missing required server environment variable: ${key}`);
  }
  return value;
}

export const serverEnv = {
  // Supabase secret key - NEVER expose to client
  SUPABASE_SECRET_KEY: getServerEnv("SUPABASE_SECRET_KEY"),
  
  // Redis URL for rate limiting (optional in dev)
  REDIS_URL: process.env.REDIS_URL || null,
} as const;

// Type for server environment
export type ServerEnv = typeof serverEnv;

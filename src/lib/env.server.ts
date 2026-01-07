/**
 * Environment Variables - Server Only
 * 
 * ⚠️  THIS FILE MUST ONLY BE IMPORTED IN SERVER COMPONENTS OR API ROUTES
 * 
 * Contains secret keys that must NEVER be exposed to the client.
 * Next.js will throw an error if you try to import this in a client component.
 */

import "server-only";

// Get public env vars - read directly to avoid circular import issues
export const publicEnv = {
  get NEXT_PUBLIC_SUPABASE_URL(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_URL;
    if (!value) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_URL in environment");
    }
    return value;
  },
  get NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY(): string {
    const value = process.env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY;
    if (!value) {
      throw new Error("Missing NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY in environment");
    }
    return value;
  },
  get NEXT_PUBLIC_APP_URL(): string {
    return process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000";
  },
} as const;

// Server-only env vars
export const serverEnv = {
  get SUPABASE_SECRET_KEY(): string {
    const value = process.env.SUPABASE_SECRET_KEY;
    if (!value) {
      throw new Error("Missing SUPABASE_SECRET_KEY in environment");
    }
    return value;
  },
  get REDIS_URL(): string | null {
    return process.env.REDIS_URL || null;
  },
  // Email configuration (optional - email features disabled if not set)
  get EMAIL_HOST(): string | null {
    return process.env.EMAIL_HOST || null;
  },
  get EMAIL_HOST_USER(): string | null {
    return process.env.EMAIL_HOST_USER || null;
  },
  get EMAIL_HOST_PASSWORD(): string | null {
    return process.env.EMAIL_HOST_PASSWORD || null;
  },
  get EMAIL_PORT(): number {
    return parseInt(process.env.EMAIL_PORT || "587", 10);
  },
  get FROM_MAIL(): string {
    return process.env.FROM_MAIL || "noreply@mulearn.org";
  },
  get isEmailConfigured(): boolean {
    return !!(process.env.EMAIL_HOST && process.env.EMAIL_HOST_USER && process.env.EMAIL_HOST_PASSWORD);
  },
} as const;

// Types
export type PublicEnv = typeof publicEnv;
export type ServerEnv = typeof serverEnv;

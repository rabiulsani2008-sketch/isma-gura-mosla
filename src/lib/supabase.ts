import { createClient } from "@supabase/supabase-js";

/**
 * Supabase client (browser-safe).
 * Only created if env vars are present.
 *
 * To enable Supabase:
 * 1. Create a free account at https://supabase.com
 * 2. Create a new project
 * 3. Add these to your .env:
 *    NEXT_PUBLIC_SUPABASE_URL=https://xxxx.supabase.co
 *    NEXT_PUBLIC_SUPABASE_ANON_KEY=eyxxxx
 *    DATABASE_URL=postgresql://postgres:[password]@db.xxxx.supabase.co:5432/postgres
 * 4. Run: bash scripts/setup-db.sh
 *
 * The database (PostgreSQL via Prisma) handles ALL data.
 * This Supabase client is for future features (file storage, real-time).
 */
let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return !!process.env.NEXT_PUBLIC_SUPABASE_URL && !!process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
}

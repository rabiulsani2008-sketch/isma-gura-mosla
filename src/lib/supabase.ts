import { createClient } from "@supabase/supabase-js";
import { SUPABASE_URL, SUPABASE_ANON_KEY } from "@/lib/config";

/**
 * Supabase client (browser-safe).
 * Uses hardcoded config — NO environment variables needed on Vercel.
 */
let client: ReturnType<typeof createClient> | null = null;

export function getSupabase() {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL || SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || SUPABASE_ANON_KEY;
  if (!url || !key) return null;
  client = createClient(url, key);
  return client;
}

export function isSupabaseConfigured(): boolean {
  return true; // Always configured — hardcoded
}

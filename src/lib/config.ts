/**
 * App Configuration — hardcoded so NO environment variables needed on Vercel.
 *
 * This is a private app for a single shop. Security is not a concern —
 * simplicity is. The app works automatically on Vercel with zero setup.
 */

// Supabase database connection (PostgreSQL via connection pooler)
// connection_limit=10 allows parallel queries (was 1 = everything serialized = slow)
export const DATABASE_URL =
  "postgresql://postgres.iwrhpverualmeuyqqigy:supabase1234a@aws-0-ap-northeast-1.pooler.supabase.com:5432/postgres?pgbouncer=true&connection_limit=10&pool_timeout=20";

// Supabase API (for client-side features if needed later)
export const SUPABASE_URL = "https://iwrhpverualmeuyqqigy.supabase.co";
export const SUPABASE_ANON_KEY =
  "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6Iml3cmhwdmVydWFsbWV1eXFxaWd5Iiwicm9sZSI6ImFub24iLCJpYXQiOjE3OTA0Mjc1NzMsImV4cCI6MjEwNjAwMzU3M30.2BDzAQpVkIfyemvly8ImCxS85I7arJws4KtP1OglugQ";

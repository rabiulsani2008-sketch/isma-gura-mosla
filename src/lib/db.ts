import { PrismaClient } from "@prisma/client";

// Use a cached global instance to avoid creating new connections on every hot-reload
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Prisma database client.
 *
 * Works with BOTH:
 * - SQLite (local dev): DATABASE_URL=file:./db/custom.db
 * - Supabase PostgreSQL (production): DATABASE_URL=postgresql://...
 *
 * The schema is auto-selected by scripts/setup-db.sh based on DATABASE_URL.
 */
export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

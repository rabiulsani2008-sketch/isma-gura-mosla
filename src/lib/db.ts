import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "@/lib/config";

// Use hardcoded config (works on Vercel with ZERO environment variables)
// Falls back to env var if set (for advanced users who want to override)
const dbUrl = process.env.DATABASE_URL || DATABASE_URL;

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: dbUrl,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

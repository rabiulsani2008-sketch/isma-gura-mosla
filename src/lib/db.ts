import { PrismaClient } from "@prisma/client";
import { DATABASE_URL } from "@/lib/config";

// ALWAYS use hardcoded config — ignore process.env.DATABASE_URL
// (the sandbox/venv keeps resetting it to SQLite, causing crashes)
const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

export const db =
  globalForPrisma.prisma ??
  new PrismaClient({
    datasourceUrl: DATABASE_URL,
    log: ["error", "warn"],
  });

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = db;

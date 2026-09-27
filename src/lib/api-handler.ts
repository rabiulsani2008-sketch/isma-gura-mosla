import { NextResponse } from "next/server";
import { Prisma } from "@prisma/client";

/**
 * Wrap an API handler so any error becomes a friendly JSON response
 * instead of crashing the app with a 500.
 *
 * Usage:
 * export const POST = apiHandler(async (req) => { ... });
 */
export function apiHandler(
  fn: (req: Request, ctx?: any) => Promise<Response | NextResponse>
) {
  return async (req: Request, ctx?: any): Promise<Response> => {
    try {
      const res = await fn(req, ctx);
      return res as Response;
    } catch (err: any) {
      console.error("[API ERROR]", err?.message || err);

      // Prisma known errors → friendly messages
      if (err instanceof Prisma.PrismaClientKnownRequestError) {
        const msgMap: Record<string, string> = {
          P2002: "এই তথ্য ইতিমধ্যে আছে (duplicate)",
          P2003: "সম্পর্কিত তথ্য পাওয়া যায়নি",
          P2025: "রেকর্ড পাওয়া যায়নি",
          P2014: "অবৈধ সম্পর্ক",
        };
        return NextResponse.json(
          { error: msgMap[err.code] || "ডেটাবেস সমস্যা হয়েছে" },
          { status: 400 }
        );
      }

      // Network / connection errors
      if (err?.message?.includes("Can't reach database") || err?.message?.includes("connect")) {
        return NextResponse.json(
          { error: "ডেটাবেস সংযোগ ব্যর্থ। ইন্টারনেট চেক করুন।" },
          { status: 503 }
        );
      }

      // Validation errors
      if (err?.message?.includes("validation") || err?.message?.includes("Invalid")) {
        return NextResponse.json(
          { error: "তথ্য সঠিক নয়" },
          { status: 400 }
        );
      }

      // Generic fallback — never expose internals
      return NextResponse.json(
        { error: "সার্ভার সমস্যা হয়েছে। আবার চেষ্টা করুন।" },
        { status: 500 }
      );
    }
  };
}

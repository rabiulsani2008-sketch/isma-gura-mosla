import { cookies } from "next/headers";
import { db } from "@/lib/db";

export interface Session {
  shopId: string;
  userId: string;
  shopName: string;
  userName: string;
}

const SESSION_COOKIE = "isma_session";

/** Server-side: read the current session from the cookie. */
export async function getSession(): Promise<Session | null> {
  const store = await cookies();
  const raw = store.get(SESSION_COOKIE)?.value;
  if (!raw) return null;
  try {
    const parsed = JSON.parse(raw) as Session;
    // Verify shop still exists
    const shop = await db.shop.findUnique({ where: { id: parsed.shopId } });
    if (!shop) return null;
    return parsed;
  } catch {
    return null;
  }
}

/** Server-side: set the session cookie. */
export async function setSession(session: Session) {
  const store = await cookies();
  store.set(SESSION_COOKIE, JSON.stringify(session), {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    maxAge: 60 * 60 * 24 * 30, // 30 days
  });
}

/** Server-side: clear the session cookie. */
export async function clearSession() {
  const store = await cookies();
  store.delete(SESSION_COOKIE);
}

/** API helper: require a session or return 401. */
export async function requireSession(): Promise<Session> {
  const s = await getSession();
  if (!s) {
    throw new Error("UNAUTHORIZED");
  }
  return s;
}

/** Client-side helper: store session in localStorage after login. */
export const CLIENT_SESSION_KEY = "isma_client_session";

export function setClientSession(session: Session) {
  if (typeof window === "undefined") return;
  localStorage.setItem(CLIENT_SESSION_KEY, JSON.stringify(session));
}

export function getClientSession(): Session | null {
  if (typeof window === "undefined") return null;
  const raw = localStorage.getItem(CLIENT_SESSION_KEY);
  if (!raw) return null;
  try {
    return JSON.parse(raw) as Session;
  } catch {
    return null;
  }
}

export function clearClientSession() {
  if (typeof window === "undefined") return;
  localStorage.removeItem(CLIENT_SESSION_KEY);
}

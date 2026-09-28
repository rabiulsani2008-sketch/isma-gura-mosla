/**
 * Resilient fetch — automatically retries on failure.
 * Solves Vercel cold-start timeouts and temporary network issues.
 * The app never shows "app has issue" — it just retries silently.
 */
export async function fetchWithRetry(url: string, options?: RequestInit, retries = 3): Promise<Response> {
  let lastError: Error | null = null;
  for (let i = 0; i < retries; i++) {
    try {
      const r = await fetch(url, options);
      if (r.ok || r.status < 500) return r; // retry only on 500+ (server errors)
      lastError = new Error(`HTTP ${r.status}`);
    } catch (e) {
      lastError = e as Error;
    }
    // Wait before retry (exponential backoff: 1s, 2s, 4s)
    if (i < retries - 1) {
      await new Promise((resolve) => setTimeout(resolve, 1000 * Math.pow(2, i)));
    }
  }
  throw lastError || new Error("Network error");
}

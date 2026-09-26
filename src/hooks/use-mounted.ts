"use client";

import { useState, useEffect } from "react";

/**
 * Returns true after the component has mounted on the client.
 * Use this to guard against hydration mismatches (e.g. when rendering Date or localStorage values).
 *
 * Example:
 * const mounted = useMounted();
 * const today = mounted ? new Date() : null;
 */
export function useMounted(): boolean {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    // eslint-disable-next-line react-hooks/set-state-in-effect
    setMounted(true);
  }, []);
  return mounted;
}

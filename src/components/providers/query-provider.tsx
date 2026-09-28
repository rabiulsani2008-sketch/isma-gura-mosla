"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";

export function QueryProvider({ children }: { children: React.ReactNode }) {
  const [client] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 60_000, // 1 min — don't refetch when switching tabs
            gcTime: 5 * 60_000, // keep cached data for 5 min
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false, // don't refetch when component remounts
          },
        },
      })
  );
  return <QueryClientProvider client={client}>{children}</QueryClientProvider>;
}

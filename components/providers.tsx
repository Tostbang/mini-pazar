"use client";

import { QueryClientProvider } from "@tanstack/react-query";
import { useEffect, useState } from "react";
import { Toaster } from "sonner";
import { getSharedQueryClient } from "@/lib/query-client";
import { savePersistedCache } from "@/lib/query-persist";

export function AppProviders({ children }: { children: React.ReactNode }) {
  // Share one QueryClient across both (site) and (dash) layouts so a
  // category change in the dashboard invalidates the storefront cache too.
  // See lib/query-client.ts for the full rationale.
  const [queryClient] = useState(() => getSharedQueryClient());

  // Mirror cache changes into sessionStorage so the snapshot stays current
  // while the user interacts (mutations, optimistic updates, refetches), and
  // survives the global 404 unmount.
  useEffect(() => {
    const cache = queryClient.getQueryCache();
    savePersistedCache(queryClient);
    const unsubscribe = cache.subscribe(() => {
      savePersistedCache(queryClient);
    });
    return () => {
      unsubscribe();
      savePersistedCache(queryClient);
    };
  }, [queryClient]);

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toaster]:bg-primary group-[.toaster]:text-primary-foreground",
            cancelButton:
              "group-[.toaster]:bg-muted group-[.toaster]:text-muted-foreground",
          },
        }}
      />
    </QueryClientProvider>
  );
}
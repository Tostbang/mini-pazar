import { QueryClient } from "@tanstack/react-query";
import { toast } from "sonner";
import { loadPersistedCache } from "./query-persist";

// The project uses Next.js's multi-root layout pattern: (site) and (dash)
// each render their own <html> with their own <AppProviders>. Without
// coordination, every layout would mint a fresh QueryClient via `useState`,
// giving the storefront and the dashboard independent caches. A category
// created in /dash/categories would invalidate the dashboard's
// GetAllCategory query while the storefront's CategoryPills kept reading
// its own (now stale) cache — `staleTime` plus `refetchOnMount: false`
// meant the home page never refetched after the change.
//
// Hoisting the client to a module-level singleton makes both layouts share
// one cache: mutations in the dashboard invalidate the same entry the
// storefront reads, so the home page picks up changes on the next render
// or refetch. The singleton lives for the lifetime of the JS context, so
// navigation between (site) and (dash) preserves cached data without
// relying on the sessionStorage snapshot for cross-layout propagation.
let sharedClient: QueryClient | null = null;

export function getSharedQueryClient(): QueryClient {
  if (sharedClient) return sharedClient;
  const client = new QueryClient({
    defaultOptions: {
      queries: {
        staleTime: 1000 * 60 * 5,
        gcTime: 1000 * 60 * 10,
        retry: 1,
        refetchOnWindowFocus: false,
        refetchOnMount: false,
      },
      mutations: {
        onError: (e) => {
          if (e?.message === "NEXT_REDIRECT") return;
          const code =
            e && typeof e === "object" && "code" in e
              ? (e as { code?: string }).code
              : undefined;
          if (code === "401") return;
          const status =
            e && typeof e === "object" && "status" in e
              ? (e as { status?: number }).status
              : undefined;
          if (typeof status === "number" && status >= 500) {
            toast.error(
              "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
            );
            return;
          }
          toast.error(
            (e as { message?: string } | null)?.message ?? "Bir hata oluştu",
          );
        },
      },
    },
  });

  // Hydrate from sessionStorage on first creation only. Subsequent layouts
  // reuse the already-populated client. loadPersistedCache is a no-op on
  // the server, so SSR is unaffected.
  const persisted = loadPersistedCache();
  if (persisted) {
    for (const entry of persisted) {
      client.setQueryData(entry.queryKey, entry.state.data as never, {
        updatedAt: entry.state.dataUpdatedAt,
      });
    }
  }

  sharedClient = client;
  return sharedClient;
}
import type { QueryClient, QueryKey } from "@tanstack/react-query";

// Key under which we stash the serialized TanStack Query cache in
// sessionStorage. Bump the version suffix if the persisted shape changes.
const STORAGE_KEY = "mp-query-cache-v1";

// User-specific endpoints must NEVER be persisted: rehydrating them on a new
// tab/session causes server-rendered HTML to mismatch the client because the
// server can't see what was in the previous session. Per-user data also
// carries privacy risk if a different user opens the same browser session
// before clearPersistedCache runs.
const USER_SPECIFIC_PATH_PREFIXES = [
  "/api/Cart/",
  "/api/Order/",
  "/api/User/",
  "/api/Auth/",
  // Site settings change live from the dashboard and must never be served
  // from a stale snapshot — exclude the endpoint from sessionStorage
  // rehydration entirely.
  "/api/SiteSettings/",
] as const;

type PersistedEntry = {
  queryKey: readonly unknown[];
  state: {
    data: unknown;
    dataUpdatedAt: number;
  };
};

function isPersistedEntry(value: unknown): value is PersistedEntry {
  if (typeof value !== "object" || value === null) return false;
  const entry = value as { queryKey?: unknown; state?: unknown };
  if (!Array.isArray(entry.queryKey)) return false;
  if (typeof entry.state !== "object" || entry.state === null) return false;
  const state = entry.state as { data?: unknown; dataUpdatedAt?: unknown };
  return typeof state.dataUpdatedAt === "number";
}

// openapi-react-query keys look like [method, path, ...]. We pull the path
// segment and check it against the user-specific list.
function getPathFromKey(key: readonly unknown[]): string | null {
  for (const segment of key) {
    if (typeof segment === "string" && segment.startsWith("/")) return segment;
  }
  return null;
}

function isUserSpecificKey(key: QueryKey): boolean {
  const path = getPathFromKey(key);
  if (!path) return false;
  return USER_SPECIFIC_PATH_PREFIXES.some((prefix) => path.startsWith(prefix));
}

/**
 * Read the persisted cache snapshot from sessionStorage. Returns `null` when
 * we're not in a browser, when nothing was persisted, or when the stored blob
 * is malformed.
 *
 * We intentionally use `sessionStorage` rather than `localStorage`: the cache
 * is only meaningful for the current tab and clearing it on tab close avoids
 * serving stale data after long absences.
 *
 * User-specific queries (cart, orders, profile, auth) are filtered out of
 * the snapshot so rehydration can never inject server-unknown data into
 * the client tree — that would cause hydration mismatches the first time
 * the home page renders.
 */
export function loadPersistedCache(): PersistedEntry[] | null {
  if (typeof window === "undefined") return null;
  try {
    const raw = window.sessionStorage.getItem(STORAGE_KEY);
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!Array.isArray(parsed)) return null;
    return parsed
      .filter(isPersistedEntry)
      .filter((entry) => !isUserSpecificKey(entry.queryKey));
  } catch {
    return null;
  }
}

/**
 * Persist successful queries (with their data + freshness timestamp) from the
 * given QueryClient into sessionStorage. Errors from quota / serialization
 * issues are swallowed — persistence is a best-effort optimization, not a
 * correctness requirement.
 *
 * User-specific queries are skipped: cart, profile, and auth responses are
 * never stable across sessions and including them would surface stale data
 * (or trigger hydration mismatches) on the next visit.
 */
export function savePersistedCache(client: QueryClient): void {
  if (typeof window === "undefined") return;
  try {
    const entries = client
      .getQueryCache()
      .getAll()
      .filter(
        (q) =>
          q.state.status === "success" &&
          q.state.data !== undefined &&
          !isUserSpecificKey(q.queryKey),
      )
      .map<PersistedEntry>((q) => ({
        queryKey: q.queryKey,
        state: {
          data: q.state.data,
          dataUpdatedAt: q.state.dataUpdatedAt,
        },
      }));
    window.sessionStorage.setItem(STORAGE_KEY, JSON.stringify(entries));
  } catch {
    // Best-effort: ignore quota exceeded, private-mode failures, or
    // non-serializable payloads.
  }
}

/**
 * Remove the persisted cache snapshot from sessionStorage. Call this whenever
 * the user's identity changes (logout, account deletion, fresh login) so the
 * next user cannot see the previous user's cached responses when the
 * (site) layout remounts.
 */
export function clearPersistedCache(): void {
  if (typeof window === "undefined") return;
  try {
    window.sessionStorage.removeItem(STORAGE_KEY);
  } catch {
    // Best-effort: ignore storage errors (private mode, quota, etc.).
  }
}
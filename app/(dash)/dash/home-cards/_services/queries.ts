"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { components } from "@/lib/types/api";

/**
 * Form values mirror the `UpdateHomeCardRequest` schema verbatim so the
 * editor can PUT the form state straight to `/api/Home/UpdateHomeCard`.
 * Nullable string fields use `string | null` rather than `""` to keep
 * the wire payload identical to what the backend expects (an empty
 * title should round-trip as `null`, not `""`).
 */
export type HomeCardsFormValues = components["schemas"]["UpdateHomeCardRequest"];

export type HomeCardsPayload = NonNullable<
  Awaited<ReturnType<ReturnType<typeof useGetAdminHomeCards>["refetch"]>>["data"]
>;

export function useGetAdminHomeCards() {
  return useQueryOP("get", "/api/Home/GetHomeCards", {
    refetchOnMount: true,
  });
}

export function useUpdateHomeCards() {
  const queryClient = useQueryClient();
  return useMutationOP("put", "/api/Home/UpdateHomeCard", {
    onSuccess: () => {
      // The homepage reads from this same key, so invalidating it
      // immediately propagates the admin's edit to the storefront on
      // the next navigation.
      queryClient.invalidateQueries({
        queryKey: ["get", "/api/Home/GetHomeCards"],
      });
    },
  });
}
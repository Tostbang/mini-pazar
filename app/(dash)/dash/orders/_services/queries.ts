"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import { OrderStatus } from "@/lib/types/enums";
import type { paths } from "@/lib/types/api";

type OrdersListResponse =
  paths["/api/Order/AdminGetAllOrders"]["post"]["responses"]["200"]["content"]["application/json"];

export type OrderListItem = NonNullable<OrdersListResponse["orders"]>[number];

type OrderDetailResponse =
  paths["/api/Order/AdminGetOrderById/{orderId}"]["get"]["responses"]["200"]["content"]["application/json"];

export type OrderDetail = NonNullable<OrderDetailResponse["order"]>;

type UpdateStatusResponse =
  paths["/api/Order/AdminUpdateOrderStatus"]["put"]["responses"]["200"]["content"]["application/json"];

export type UpdateOrderStatusResponse = UpdateStatusResponse;

export { OrderStatus };

/**
 * Admin: tüm siparişleri listeler.
 * `orderState` filtresi zorunlu; "Tümü" seçildiğinde liste sayfası
 * tüm durumlar için ayrı istek atıp sonuçları birleştirir.
 *
 * `refetchOnMount: true` overrides the global `refetchOnMount: false`
 * set in `components/providers.tsx`. The list page is mounted fresh
 * every time the user returns from a detail page; combined with the
 * force-refetch inside `useInvalidateOrders` (see below) the table is
 * guaranteed to show post-update data without a manual "Yenile" click.
 * TanStack Query still returns cached data instantly while the
 * background refetch runs, so the user sees no loading flash.
 */
export function useGetAdminOrders(orderState: OrderStatus) {
  return useQueryOP("post", "/api/Order/AdminGetAllOrders", {
    body: { orderState },
    refetchOnMount: true,
  });
}

/**
 * Admin: belirli bir siparişin detayını getirir.
 */
export function useGetAdminOrderById(orderId: number, enabled = true) {
  return useQueryOP("get", "/api/Order/AdminGetOrderById/{orderId}", {
    params: { path: { orderId } },
    enabled: enabled && orderId > 0,
  });
}

function useInvalidateOrders() {
  const queryClient = useQueryClient();
  return () => {
    // Force-refetch both the list (per status) and detail queries, even
    // for the statuses whose tab the user isn't currently viewing.
    //
    // `invalidateQueries` defaults to `refetchType: "active"`, which
    // leaves the eight status queries on the list page as merely-stale
    // while the user is on the detail page — and if the user navigates
    // back before the mutation's onSuccess fires, `refetchOnMount: true`
    // runs against a not-yet-stale cache and renders the pre-update
    // snapshot. `refetchType: "all"` flips both stale-marking AND
    // immediate refetch on for every matching query, so the cache holds
    // fresh data no matter which page is mounted when the user returns.
    queryClient.invalidateQueries({
      queryKey: ["post", "/api/Order/AdminGetAllOrders"],
      refetchType: "all",
    });
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/Order/AdminGetOrderById/{orderId}"],
      refetchType: "all",
    });
  };
}

export function useUpdateOrderStatus() {
  const invalidate = useInvalidateOrders();
  return useMutationOP("put", "/api/Order/AdminUpdateOrderStatus", {
    onSuccess: invalidate,
  });
}

"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetMyOrdersResponse =
  paths["/api/Order/GetMyOrders"]["get"]["responses"]["200"]["content"]["application/json"];

type GetOrderByIdResponse =
  paths["/api/Order/GetOrderById/{orderId}"]["get"]["responses"]["200"]["content"]["application/json"];

type CancelMyOrderResponse =
  paths["/api/Order/CancelMyOrder/{orderId}"]["put"]["responses"]["200"]["content"]["application/json"];

export type OrderListItem = NonNullable<GetMyOrdersResponse["orders"]>[number];
export type OrderDetail = GetOrderByIdResponse["order"];

export const MY_ORDERS_QUERY_KEY: QueryKey = ["get", "/api/Order/GetMyOrders"];

export const orderByIdQueryKey = (orderId: number): QueryKey => [
  "get",
  "/api/Order/GetOrderById/{orderId}",
  { params: { path: { orderId } } },
];

export function useGetMyOrders() {
  return useQueryOP("get", "/api/Order/GetMyOrders", {});
}

export function useGetOrderById(orderId: number) {
  return useQueryOP("get", "/api/Order/GetOrderById/{orderId}", {
    params: { path: { orderId } },
  });
}

export function useCancelMyOrder() {
  const queryClient = useQueryClient();
  return useMutationOP("put", "/api/Order/CancelMyOrder/{orderId}", {
    onSuccess: (_data, variables) => {
      const orderId = variables?.params?.path?.orderId;
      queryClient.invalidateQueries({ queryKey: MY_ORDERS_QUERY_KEY });
      if (typeof orderId === "number") {
        queryClient.invalidateQueries({
          queryKey: orderByIdQueryKey(orderId),
        });
      }
    },
  });
}

export type CancelMyOrderData = CancelMyOrderResponse;
"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { components, paths } from "@/lib/types/api";

type GetMyCartResponse =
  paths["/api/Cart/GetMyCart"]["get"]["responses"]["200"]["content"]["application/json"];

type ProductListResponse =
  paths["/api/List/GetAllProduct"]["get"]["responses"]["200"]["content"]["application/json"];

export type Cart = GetMyCartResponse["cart"];
export type CartItem = NonNullable<Cart["items"]>[number];
export type ProductListItem = NonNullable<ProductListResponse["products"]>[number];

export type AddCartItemVariables = components["schemas"]["AddCartItemRequest"];
export type UpdateCartItemVariables = components["schemas"]["UpdateCartItemRequest"];
export type RemoveCartItemVariables = components["schemas"]["RemoveCartItemRequest"];

export type AddToCartMeta = {
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  stock: number;
};

export const CART_QUERY_KEY: QueryKey = ["get", "/api/Cart/GetMyCart"];
const PRODUCT_LIST_QUERY_KEY: QueryKey = ["get", "/api/List/GetAllProduct"];

export type CartMutationContext = { previous: GetMyCartResponse | undefined };

const round2 = (n: number) => Math.round(n * 100) / 100;

export function recomputeTotals(items: CartItem[]): {
  totalItems: number;
  subTotal: number;
} {
  let totalItems = 0;
  let subTotal = 0;
  for (const it of items) {
    totalItems += it.quantity;
    subTotal += it.lineTotal;
  }
  return { totalItems, subTotal: round2(subTotal) };
}

export function withRecomputedTotals(cart: Cart, items: CartItem[]): Cart {
  const { totalItems, subTotal } = recomputeTotals(items);
  return {
    ...cart,
    items,
    totalItems,
    subTotal,
    totalAmount: round2(subTotal + cart.shippingFee),
  };
}

export function optimisticAdd(cart: Cart, item: CartItem): Cart {
  const items = cart.items ? [...cart.items] : [];
  const existingIdx = items.findIndex((it) => it.productId === item.productId);

  if (existingIdx >= 0) {
    const existing = items[existingIdx];
    const newQty = existing.quantity + item.quantity;
    items[existingIdx] = {
      ...existing,
      quantity: newQty,
      lineTotal: round2(existing.unitPrice * newQty),
    };
  } else {
    items.push(item);
  }

  return withRecomputedTotals(cart, items);
}

export function optimisticUpdateQty(
  cart: Cart,
  cartItemId: number,
  quantity: number,
): Cart {
  const items = (cart.items ?? []).map((it) =>
    it.cartItemId === cartItemId
      ? { ...it, quantity, lineTotal: round2(it.unitPrice * quantity) }
      : it,
  );
  return withRecomputedTotals(cart, items);
}

export function optimisticRemove(cart: Cart, cartItemId: number): Cart {
  const items = (cart.items ?? []).filter((it) => it.cartItemId !== cartItemId);
  return withRecomputedTotals(cart, items);
}

export function optimisticClear(cart: Cart): Cart {
  return withRecomputedTotals(cart, []);
}

export function useGetMyCart() {
  return useQueryOP("get", "/api/Cart/GetMyCart", {});
}

let tempIdCounter = 0;
function nextTempId(): number {
  tempIdCounter = (tempIdCounter + 1) % 1_000_000;
  return -Date.now() - tempIdCounter;
}

function findProductInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  productId: number,
): ProductListItem | null {
  const data = queryClient.getQueryData<ProductListResponse>(
    PRODUCT_LIST_QUERY_KEY,
  );
  if (!data?.products) return null;
  return data.products.find((p) => p.productId === productId) ?? null;
}

export function useAddCartItem() {
  const queryClient = useQueryClient();
  return useMutationOP("post", "/api/Cart/AddItem", {
    onMutate: async (variables): Promise<CartMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<GetMyCartResponse>(CART_QUERY_KEY);

      if (previous) {
        const body = variables?.body as AddCartItemVariables | undefined;
        const passedMeta = (variables as { product?: AddToCartMeta } | undefined)
          ?.product;

        let resolvedMeta: AddToCartMeta | null = passedMeta ?? null;
        if (!resolvedMeta && body) {
          const cached = findProductInCache(queryClient, body.productId);
          if (cached) {
            resolvedMeta = {
              productName: cached.name ?? "Ürün",
              productImageUrl: cached.imageUrl ?? null,
              unitPrice: cached.price,
              stock: 999,
            };
          }
        }

        if (body && resolvedMeta) {
          const optimisticItem: CartItem = {
            cartItemId: nextTempId(),
            productId: body.productId,
            productName: resolvedMeta.productName,
            productImageUrl: resolvedMeta.productImageUrl,
            unitPrice: resolvedMeta.unitPrice,
            quantity: body.quantity,
            stock: resolvedMeta.stock,
            lineTotal: round2(resolvedMeta.unitPrice * body.quantity),
          };
          queryClient.setQueryData<GetMyCartResponse>(CART_QUERY_KEY, {
            ...previous,
            cart: optimisticAdd(previous.cart, optimisticItem),
          });
        }
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useUpdateCartItem() {
  const queryClient = useQueryClient();
  return useMutationOP("put", "/api/Cart/UpdateItem", {
    onMutate: async (variables): Promise<CartMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<GetMyCartResponse>(CART_QUERY_KEY);

      if (previous) {
        const body = variables?.body as UpdateCartItemVariables | undefined;
        if (body) {
          queryClient.setQueryData<GetMyCartResponse>(CART_QUERY_KEY, {
            ...previous,
            cart: optimisticUpdateQty(previous.cart, body.cartItemId, body.quantity),
          });
        }
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useRemoveCartItem() {
  const queryClient = useQueryClient();
  return useMutationOP("delete", "/api/Cart/RemoveItem", {
    onMutate: async (variables): Promise<CartMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<GetMyCartResponse>(CART_QUERY_KEY);

      if (previous) {
        const body = variables?.body as RemoveCartItemVariables | undefined;
        if (body) {
          queryClient.setQueryData<GetMyCartResponse>(CART_QUERY_KEY, {
            ...previous,
            cart: optimisticRemove(previous.cart, body.cartItemId),
          });
        }
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}

export function useClearCart() {
  const queryClient = useQueryClient();
  return useMutationOP("delete", "/api/Cart/Clear", {
    onMutate: async (): Promise<CartMutationContext> => {
      await queryClient.cancelQueries({ queryKey: CART_QUERY_KEY });
      const previous = queryClient.getQueryData<GetMyCartResponse>(CART_QUERY_KEY);

      if (previous) {
        queryClient.setQueryData<GetMyCartResponse>(CART_QUERY_KEY, {
          ...previous,
          cart: optimisticClear(previous.cart),
        });
      }

      return { previous };
    },
    onError: (_err, _vars, context) => {
      if (context?.previous) {
        queryClient.setQueryData(CART_QUERY_KEY, context.previous);
      }
    },
    onSettled: () => {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    },
  });
}
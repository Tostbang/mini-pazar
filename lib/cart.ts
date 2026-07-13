"use client";

import { useQueryClient, type QueryKey } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { components, paths } from "@/lib/types/api";

type GetMyCartResponse =
  paths["/api/Cart/GetMyCart"]["get"]["responses"]["200"]["content"]["application/json"];

type ProductListResponse =
  paths["/api/List/GetAllProduct"]["get"]["responses"]["200"]["content"]["application/json"];

export type Cart = GetMyCartResponse["cart"];
export type CartItem = NonNullable<
  NonNullable<Cart["categoryGroups"]>[number]["products"]
>[number];
export type CartCategoryGroup = NonNullable<Cart["categoryGroups"]>[number];
export type ProductListItem = NonNullable<ProductListResponse["products"]>[number];

export type AddCartItemVariables = components["schemas"]["AddCartItemRequest"];
export type UpdateCartItemVariables = components["schemas"]["UpdateCartItemRequest"];
export type RemoveCartItemVariables = components["schemas"]["RemoveCartItemRequest"];

export type AddToCartMeta = {
  productName: string;
  productImageUrl: string | null;
  unitPrice: number;
  stock: number;
  categoryId: number;
  categoryName: string | null;
  categoryIcon: string | null;
};

export const CART_QUERY_KEY: QueryKey = ["get", "/api/Cart/GetMyCart"];
const PRODUCT_LIST_QUERY_KEY: QueryKey = ["get", "/api/List/GetAllProduct"];

export type CartMutationContext = { previous: GetMyCartResponse | undefined };

const round2 = (n: number) => Math.round(n * 100) / 100;

/** Flatten every category group's products into a single array. */
export function flattenCartItems(cart: Cart | null | undefined): CartItem[] {
  const groups = cart?.categoryGroups ?? [];
  const out: CartItem[] = [];
  for (const g of groups) {
    for (const p of g.products ?? []) {
      out.push(p);
    }
  }
  return out;
}

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

function withRecomputedTotalsFromCart(cart: Cart): Cart {
  const items = flattenCartItems(cart);
  const { totalItems, subTotal } = recomputeTotals(items);
  return {
    ...cart,
    totalItems,
    subTotal,
    totalAmount: round2(subTotal + cart.shippingFee),
  };
}

/**
 * Apply a mutation to the items inside a single category group, creating
 * the group if it doesn't exist yet. Used by optimistic add / update /
 * remove — keeps the grouping intact so the cart UI can still render the
 * accordion by category.
 */
function applyToGroup(
  cart: Cart,
  categoryId: number,
  categoryName: string | null,
  categoryIcon: string | null,
  mutator: (products: CartItem[]) => CartItem[],
): Cart {
  const groups: CartCategoryGroup[] = cart.categoryGroups
    ? [...cart.categoryGroups]
    : [];
  let target = groups.find((g) => g.categoryId === categoryId);
  if (!target) {
    target = {
      categoryId,
      categoryName,
      categoryIcon,
      products: [],
    };
    groups.push(target);
  } else if (categoryName || categoryIcon) {
    // Backfill name/icon if we now have one and the server didn't.
    target = {
      ...target,
      categoryName: target.categoryName ?? categoryName,
      categoryIcon: target.categoryIcon ?? categoryIcon,
    };
    const idx = groups.findIndex((g) => g.categoryId === categoryId);
    groups[idx] = target;
  }
  const updated = {
    ...target,
    products: mutator(target.products ?? []),
  };
  const idx = groups.findIndex((g) => g.categoryId === categoryId);
  groups[idx] = updated;
  return withRecomputedTotalsFromCart({ ...cart, categoryGroups: groups });
}

/**
 * Look up a product's categoryId / categoryName / categoryIcon by searching
 * the existing categoryGroups. Returns nulls if the product isn't already
 * grouped (the optimistic add will then create a new group without a name).
 */
function findCategoryMetaForProduct(
  cart: Cart,
  productId: number,
): { categoryId: number; categoryName: string | null; categoryIcon: string | null } | null {
  for (const g of cart.categoryGroups ?? []) {
    if ((g.products ?? []).some((p) => p.productId === productId)) {
      return {
        categoryId: g.categoryId,
        categoryName: g.categoryName,
        categoryIcon: g.categoryIcon,
      };
    }
  }
  return null;
}

export function optimisticAdd(
  cart: Cart,
  item: CartItem,
  categoryMeta: { categoryId: number; categoryName: string | null; categoryIcon: string | null },
): Cart {
  return applyToGroup(cart, categoryMeta.categoryId, categoryMeta.categoryName, categoryMeta.categoryIcon, (products) => {
    const idx = products.findIndex((it) => it.productId === item.productId);
    if (idx >= 0) {
      const existing = products[idx];
      const newQty = existing.quantity + item.quantity;
      const next = [...products];
      next[idx] = {
        ...existing,
        quantity: newQty,
        lineTotal: round2(existing.unitPrice * newQty),
      };
      return next;
    }
    return [...products, item];
  });
}

export function optimisticUpdateQty(
  cart: Cart,
  cartItemId: number,
  quantity: number,
): Cart {
  for (const g of cart.categoryGroups ?? []) {
    if ((g.products ?? []).some((it) => it.cartItemId === cartItemId)) {
      return applyToGroup(cart, g.categoryId, null, null, (products) =>
        products.map((it) =>
          it.cartItemId === cartItemId
            ? { ...it, quantity, lineTotal: round2(it.unitPrice * quantity) }
            : it,
        ),
      );
    }
  }
  return cart;
}

export function optimisticRemove(cart: Cart, cartItemId: number): Cart {
  for (const g of cart.categoryGroups ?? []) {
    if ((g.products ?? []).some((it) => it.cartItemId === cartItemId)) {
      return applyToGroup(cart, g.categoryId, null, null, (products) =>
        products.filter((it) => it.cartItemId !== cartItemId),
      );
    }
  }
  return cart;
}

export function optimisticClear(cart: Cart): Cart {
  return withRecomputedTotalsFromCart({ ...cart, categoryGroups: [] });
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

function findCategoryInCache(
  queryClient: ReturnType<typeof useQueryClient>,
  categoryId: number,
): { categoryName: string | null; categoryIcon: string | null } {
  const data = queryClient.getQueryData<
    paths["/api/List/GetAllCategory"]["get"]["responses"]["200"]["content"]["application/json"]
  >(["get", "/api/List/GetAllCategory"]);
  const match = (data?.categories ?? []).find((c) => c.categoryId === categoryId);
  return {
    categoryName: match?.categoryName ?? null,
    categoryIcon: match?.imageUrl ?? null,
  };
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
            const cat = findCategoryInCache(queryClient, cached.categoryId);
            resolvedMeta = {
              productName: cached.name ?? "Ürün",
              productImageUrl: cached.imageUrl ?? null,
              unitPrice: cached.price,
              stock: 999,
              categoryId: cached.categoryId,
              categoryName: cat.categoryName,
              categoryIcon: cat.categoryIcon,
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
          // If we don't yet have the new product's categoryId but the
          // server has the item elsewhere in the cart, reuse that.
          const fallbackMeta = resolvedMeta.categoryId
            ? null
            : findCategoryMetaForProduct(previous.cart, body.productId);
          const categoryMeta = resolvedMeta.categoryId
            ? {
                categoryId: resolvedMeta.categoryId,
                categoryName: resolvedMeta.categoryName,
                categoryIcon: resolvedMeta.categoryIcon,
              }
            : fallbackMeta;
          if (categoryMeta) {
            queryClient.setQueryData<GetMyCartResponse>(CART_QUERY_KEY, {
              ...previous,
              cart: optimisticAdd(previous.cart, optimisticItem, categoryMeta),
            });
          }
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
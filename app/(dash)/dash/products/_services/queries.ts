"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

export { useUploadImage } from "@/lib/upload";

type ProductListResponse =
  paths["/api/List/GetAllProduct"]["get"]["responses"]["200"]["content"]["application/json"];

export type ProductListItem = NonNullable<ProductListResponse["products"]>[number];

type CategoryListResponse =
  paths["/api/List/GetAllCategory"]["get"]["responses"]["200"]["content"]["application/json"];

export type CategoryListItem = NonNullable<
  CategoryListResponse["categories"]
>[number];

export function useGetProducts() {
  return useQueryOP("get", "/api/List/GetAllProduct", {});
}

export function useGetCategories() {
  return useQueryOP("get", "/api/List/GetAllCategory", {});
}

export function useGetProductById(productId: number, enabled = true) {
  return useQueryOP("get", "/api/List/GetByIdProduct/{productId}", {
    params: { path: { productId } },
    enabled: enabled && Number.isFinite(productId) && productId > 0,
  });
}

function useInvalidateProducts() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/List/GetAllProduct"],
    });
  };
}

export function useCreateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutationOP("post", "/api/Admin/AddProduct", {
    onSuccess: invalidate,
  });
}

export function useUpdateProduct() {
  const invalidate = useInvalidateProducts();
  return useMutationOP("put", "/api/Admin/UpdateProduct", {
    onSuccess: invalidate,
  });
}

export function useDeleteProduct() {
  const invalidate = useInvalidateProducts();
  return useMutationOP("delete", "/api/Admin/DeleteProduct", {
    onSuccess: invalidate,
  });
}

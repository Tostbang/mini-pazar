"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type CategoryListResponse =
  paths["/api/List/GetAllCategory"]["get"]["responses"]["200"]["content"]["application/json"];

export type CategoryListItem = NonNullable<
  CategoryListResponse["categories"]
>[number];

export function useGetCategories() {
  return useQueryOP("get", "/api/List/GetAllCategory", {});
}

function useInvalidateCategories() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({
      queryKey: ["get", "/api/List/GetAllCategory"],
    });
  };
}

export function useCreateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutationOP("post", "/api/Admin/AddCategory", {
    onSuccess: invalidate,
  });
}

export function useUpdateCategory() {
  const invalidate = useInvalidateCategories();
  return useMutationOP("put", "/api/Admin/UpdateCategory", {
    onSuccess: invalidate,
  });
}

export function useDeleteCategory() {
  const invalidate = useInvalidateCategories();
  return useMutationOP("delete", "/api/Admin/DeleteCategory", {
    onSuccess: invalidate,
  });
}

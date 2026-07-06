"use client";

import { useQueryClient } from "@tanstack/react-query";
import { useMutationOP, useQueryOP } from "@/lib/fetch";
import type { paths } from "@/lib/types/api";

type GetAllUsersResponse =
  paths["/api/Admin/GetAllUsers"]["post"]["responses"]["200"]["content"]["application/json"];

type GetUserByIdResponse =
  paths["/api/Admin/GetUserById"]["post"]["responses"]["200"]["content"]["application/json"];

export type AdminUser = NonNullable<GetAllUsersResponse["users"]>[number];
export type AdminUserDetail = NonNullable<GetUserByIdResponse["user"]>;

export const USERS_QUERY_KEY = ["post", "/api/Admin/GetAllUsers"] as const;
export const USER_BY_ID_QUERY_KEY = [
  "post",
  "/api/Admin/GetUserById",
] as const;
const DELETE_USER_QUERY_KEY = ["delete", "/api/Admin/DeleteUser"] as const;

export function useGetAllUsers(
  body: NonNullable<
    paths["/api/Admin/GetAllUsers"]["post"]["requestBody"]
  >["content"]["application/json"],
  options?: { enabled?: boolean },
) {
  return useQueryOP("post", "/api/Admin/GetAllUsers", {
    body,
    enabled: options?.enabled ?? true,
  });
}

export function useGetUserById(
  body: NonNullable<
    paths["/api/Admin/GetUserById"]["post"]["requestBody"]
  >["content"]["application/json"],
  options?: { enabled?: boolean },
) {
  return useQueryOP("post", "/api/Admin/GetUserById", {
    body,
    enabled: options?.enabled ?? true,
  });
}

function useInvalidateUsers() {
  const queryClient = useQueryClient();
  return () => {
    queryClient.invalidateQueries({ queryKey: USERS_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: USER_BY_ID_QUERY_KEY });
    queryClient.invalidateQueries({ queryKey: DELETE_USER_QUERY_KEY });
  };
}

export function useDeleteUser() {
  const invalidate = useInvalidateUsers();
  return useMutationOP("delete", "/api/Admin/DeleteUser", {
    onSuccess: invalidate,
  });
}

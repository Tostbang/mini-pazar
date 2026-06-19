"use client";

import { useMutation } from "@tanstack/react-query";
import { ApiError, baseUrl } from "@/lib/fetch";
import { getToken } from "@/lib/helpers";
import type { paths } from "@/lib/types/api";

type FileUploadResponse =
  paths["/api/Admin/UploadImage"]["post"]["responses"]["200"]["content"]["application/json"];

export async function uploadImage({
  file,
  type = "product",
}: {
  file: File;
  type?: string;
}): Promise<FileUploadResponse> {
  const formData = new FormData();
  formData.append("File", file);
  formData.append("Type", type);

  const response = await fetch(`${baseUrl}/api/Admin/UploadImage`, {
    method: "POST",
    headers: {
      Authorization: `Bearer ${getToken()}`,
    },
    body: formData,
  });

  const data = (await response.json().catch(() => null)) as
    | (FileUploadResponse & Record<string, unknown>)
    | null;

  if (data && typeof data === "object" && data.code && data.code !== "200") {
    const errors = (data.errors ?? []) as string[];
    throw new ApiError(errors[0] || data.message || "Görsel yüklenemedi.", {
      code: data.code,
      status: response.status,
    });
  }

  if (!response.ok) {
    throw new ApiError(
      (data && (data.message as string)) || `HTTP error ${response.status}`,
      { status: response.status },
    );
  }

  return data as FileUploadResponse;
}

export function useUploadImage() {
  return useMutation({
    mutationFn: uploadImage,
  });
}

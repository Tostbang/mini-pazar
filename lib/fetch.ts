import createFetchClient, { Middleware } from "openapi-fetch"
import createClient from "openapi-react-query"
import type { paths } from "@/lib/types/api"
import { deleteToken, getToken } from "./helpers"
import { isRedirectError } from "next/dist/client/components/redirect-error"

export const baseUrl = "https://marketapi20260604105905-ajfqchdfakgbhggm.canadacentral-01.azurewebsites.net"


type baseApi = {
  code?: string;
  message?: string;
  errors?: string[]
};

export class ApiError extends Error {
  code?: string;
  status?: number;

  constructor(message: string, options?: { code?: string; status?: number }) {
    super(message);
    this.code = options?.code;
    this.status = options?.status;
  }
}

export const customFetch = async (
  input: RequestInfo | URL,
  init?: RequestInit
): Promise<Response> => {
  // Don't force a JSON content-type when sending FormData; the browser will
  // attach the correct `multipart/form-data; boundary=...` header itself.
  const isFormData =
    typeof FormData !== "undefined" && init?.body instanceof FormData;

  const headers = new Headers(init?.headers);
  headers.set("Authorization", `Bearer ${getToken()}`);
  if (isFormData) {
    headers.delete("Content-Type");
  } else if (!headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }

  // 1. Perform the actual network request
  const response = await fetch(input, {
    ...init,
    headers,
    body: init?.body,
  }).catch((err) => {
    if (isRedirectError(err)) throw err;
    throw new ApiError("Bağlantı hatası", { status: 0 });
  });

  // Track whether the caller had a session so we only auto-redirect to
  // /login when a token was actually sent. Otherwise a guest probing an
  // authenticated endpoint (e.g. the public header) would be redirected
  // to /login unexpectedly.
  const hadToken = Boolean(getToken());

  // 2. YOU MUST READ THE JSON HERE
  // This is because the API returned 200 OK, so we have to look inside the body
  const data = await response.json().catch(() => null);

  // 3. Handle your custom "Business Logic" errors (like code: "400")
  if (data && typeof data === "object") {
    const api = data as any; // or your baseApi type

    // Check if the internal code is an error, even if HTTP status is 200
    if (api.code && api.code !== "200") {
      if (api.code === "401" && hadToken) {
        deleteToken();
        window.location.href = `/login`;
      }

      const errorMessage = api.errors?.[0] || api.message || "API hatası";

      // 🔥 This "throw" stops the execution and sends the error to your UI/catch block
      throw new ApiError(errorMessage, {
        code: api.code,
        status: response.status,
      });
    }
  }

  // 4. Fallback for standard HTTP errors (4xx, 5xx)
  if (!response.ok) {
    if (response.status === 401 && hadToken) {
      deleteToken()
      window.location.href = `/login`
    }
    throw new ApiError(data?.message || `HTTP error ${response.status}`, { status: response.status });
  }

  // 5. IMPORTANT: Re-create the response
  // Since we called .json() above, the original response stream is empty.
  // We must return a fresh Response object so openapi-fetch can read it.
  return new Response(JSON.stringify(data), {
    status: response.status,
    statusText: response.statusText,
    headers: response.headers,
  });
};

export const FetchClient = createFetchClient<paths>({
  baseUrl: baseUrl,
  fetch: customFetch
})

export const { useMutation: useMutationOP, useQuery: useQueryOP } = createClient(FetchClient)

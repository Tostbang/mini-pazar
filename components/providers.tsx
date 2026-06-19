"use client";

import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { useState } from "react";
import { Toaster, toast } from "sonner";

export function AppProviders({ children }: { children: React.ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: {
            staleTime: 1000 * 60 * 5,
            gcTime: 1000 * 60 * 10,
            retry: 1,
            refetchOnWindowFocus: false,
            refetchOnMount: false,
          },
          mutations: {
            onError: (e) => {
              if (e?.message === "NEXT_REDIRECT") return;
              const code =
                e && typeof e === "object" && "code" in e
                  ? (e as { code?: string }).code
                  : undefined;
              if (code === "401") return;
              const status =
                e && typeof e === "object" && "status" in e
                  ? (e as { status?: number }).status
                  : undefined;
              if (typeof status === "number" && status >= 500) {
                toast.error(
                  "Beklenmeyen bir hata oluştu. Lütfen daha sonra tekrar deneyin.",
                );
                return;
              }
              toast.error(
                (e as { message?: string } | null)?.message ??
                  "Bir hata oluştu",
              );
            },
          },
        },
      }),
  );

  return (
    <QueryClientProvider client={queryClient}>
      {children}
      <Toaster
        position="top-right"
        richColors
        closeButton
        toastOptions={{
          classNames: {
            toast:
              "group toast group-[.toaster]:bg-card group-[.toaster]:text-card-foreground group-[.toaster]:border-border group-[.toaster]:shadow-lg",
            description: "group-[.toast]:text-muted-foreground",
            actionButton:
              "group-[.toast]:bg-primary group-[.toast]:text-primary-foreground",
            cancelButton:
              "group-[.toast]:bg-muted group-[.toast]:text-muted-foreground",
          },
        }}
      />
    </QueryClientProvider>
  );
}

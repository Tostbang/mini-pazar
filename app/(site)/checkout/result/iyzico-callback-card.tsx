"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle2, Loader2, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { CART_QUERY_KEY } from "@/lib/cart";
import { useIyzicoCallback } from "../_services/queries";
import { Header } from "@/components/header";

type Status = "loading" | "success" | "error";

export function IyzicoCallbackCard({ token }: { token: string | undefined }) {
  const callbackMutation = useIyzicoCallback();
  const { mutate } = callbackMutation;
  const queryClient = useQueryClient();

  useEffect(() => {
    if (!token) return;
    mutate({ body: { token } });
    // We intentionally re-run only when the token changes
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [token]);

  // Once the payment is confirmed successful, the backend has already
  // cleared the cart. Invalidate the cached cart query so every screen
  // (header, cart page, checkout) sees the new empty cart without the user
  // having to refresh the page.
  useEffect(() => {
    if (callbackMutation.isSuccess && callbackMutation.data?.code === "200") {
      queryClient.invalidateQueries({ queryKey: CART_QUERY_KEY });
    }
  }, [
    callbackMutation.isSuccess,
    callbackMutation.data,
    queryClient,
  ]);

  const data = callbackMutation.data;
  const status: Status =
    callbackMutation.isPending || !data
      ? "loading"
      : data.code === "200"
        ? "success"
        : "error";

  const message =
    status === "success"
      ? data?.message || "Ödeme başarıyla tamamlandı!"
      : data?.errors?.[0] || "Ödeme işlemi başarısız oldu.";

  return (
    <main className="flex min-h-screen flex-col bg-background">
      <Header />

      <div className="flex flex-1 items-center justify-center px-4 py-10">
        <div className="w-full max-w-md rounded-3xl border border-border bg-card p-8 text-center shadow-[0_20px_50px_-30px_rgba(0,0,0,0.35)]">
          {status === "loading" && (
            <>
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-muted text-muted-foreground">
                <Loader2 className="size-8 animate-spin text-brand" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-foreground">
                Ödeme doğrulanıyor
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">
                Lütfen bekleyin, ödemeniz kontrol ediliyor…
              </p>
            </>
          )}

          {status === "success" && (
            <>
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-emerald-100 text-emerald-700">
                <CheckCircle2 className="size-9" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-emerald-700">
                Ödeme Başarılı
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
              {data?.orderId ? (
                <p className="mt-1 text-xs text-muted-foreground">
                  Sipariş No: <strong>#{data.orderId}</strong>
                </p>
              ) : null}
            </>
          )}

          {status === "error" && (
            <>
              <div className="mx-auto mb-5 grid size-16 place-items-center rounded-full bg-red-100 text-red-700">
                <XCircle className="size-9" />
              </div>
              <h1 className="font-heading text-2xl font-semibold text-red-700">
                Ödeme Başarısız
              </h1>
              <p className="mt-2 text-sm text-muted-foreground">{message}</p>
            </>
          )}

          {status !== "loading" && (
            <div className="mt-7 space-y-2">
              <Link href="/" className="block">
                <Button className="w-full">Alışverişe devam et</Button>
              </Link>
              {status === "error" && (
                <Link href="/checkout" className="block">
                  <Button variant="outline" className="w-full">
                    Ödemeye geri dön
                  </Button>
                </Link>
              )}
            </div>
          )}
        </div>
      </div>

    </main>
  );
}

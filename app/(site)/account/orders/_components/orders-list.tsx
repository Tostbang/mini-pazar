"use client";

import Image from "next/image";
import Link from "next/link";
import { useMemo, useState } from "react";
import { ChevronRight, Package, RefreshCcw } from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { useGetMyOrders, type OrderListItem } from "@/lib/orders";
import {
  formatOrderDateOnly,
  getOrderStatusBadgeClasses,
} from "@/lib/order-status";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/types/enums";
import { formatCurrency } from "@/lib/format";

const STATUS_FILTERS = [
  { value: "all", label: "Tümü" },
  { value: "active", label: "Aktif" },
  { value: "completed", label: "Tamamlanan" },
  { value: "cancelled", label: "İptal / İade" },
] as const;

type StatusFilter = (typeof STATUS_FILTERS)[number]["value"];

function matchesFilter(order: OrderListItem, filter: StatusFilter) {
  if (filter === "all") return true;
  const state = order.orderState;
  if (filter === "cancelled") return state === 7 || state === 8;
  if (filter === "completed") return state === 5 || state === 6;
  // active = anything still moving (1..4)
  return state >= 1 && state <= 4;
}

function summarizeItems(order: OrderListItem) {
  const items = order.items ?? [];
  const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
  if (items.length === 0) {
    return { preview: "Ürün bulunamadı", totalQty: 0 };
  }
  const first = items[0];
  const preview =
    items.length === 1
      ? first.productName ?? `Ürün #${first.productId}`
      : `${first.productName ?? `Ürün #${first.productId}`} ve ${
          items.length - 1
        } ürün daha`;
  return { preview, totalQty };
}

export function OrdersList() {
  const ordersQuery = useGetMyOrders();
  const orders = ordersQuery.data?.orders ?? [];
  const [filter, setFilter] = useState<StatusFilter>("all");

  const filteredOrders = useMemo(() => {
    return orders
      .filter((order) => matchesFilter(order, filter))
      .slice()
      .sort((a, b) => {
        // Backend returns newest-first but keep a defensive sort in case
        // timestamps arrive out of order.
        return new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime();
      });
  }, [orders, filter]);

  if (ordersQuery.isLoading && orders.length === 0) {
    return <OrdersListSkeleton />;
  }

  if (ordersQuery.isError) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Siparişleriniz yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => ordersQuery.refetch()}
        >
          <RefreshCcw className="size-4" />
          Yeniden dene
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <div className="flex flex-wrap items-center justify-between gap-3">
          <div>
            <h1 className="font-heading text-2xl font-semibold text-brand sm:text-3xl">
              Siparişlerim
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              Geçmiş ve devam eden tüm siparişlerinizi buradan takip edebilirsiniz.
            </p>
          </div>
          <span className="rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground">
            {orders.length} sipariş
          </span>
        </div>

        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => {
            const active = filter === f.value;
            return (
              <button
                key={f.value}
                onClick={() => setFilter(f.value)}
                className={`rounded-full border px-4 py-2 text-sm font-semibold transition-colors ${
                  active
                    ? "border-brand bg-brand text-brand-foreground"
                    : "border-border bg-card text-foreground hover:bg-muted"
                }`}
              >
                {f.label}
              </button>
            );
          })}
        </div>
      </div>

      {filteredOrders.length === 0 ? (
        <div className="rounded-3xl bg-card p-10 text-center shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]">
          <span className="mx-auto grid size-14 place-items-center rounded-full bg-muted text-brand">
            <Package className="size-7" />
          </span>
          <h2 className="mt-4 font-heading text-xl font-semibold text-brand">
            {orders.length === 0
              ? "Henüz siparişiniz yok"
              : "Bu filtreyle eşleşen sipariş yok"}
          </h2>
          <p className="mt-1 text-sm text-muted-foreground">
            {orders.length === 0
              ? "İlk siparişinizi oluşturmak için ürünlere göz atın."
              : "Başka bir filtre seçerek tüm siparişlerinizi görüntüleyebilirsiniz."}
          </p>
          {orders.length === 0 && (
            <Link
              href="/"
              className="mt-5 inline-flex items-center gap-2 rounded-full bg-brand px-5 py-2.5 text-sm font-semibold text-lime transition-colors hover:bg-brand/90"
            >
              Alışverişe başla
              <ChevronRight className="size-4" />
            </Link>
          )}
        </div>
      ) : (
        <ul className="space-y-4">
          {filteredOrders.map((order) => {
            const summary = summarizeItems(order);
            const firstItem = order.items?.[0];
            return (
              <li key={order.orderId}>
                <Link
                  href={`/account/orders/${order.orderId}`}
                  className="group block rounded-3xl bg-card p-5 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] transition-shadow hover:shadow-[0_18px_40px_-20px_rgba(0,0,0,0.35)] sm:p-6"
                >
                  <div className="flex flex-wrap items-start justify-between gap-3">
                    <div className="min-w-0">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Sipariş No
                      </p>
                      <p className="mt-0.5 truncate font-heading text-lg font-semibold text-brand">
                        {order.orderNumber ?? `#${order.orderId}`}
                      </p>
                      <p className="mt-0.5 text-xs text-muted-foreground">
                        {formatOrderDateOnly(order.createdDate)}
                      </p>
                    </div>
                    <div className="flex flex-wrap items-center gap-2">
                      <Badge
                        variant="secondary"
                        className={`border-transparent ${getOrderStatusBadgeClasses(
                          order.orderState,
                        )}`}
                      >
                        {getOrderStatusLabel(order.orderState)}
                      </Badge>
                      <PaymentStatusBadge status={order.paymentStatus} />
                      <Badge variant="outline" className="text-foreground">
                        {getPaymentMethodLabel(order.paymentMethod)}
                      </Badge>
                    </div>
                  </div>

                  <div className="mt-5 flex items-center gap-4">
                    <div className="relative grid size-14 shrink-0 place-items-center rounded-2xl bg-muted">
                      {firstItem?.productImageUrl ? (
                        <Image
                          src={firstItem.productImageUrl}
                          alt={firstItem.productName ?? "Ürün"}
                          width={56}
                          height={56}
                          className="h-full w-full rounded-2xl object-contain p-1"
                        />
                      ) : (
                        <Package className="size-6 text-brand" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-base font-semibold text-brand">
                        {summary.preview}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {summary.totalQty > 0
                          ? `${summary.totalQty} adet ürün`
                          : "Ürün yok"}
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Toplam
                      </p>
                      <p className="mt-0.5 font-heading text-lg font-bold text-price">
                        {formatCurrency(order.totalAmount)}
                      </p>
                    </div>
                    <ChevronRight className="size-5 shrink-0 text-brand transition-transform group-hover:translate-x-1" />
                  </div>
                </Link>
              </li>
            );
          })}
        </ul>
      )}
    </div>
  );
}

function OrdersListSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <Skeleton className="h-8 w-48" />
        <Skeleton className="mt-2 h-4 w-72" />
        <div className="mt-6 flex flex-wrap gap-2">
          {STATUS_FILTERS.map((f) => (
            <Skeleton key={f.value} className="h-9 w-24 rounded-full" />
          ))}
        </div>
      </div>
      {[0, 1, 2].map((i) => (
        <div
          key={i}
          className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)]"
        >
          <div className="flex items-start justify-between">
            <div className="space-y-2">
              <Skeleton className="h-3 w-20" />
              <Skeleton className="h-5 w-40" />
            </div>
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
          <div className="mt-5 flex items-center gap-4">
            <Skeleton className="size-14 rounded-2xl" />
            <div className="flex-1 space-y-2">
              <Skeleton className="h-4 w-2/3" />
              <Skeleton className="h-3 w-1/3" />
            </div>
            <Skeleton className="h-6 w-24" />
          </div>
        </div>
      ))}
    </div>
  );
}
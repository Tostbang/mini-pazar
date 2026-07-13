"use client";

import Image from "next/image";
import Link from "next/link";
import { useState } from "react";
import {
  ArrowLeft,
  CreditCard,
  MapPin,
  Package,
  RefreshCcw,
  StickyNote,
  Truck,
  XCircle,
} from "lucide-react";
import { Skeleton } from "@/components/ui/skeleton";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { PaymentStatusBadge } from "@/components/payment-status-badge";
import { useGetOrderById } from "@/lib/orders";
import {
  formatOrderDate,
  getOrderStatusBadgeClasses,
  isOrderCancellable,
  isOrderPaid,
} from "@/lib/order-status";
import {
  getOrderStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/types/enums";
import { formatCurrency, formatNumber } from "@/lib/format";
import { CancelOrderDialog } from "./cancel-order-dialog";

interface OrderDetailProps {
  orderId: number;
}

export function OrderDetail({ orderId }: OrderDetailProps) {
  const orderQuery = useGetOrderById(orderId);
  const [cancelOpen, setCancelOpen] = useState(false);

  if (orderQuery.isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (orderQuery.isError || !orderQuery.data) {
    return (
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Siparişlerime dön
        </Link>
        <div className="mt-6 rounded-2xl border border-destructive/40 bg-destructive/5 p-6 text-sm text-destructive">
          Sipariş detayı yüklenirken bir sorun oluştu. Lütfen tekrar deneyin.
        </div>
        <Button
          variant="outline"
          className="mt-4"
          onClick={() => orderQuery.refetch()}
        >
          <RefreshCcw className="size-4" />
          Yeniden dene
        </Button>
      </div>
    );
  }

  const order = orderQuery.data.order;
  const items = order.items ?? [];
  const totalQty = items.reduce((sum, it) => sum + it.quantity, 0);
  const cancellable = isOrderCancellable(order.orderState);
  const paid = isOrderPaid(order.paymentStatus);
  const showCancel = cancellable && !paid;

  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <Link
          href="/account/orders"
          className="inline-flex items-center gap-2 text-sm font-semibold text-brand"
        >
          <ArrowLeft className="size-4" />
          Tüm siparişler
        </Link>

        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
              Sipariş No
            </p>
            <h1 className="mt-0.5 font-heading text-2xl font-semibold text-brand sm:text-3xl">
              {order.orderNumber ?? `#${order.orderId}`}
            </h1>
            <p className="mt-1 text-sm text-muted-foreground">
              {formatOrderDate(order.createdDate)}
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
            <Badge variant="outline">
              {getPaymentMethodLabel(order.paymentMethod)}
            </Badge>
          </div>
        </div>

        {showCancel && (
          <div className="mt-6 flex flex-wrap items-center justify-between gap-3 rounded-2xl border border-amber-200 bg-amber-50 p-4 dark:border-amber-900/40 dark:bg-amber-900/10">
            <p className="text-sm text-amber-900 dark:text-amber-200">
              Sipariş henüz hazırlanmaya başlanmadı. İsterseniz iptal edebilirsiniz.
            </p>
            <Button
              variant="destructive"
              size="sm"
              onClick={() => setCancelOpen(true)}
            >
              <XCircle className="size-4" />
              Siparişi iptal et
            </Button>
          </div>
        )}
      </div>

      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
            <div className="flex items-center justify-between">
              <h2 className="font-heading text-xl font-semibold text-brand sm:text-2xl">
                Ürünler
              </h2>
              <span className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                {items.length} kalem · {totalQty} adet
              </span>
            </div>

            {items.length === 0 ? (
              <p className="mt-6 rounded-2xl border border-dashed border-border p-6 text-center text-sm text-muted-foreground">
                Bu siparişte ürün bulunamadı.
              </p>
            ) : (
              <ul className="mt-5 divide-y divide-border/60">
                {items.map((item) => (
                  <li
                    key={item.orderItemId}
                    className="flex items-center gap-4 py-4 first:pt-0 last:pb-0"
                  >
                    <div className="relative grid size-16 shrink-0 place-items-center rounded-2xl bg-muted">
                      {item.productImageUrl ? (
                        <Image
                          src={item.productImageUrl}
                          alt={item.productName ?? "Ürün"}
                          width={64}
                          height={64}
                          className="h-full w-full rounded-2xl object-contain p-1"
                        />
                      ) : (
                        <Package className="size-6 text-brand" />
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate font-heading text-base font-semibold text-brand">
                        {item.productName ?? `Ürün #${item.productId}`}
                      </p>
                      <p className="mt-0.5 text-sm text-muted-foreground">
                        {formatCurrency(item.unitPrice)} · {item.quantity} adet
                      </p>
                    </div>
                    <div className="text-right">
                      <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
                        Ara toplam
                      </p>
                      <p className="mt-0.5 font-heading text-base font-bold text-price">
                        {formatCurrency(item.lineTotal)}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>

          <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-brand sm:text-2xl">
              Teslimat bilgileri
            </h2>

            <div className="mt-5 grid gap-4 sm:grid-cols-2">
              <InfoRow
                icon={<MapPin className="size-5" />}
                label="Teslimat adresi"
                value={
                  order.shippingAddress ? (
                    <span>
                      <span className="block font-semibold text-foreground">
                        {order.shippingFullName ?? "—"}
                      </span>
                      <span className="block text-sm text-muted-foreground">
                        {[
                          order.shippingAddress,
                          order.shippingCity,
                          order.shippingPostalCode,
                          order.shippingCountry,
                        ]
                          .filter(Boolean)
                          .join(", ")}
                      </span>
                      {order.shippingPhone && (
                        <span className="mt-1 block text-sm text-muted-foreground">
                          {order.shippingPhone}
                        </span>
                      )}
                    </span>
                  ) : (
                    <span className="text-muted-foreground">—</span>
                  )
                }
              />
              <InfoRow
                icon={<Truck className="size-5" />}
                label="Kargo ücreti"
                value={formatCurrency(order.shippingFee)}
              />
              <InfoRow
                icon={<CreditCard className="size-5" />}
                label="Ödeme yöntemi"
                value={
                  <span className="flex flex-col gap-1.5">
                    <span className="font-semibold text-foreground">
                      {getPaymentMethodLabel(order.paymentMethod)}
                    </span>
                    <PaymentStatusBadge
                      status={order.paymentStatus}
                      className="self-start"
                    />
                  </span>
                }
              />
              <InfoRow
                icon={<StickyNote className="size-5" />}
                label="Sipariş notu"
                value={
                  order.notes ? (
                    order.notes
                  ) : (
                    <span className="text-muted-foreground">Not eklenmedi</span>
                  )
                }
              />
            </div>
          </div>
        </div>

        <div className="lg:sticky lg:top-24 lg:self-start">
          <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
            <h2 className="font-heading text-xl font-semibold text-brand sm:text-2xl">
              Özet
            </h2>

            <dl className="mt-5 space-y-3 text-sm">
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Ara toplam</dt>
                <dd className="font-semibold text-foreground">
                  {formatNumber(order.subTotal)} ₺
                </dd>
              </div>
              <div className="flex items-center justify-between">
                <dt className="text-muted-foreground">Kargo ücreti</dt>
                <dd className="font-semibold text-foreground">
                  {formatNumber(order.shippingFee)} ₺
                </dd>
              </div>
            </dl>

            <div className="mt-5 flex items-center justify-between border-t border-border pt-5">
              <span className="font-heading text-lg font-semibold text-brand">
                Toplam
              </span>
              <span className="font-heading text-2xl font-bold text-price">
                {formatCurrency(order.totalAmount)}
              </span>
            </div>

            <Button
              variant="outline"
              className="mt-6 w-full"
              onClick={() => orderQuery.refetch()}
            >
              <RefreshCcw className="size-4" />
              Durumu yenile
            </Button>
          </div>
        </div>
      </div>

      <CancelOrderDialog
        open={cancelOpen}
        onOpenChange={setCancelOpen}
        orderId={order.orderId}
        orderNumber={order.orderNumber}
        onCancelled={() => orderQuery.refetch()}
      />
    </div>
  );
}

interface InfoRowProps {
  icon: React.ReactNode;
  label: string;
  value: React.ReactNode;
}

function InfoRow({ icon, label, value }: InfoRowProps) {
  return (
    <div className="flex items-start gap-3 rounded-2xl bg-muted/50 p-4">
      <span className="grid size-10 shrink-0 place-items-center rounded-xl bg-card text-brand">
        {icon}
      </span>
      <div className="min-w-0">
        <p className="text-xs font-semibold uppercase tracking-wide text-muted-foreground">
          {label}
        </p>
        <div className="mt-1 text-sm text-foreground">{value}</div>
      </div>
    </div>
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="space-y-6">
      <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
        <Skeleton className="h-4 w-32" />
        <div className="mt-4 flex flex-wrap items-start justify-between gap-4">
          <div className="space-y-2">
            <Skeleton className="h-3 w-20" />
            <Skeleton className="h-7 w-48" />
            <Skeleton className="h-4 w-40" />
          </div>
          <div className="flex gap-2">
            <Skeleton className="h-6 w-24 rounded-full" />
            <Skeleton className="h-6 w-24 rounded-full" />
          </div>
        </div>
      </div>
      <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
        <div className="space-y-6">
          <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
            <Skeleton className="h-6 w-32" />
            <div className="mt-5 space-y-4">
              {[0, 1, 2].map((i) => (
                <div key={i} className="flex items-center gap-4">
                  <Skeleton className="size-16 rounded-2xl" />
                  <div className="flex-1 space-y-2">
                    <Skeleton className="h-4 w-2/3" />
                    <Skeleton className="h-3 w-1/3" />
                  </div>
                  <Skeleton className="h-5 w-20" />
                </div>
              ))}
            </div>
          </div>
        </div>
        <div className="rounded-3xl bg-card p-6 shadow-[0_10px_30px_-18px_rgba(0,0,0,0.25)] sm:p-8">
          <Skeleton className="h-6 w-24" />
          <div className="mt-5 space-y-3">
            <Skeleton className="h-4 w-full" />
            <Skeleton className="h-4 w-full" />
          </div>
          <Skeleton className="mt-6 h-10 w-full" />
        </div>
      </div>
    </div>
  );
}

// Suppress unused export warning when icon component is only used in JSX tree.
export const _internal = {};
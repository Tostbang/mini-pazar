"use client";

import { useMemo } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import {
  ArrowLeft,
  CalendarClock,
  Loader2,
  MapPin,
  Package,
  RefreshCcw,
  ShoppingBag,
  Truck,
  User,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Separator } from "@/components/ui/separator";
import { Skeleton } from "@/components/ui/skeleton";
import { cn, formatCurrency } from "@/lib/format";
import {
  OrderStatus,
  getOrderStatusLabel,
  getPaymentMethodLabel,
} from "@/lib/types/enums";
import { OrderStatusBadge } from "../_components/order-status-badge";
import { OrderStatusForm } from "./_components/order-status-form";
import { useGetAdminOrderById } from "../_services/queries";
import { PaymentStatusBadge } from "@/components/payment-status-badge";

const dateFormatter = new Intl.DateTimeFormat("tr-TR", {
  day: "2-digit",
  month: "short",
  year: "numeric",
  hour: "2-digit",
  minute: "2-digit",
});

function formatDate(value: string | undefined | null) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return dateFormatter.format(date);
}

export default function OrderDetailPage() {
  const params = useParams<{ orderId: string }>();
  const orderId = Number(params?.orderId);
  const orderQuery = useGetAdminOrderById(orderId, Number.isFinite(orderId));

  const order = orderQuery.data?.order;

  const summary = useMemo(() => {
    if (!order) return { itemCount: 0, itemSummary: "—" };
    const items = order.items ?? [];
    const itemCount = items.reduce(
      (sum, item) => sum + (item.quantity ?? 0),
      0,
    );
    const firstName = items[0]?.productName ?? "Ürün";
    const extra = items.length - 1;
    return {
      itemCount,
      itemSummary:
        items.length === 0
          ? "Ürün yok"
          : extra > 0
            ? `${firstName} +${extra} ürün`
            : firstName,
    };
  }, [order]);

  if (!Number.isFinite(orderId) || orderId <= 0) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dash/orders" />}
          className="self-start"
        >
          <ArrowLeft className="size-4" />
          Siparişlere dön
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Geçersiz sipariş</CardTitle>
            <CardDescription>
              Aradığınız sipariş kimliği geçerli değil.
            </CardDescription>
          </CardHeader>
        </Card>
      </div>
    );
  }

  if (orderQuery.isLoading) {
    return <OrderDetailSkeleton />;
  }

  if (orderQuery.isError || !order) {
    return (
      <div className="mx-auto flex w-full max-w-3xl flex-col gap-4">
        <Button
          variant="ghost"
          size="sm"
          render={<Link href="/dash/orders" />}
          className="self-start"
        >
          <ArrowLeft className="size-4" />
          Siparişlere dön
        </Button>
        <Card>
          <CardHeader>
            <CardTitle>Sipariş bulunamadı</CardTitle>
            <CardDescription>
              Bu sipariş getirilemedi. Daha sonra tekrar deneyin.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <Button
              variant="outline"
              size="sm"
              onClick={() => orderQuery.refetch()}
            >
              <RefreshCcw className="size-4" />
              Tekrar dene
            </Button>
          </CardContent>
        </Card>
      </div>
    );
  }

  const items = order.items ?? [];
  const subtotal = order.subTotal ?? 0;
  const shippingFee = order.shippingFee ?? 0;
  const total = order.totalAmount ?? subtotal + shippingFee;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div className="flex flex-col gap-2">
          <Button
            variant="ghost"
            size="sm"
            render={<Link href="/dash/orders" />}
            className="self-start"
          >
            <ArrowLeft className="size-4" />
            Siparişlere dön
          </Button>
          <div>
            <div className="flex flex-wrap items-center gap-2">
              <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
                Sipariş #{order.orderNumber ?? order.orderId}
              </h1>
              <OrderStatusBadge status={order.orderState} />
              <PaymentStatusBadge status={order.paymentStatus} />
            </div>
            <p className="mt-1 text-sm text-muted-foreground">
              Sipariş detaylarını görüntüleyin ve durumunu güncelleyin.
            </p>
          </div>
        </div>
        <Button
          variant="outline"
          onClick={() => orderQuery.refetch()}
          disabled={orderQuery.isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCcw
            className={cn("size-4", orderQuery.isFetching && "animate-spin")}
          />
          Yenile
        </Button>
      </div>

      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <ShoppingBag className="size-4 text-muted-foreground" />
                Ürünler
              </CardTitle>
              <CardDescription>
                {summary.itemCount} adet · {summary.itemSummary}
              </CardDescription>
            </CardHeader>
            <CardContent className="px-0">
              {items.length === 0 ? (
                <div className="px-6 py-10 text-center text-sm text-muted-foreground">
                  Bu siparişte ürün bulunamadı.
                </div>
              ) : (
                <ul className="divide-y divide-border">
                  {items.map((item) => (
                    <li
                      key={item.orderItemId}
                      className="flex items-start gap-4 px-6 py-4"
                    >
                      <OrderItemThumb
                        src={item.productImageUrl}
                        alt={item.productName ?? "Ürün"}
                      />
                      <div className="flex flex-1 flex-col gap-1">
                        <div className="flex flex-wrap items-start justify-between gap-2">
                          <div className="flex flex-col">
                            <span className="font-medium text-foreground">
                              {item.productName ?? "Ürün"}
                            </span>
                            <span className="text-xs text-muted-foreground">
                              #{item.productId}
                            </span>
                          </div>
                          <span className="text-sm font-semibold tabular-nums">
                            {formatCurrency(item.lineTotal)}
                          </span>
                        </div>
                        <div className="flex flex-wrap items-center justify-between gap-2 text-xs text-muted-foreground">
                          <span>
                            {formatCurrency(item.unitPrice)} × {item.quantity}
                          </span>
                        </div>
                      </div>
                    </li>
                  ))}
                </ul>
              )}
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <User className="size-4 text-muted-foreground" />
                Müşteri & Teslimat
              </CardTitle>
              <CardDescription>
                Siparişi veren kullanıcı ve teslimat bilgileri.
              </CardDescription>
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <InfoRow
                icon={User}
                label="Ad Soyad"
                value={order.shippingFullName}
              />
              <InfoRow
                icon={MapPin}
                label="Telefon"
                value={order.shippingPhone}
              />
              <InfoRow
                icon={MapPin}
                label="Adres"
                value={[
                  order.shippingAddress,
                  order.shippingCity,
                  order.shippingPostalCode,
                  order.shippingCountry,
                ]
                  .filter(Boolean)
                  .join(", ")}
                className="sm:col-span-2"
              />
              {order.notes && (
                <InfoRow
                  icon={Package}
                  label="Sipariş Notu"
                  value={order.notes}
                  className="sm:col-span-2"
                />
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CalendarClock className="size-4 text-muted-foreground" />
                Sipariş Durumunu Güncelle
              </CardTitle>
              <CardDescription>
                Beklemede → Onaylandı → Hazırlanıyor → Kargoda → Teslim
                Edildi. İptal edildiğinde stok otomatik iade edilir.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <OrderStatusForm
                orderId={order.orderId}
                currentStatus={order.orderState as OrderStatus}
              />
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Truck className="size-4 text-muted-foreground" />
                Özet
              </CardTitle>
            </CardHeader>
            <CardContent className="flex flex-col gap-3 text-sm">
              <SummaryRow
                label="Sipariş No"
                value={order.orderNumber ?? `#${order.orderId}`}
              />
              <SummaryRow label="Müşteri ID" value={`#${order.userId}`} />
              <SummaryRow
                label="Ödeme Yöntemi"
                value={getPaymentMethodLabel(order.paymentMethod)}
              />
              <SummaryRow
                label="Ödeme Durumu"
                value={
                  <PaymentStatusBadge
                    status={order.paymentStatus}
                    className="self-start"
                  />
                }
              />
              <SummaryRow
                label="Mevcut Durum"
                value={getOrderStatusLabel(order.orderState)}
              />
              <SummaryRow
                label="Oluşturulma"
                value={formatDate(order.createdDate)}
              />
              <SummaryRow
                label="Ödeme Tarihi"
                value={formatDate(order.paidDate)}
              />
              <Separator className="my-2" />
              <SummaryRow label="Ara Toplam" value={formatCurrency(subtotal)} />
              <SummaryRow
                label="Kargo"
                value={formatCurrency(shippingFee)}
              />
              <SummaryRow
                label="Toplam"
                value={formatCurrency(total)}
                emphasis
              />
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}

function InfoRow({
  icon: Icon,
  label,
  value,
  className,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string | null | undefined;
  className?: string;
}) {
  return (
    <div className={cn("flex items-start gap-3", className)}>
      <div className="grid size-9 shrink-0 place-items-center rounded-lg bg-muted text-muted-foreground">
        <Icon className="size-4" />
      </div>
      <div className="flex flex-col gap-0.5">
        <span className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
          {label}
        </span>
        <span className="text-sm font-medium text-foreground">
          {value?.trim() ? value : "—"}
        </span>
      </div>
    </div>
  );
}

function SummaryRow({
  label,
  value,
  emphasis,
}: {
  label: string;
  // Accept ReactNode so summary rows can host rich content (badges, etc.)
  // alongside plain strings. Most callers still pass a string.
  value: React.ReactNode;
  emphasis?: boolean;
}) {
  return (
    <div className="flex items-center justify-between gap-3">
      <span
        className={cn(
          "text-muted-foreground",
          emphasis && "text-sm font-semibold text-foreground",
        )}
      >
        {label}
      </span>
      <span
        className={cn(
          "text-right tabular-nums",
          emphasis
            ? "text-base font-semibold text-foreground"
            : "text-foreground",
        )}
      >
        {value}
      </span>
    </div>
  );
}

function OrderItemThumb({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid size-14 shrink-0 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
        <Package className="size-5" />
      </div>
    );
  }
  return (
    // eslint-disable-next-line @next/next/no-img-element
    <img
      src={src}
      alt={alt}
      className="size-14 shrink-0 rounded-lg border border-border object-cover"
    />
  );
}

function OrderDetailSkeleton() {
  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex items-center gap-3">
        <Skeleton className="size-8 rounded-md" />
        <Skeleton className="h-7 w-48" />
      </div>
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-[1fr_320px]">
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-24" />
              <Skeleton className="h-3 w-40" />
            </CardHeader>
            <CardContent className="flex flex-col gap-4">
              {Array.from({ length: 3 }).map((_, index) => (
                <div key={index} className="flex items-start gap-4">
                  <Skeleton className="size-14 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3.5 w-40" />
                    <Skeleton className="h-3 w-20" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-32" />
            </CardHeader>
            <CardContent className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              {Array.from({ length: 4 }).map((_, index) => (
                <div key={index} className="flex items-start gap-3">
                  <Skeleton className="size-9 rounded-lg" />
                  <div className="flex flex-1 flex-col gap-2">
                    <Skeleton className="h-3 w-20" />
                    <Skeleton className="h-3.5 w-32" />
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
        <div className="flex flex-col gap-6">
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-40" />
              <Skeleton className="h-3 w-56" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              <Skeleton className="h-9 w-full" />
              <Skeleton className="h-20 w-full" />
              <Skeleton className="ml-auto h-9 w-32" />
            </CardContent>
          </Card>
          <Card>
            <CardHeader>
              <Skeleton className="h-5 w-20" />
            </CardHeader>
            <CardContent className="flex flex-col gap-3">
              {Array.from({ length: 6 }).map((_, index) => (
                <div key={index} className="flex justify-between">
                  <Skeleton className="h-3 w-24" />
                  <Skeleton className="h-3 w-16" />
                </div>
              ))}
            </CardContent>
          </Card>
        </div>
      </div>
      <div className="flex items-center justify-center gap-2 text-xs text-muted-foreground">
        <Loader2 className="size-3.5 animate-spin" />
        Sipariş yükleniyor...
      </div>
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Link from "next/link";
import { ChevronRight, RefreshCcw, Search, ShoppingCart } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Pagination,
  PaginationInfo,
  PaginationNext,
  PaginationPrevious,
} from "@/components/ui/pagination";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/format";
import {
  OrderStatus,
  ORDER_STATUS_LABELS,
  ORDER_STATUS_OPTIONS,
  getPaymentMethodLabel,
  getPaymentStatusLabel,
} from "@/lib/types/enums";
import { OrderStatusBadge } from "./_components/order-status-badge";
import {
  useGetAdminOrders,
  type OrderListItem,
} from "./_services/queries";

const ALL_FILTER = "all" as const;
type StatusFilter = OrderStatus | typeof ALL_FILTER;

const PAGE_SIZE = 10;

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

export default function OrdersPage() {
  const [statusFilter, setStatusFilter] = useState<StatusFilter>(ALL_FILTER);
  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);

  // AdminGetAllOrders her zaman bir orderState değeri istiyor. "Tümü"
  // seçildiğinde her OrderStatus için ayrı istek atılır, sonuçlar
  // ID bazında birleştirilip tarihe göre sıralanır.
  const statusQueries: Record<OrderStatus, ReturnType<typeof useGetAdminOrders>> = {
    [OrderStatus.Pending]: useGetAdminOrders(OrderStatus.Pending),
    [OrderStatus.AwaitingApproval]: useGetAdminOrders(OrderStatus.AwaitingApproval),
    [OrderStatus.Confirmed]: useGetAdminOrders(OrderStatus.Confirmed),
    [OrderStatus.Preparing]: useGetAdminOrders(OrderStatus.Preparing),
    [OrderStatus.Shipped]: useGetAdminOrders(OrderStatus.Shipped),
    [OrderStatus.Delivered]: useGetAdminOrders(OrderStatus.Delivered),
    [OrderStatus.Cancelled]: useGetAdminOrders(OrderStatus.Cancelled),
    [OrderStatus.Refunded]: useGetAdminOrders(OrderStatus.Refunded),
  };

  const isAll = statusFilter === ALL_FILTER;
  const activeQuery = isAll ? null : statusQueries[statusFilter];

  const queryList = Object.values(statusQueries);
  const isLoading = isAll
    ? queryList.some((q) => q.isLoading)
    : Boolean(activeQuery?.isLoading);
  const isFetching = isAll
    ? queryList.some((q) => q.isFetching)
    : Boolean(activeQuery?.isFetching);

  const orders = useMemo<OrderListItem[]>(() => {
    if (!isAll) return activeQuery?.data?.orders ?? [];
    const seen = new Map<number, OrderListItem>();
    for (const q of queryList) {
      for (const order of q.data?.orders ?? []) {
        if (!seen.has(order.orderId)) seen.set(order.orderId, order);
      }
    }
    return Array.from(seen.values()).sort(
      (a, b) =>
        new Date(b.createdDate).getTime() - new Date(a.createdDate).getTime(),
    );
  }, [isAll, activeQuery?.data?.orders, queryList]);

  const filteredOrders = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return orders;
    return orders.filter((order) => {
      return (
        (order.orderNumber ?? "").toLowerCase().includes(query) ||
        String(order.userId).includes(query) ||
        (order.shippingFullName ?? "").toLowerCase().includes(query) ||
        (order.shippingPhone ?? "").toLowerCase().includes(query)
      );
    });
  }, [orders, search]);

  const totalItems = filteredOrders.length;
  const totalPages = Math.max(1, Math.ceil(totalItems / PAGE_SIZE));
  const safePage = Math.min(Math.max(1, page), totalPages);
  const pagedOrders = filteredOrders.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const onFilterChange = (value: string | null) => {
    if (value == null) return;
    setStatusFilter(
      value === ALL_FILTER ? ALL_FILTER : (Number(value) as OrderStatus),
    );
    setPage(1);
  };

  const onSearchChange = (value: string) => {
    setSearch(value);
    setPage(1);
  };

  const onRefresh = () => {
    if (isAll) {
      queryList.forEach((q) => q.refetch());
      return;
    }
    activeQuery?.refetch();
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Siparişler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Tüm siparişleri görüntüleyin, durumlarına göre filtreleyin ve
            detaylarına göz atın.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={onRefresh}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCcw className={cn("size-4", isFetching && "animate-spin")} />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Sipariş Listesi</CardTitle>
            <CardDescription>
              {isLoading ? "Siparişler yükleniyor..." : "Duruma göre filtreleyin"}
            </CardDescription>
          </div>
          <div className="flex w-full flex-col gap-2 sm:w-auto sm:flex-row">
            <Select
              value={String(statusFilter)}
              onValueChange={onFilterChange}
            >
              <SelectTrigger className="h-9 w-full sm:w-56">
                <SelectValue placeholder="Duruma göre filtrele">
                  {isAll ? "Tüm Durumlar" : ORDER_STATUS_LABELS[statusFilter]}
                </SelectValue>
              </SelectTrigger>
              <SelectContent>
                <SelectItem value={ALL_FILTER}>Tüm Durumlar</SelectItem>
                {ORDER_STATUS_OPTIONS.map((option) => (
                  <SelectItem key={option.value} value={String(option.value)}>
                    {option.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
            <div className="relative w-full sm:w-72">
              <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
              <Input
                type="search"
                value={search}
                onChange={(event) => onSearchChange(event.target.value)}
                placeholder="Sipariş no, müşteri veya telefon ile ara..."
                className="pl-9"
              />
            </div>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <OrdersTableSkeleton />
          ) : filteredOrders.length === 0 ? (
            <EmptyState
              isFiltering={
                search.trim().length > 0 || statusFilter !== ALL_FILTER
              }
              onRefresh={onRefresh}
            />
          ) : (
            <OrdersTable orders={pagedOrders} />
          )}
        </CardContent>
        {totalItems > 0 && (
          <div className="flex flex-col gap-3 border-t border-border px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-6">
            <PaginationInfo
              page={safePage}
              totalPages={totalPages}
              totalItems={totalItems}
              pageSize={PAGE_SIZE}
            />
            <div className="flex items-center gap-2">
              <PaginationPrevious
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <Pagination
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
              <PaginationNext
                page={safePage}
                totalPages={totalPages}
                onPageChange={setPage}
              />
            </div>
          </div>
        )}
      </Card>
    </div>
  );
}

function OrdersTable({ orders }: { orders: OrderListItem[] }) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sipariş No</TableHead>
          <TableHead>Müşteri</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Ödeme Yöntemi</TableHead>
          <TableHead>Ödeme Durumu</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">Detay</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {orders.map((order) => (
          <TableRow key={order.orderId}>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {order.orderNumber ?? `#${order.orderId}`}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{order.orderId}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {order.shippingFullName ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {order.shippingPhone ?? "—"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(order.createdDate)}
            </TableCell>
            <TableCell className="text-sm">
              {getPaymentMethodLabel(order.paymentMethod)}
            </TableCell>
            <TableCell className="text-sm">
              {getPaymentStatusLabel(order.paymentStatus)}
            </TableCell>
            <TableCell>
              <OrderStatusBadge status={order.orderState} />
            </TableCell>
            <TableCell className="text-right">
              <Link
                href={`/dash/orders/${order.orderId}`}
                className="inline-flex items-center gap-1 text-sm font-medium text-foreground transition-colors hover:text-primary"
              >
                Detaylar
                <ChevronRight className="size-4" />
              </Link>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function EmptyState({
  isFiltering,
  onRefresh,
}: {
  isFiltering: boolean;
  onRefresh: () => void;
}) {
  if (isFiltering) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Search className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Eşleşen sipariş bulunamadı
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Arama filtresini veya durum seçimini değiştirerek tekrar deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <ShoppingCart className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Henüz sipariş yok
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Yeni siparişler geldiğinde burada listelenecek.
        </p>
      </div>
      <Button onClick={onRefresh} variant="outline" size="sm">
        <RefreshCcw className="size-4" />
        Yenile
      </Button>
    </div>
  );
}

function OrdersTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead>Sipariş No</TableHead>
          <TableHead>Müşteri</TableHead>
          <TableHead>Tarih</TableHead>
          <TableHead>Ödeme Yöntemi</TableHead>
          <TableHead>Ödeme Durumu</TableHead>
          <TableHead>Durum</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">Detay</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-12" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-32" />
                <Skeleton className="h-3 w-24" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-28" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-20" />
            </TableCell>
            <TableCell>
              <Skeleton className="h-5 w-24 rounded-full" />
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto size-7 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

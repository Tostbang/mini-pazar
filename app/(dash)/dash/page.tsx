"use client";

import Link from "next/link";
import {
  ArrowUpRight,
  ChevronRight,
  CircleDollarSign,
  CircleUserRound,
  Eye,
  ListOrdered,
  Package,
  ShoppingCart,
  TrendingUp,
  Users,
  UserCheck,
  UserPlus,
  type LucideIcon,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useQueryOP } from "@/lib/fetch";
import { formatCurrency, formatNumber } from "@/lib/format";
import type { paths } from "@/lib/types/api";

// ---------------------------------------------------------------------------
// Types pulled from the generated OpenAPI client. The Statistics endpoints are
// the single source of truth for every value rendered on this page.
// ---------------------------------------------------------------------------

type OverviewResponse =
  paths["/api/Statistics/overview"]["get"]["responses"]["200"]["content"]["application/json"];
type VisitorStatsResponse =
  paths["/api/Statistics/visitors"]["get"]["responses"]["200"]["content"]["application/json"];
type RegistrationStatsResponse =
  paths["/api/Statistics/registrations"]["get"]["responses"]["200"]["content"]["application/json"];
type OrderStatsResponse =
  paths["/api/Statistics/orders"]["get"]["responses"]["200"]["content"]["application/json"];
type TopProductsResponse =
  paths["/api/Statistics/top-products"]["get"]["responses"]["200"]["content"]["application/json"];
type TopCategoriesResponse =
  paths["/api/Statistics/top-categories"]["get"]["responses"]["200"]["content"]["application/json"];

export type TopProductItem = NonNullable<TopProductsResponse["products"]>[number];
export type TopCategoryItem = NonNullable<TopCategoriesResponse["categories"]>[number];

type StatsPeriod = NonNullable<
  paths["/api/Statistics/visitors"]["get"]["parameters"]["query"]
>["period"];

const STATS_PERIOD: StatsPeriod = 3;

export default function DashOverviewPage() {
  const overviewQuery = useQueryOP("get", "/api/Statistics/overview", {});
  const visitorsQuery = useQueryOP("get", "/api/Statistics/visitors", {
    params: { query: { period: STATS_PERIOD } },
  });
  const registrationsQuery = useQueryOP("get", "/api/Statistics/registrations", {
    params: { query: { period: STATS_PERIOD } },
  });
  const ordersQuery = useQueryOP("get", "/api/Statistics/orders", {
    params: { query: { period: STATS_PERIOD } },
  });
  const topProductsQuery = useQueryOP("get", "/api/Statistics/top-products", {
    params: { query: { limit: 5 } },
  });
  const topCategoriesQuery = useQueryOP("get", "/api/Statistics/top-categories", {
    params: { query: { limit: 5 } },
  });

  const overview = overviewQuery.data;
  const visitors = visitorsQuery.data;
  const registrations = registrationsQuery.data;
  const orders = ordersQuery.data;
  const topProducts = topProductsQuery.data?.products ?? [];
  const topCategories = topCategoriesQuery.data?.categories ?? [];

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Hoş geldiniz 👋
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Mağazanızın genel durumunu buradan takip edebilirsiniz.
        </p>
      </div>

      <OverviewGrid
        overview={overview}
        isLoading={overviewQuery.isLoading}
      />

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
        <VisitorsCard
          visitors={visitors}
          isLoading={visitorsQuery.isLoading}
        />
        <RegistrationsCard
          registrations={registrations}
          isLoading={registrationsQuery.isLoading}
        />
        <OrderStatsCard orders={orders} isLoading={ordersQuery.isLoading} />
      </div>

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-2">
        <TopProductsCard
          items={topProducts}
          isLoading={topProductsQuery.isLoading}
        />
        <TopCategoriesCard
          items={topCategories}
          isLoading={topCategoriesQuery.isLoading}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Hızlı Bağlantılar</CardTitle>
          <CardDescription>
            Mağazanızı yönetmek için sık kullanılan sayfalar
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ul className="grid grid-cols-1 gap-2 sm:grid-cols-2">
            <QuickLink
              href="/dash/profile"
              title="Profil Ayarları"
              description="Hesap bilgilerinizi güncelleyin"
            />
            <QuickLink
              href="/dash/products"
              title="Ürün Yönetimi"
              description="Ürün ekleyin, düzenleyin, silin"
            />
            <QuickLink
              href="/dash/orders"
              title="Sipariş Takibi"
              description="Yeni ve geçmiş siparişler"
            />
            <QuickLink
              href="/dash/store"
              title="Mağaza Ayarları"
              description="Mağaza görünümünü özelleştirin"
            />
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

// ---------------------------------------------------------------------------
// Overview grid — every value comes from GET /api/Statistics/overview
// ---------------------------------------------------------------------------

type OverviewMetric = {
  title: string;
  value: number | null | undefined;
  icon: LucideIcon;
  isCurrency?: boolean;
};

function OverviewGrid({
  overview,
  isLoading,
}: {
  overview: OverviewResponse | undefined;
  isLoading: boolean;
}) {
  const metrics: OverviewMetric[] = [
    {
      title: "Toplam Tekil Ziyaretçi",
      value: overview?.totalUniqueVisitors,
      icon: Users,
    },
    {
      title: "Bugünkü Ziyaret",
      value: overview?.todayVisits,
      icon: Eye,
    },
    {
      title: "Toplam Üye",
      value: overview?.totalUsers,
      icon: CircleUserRound,
    },
    {
      title: "Son 30 Gün Yeni Üye",
      value: overview?.newUsersLast30Days,
      icon: UserPlus,
    },
    {
      title: "Toplam Sipariş",
      value: overview?.totalOrders,
      icon: ShoppingCart,
    },
    {
      title: "Bekleyen Sipariş",
      value: overview?.pendingOrders,
      icon: ListOrdered,
    },
    {
      title: "Toplam Gelir",
      value: overview?.totalRevenue,
      icon: TrendingUp,
      isCurrency: true,
    },
    {
      title: "Son 30 Gün Gelir",
      value: overview?.revenueLast30Days,
      icon: CircleDollarSign,
      isCurrency: true,
    },
  ];

  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
      {metrics.map((metric) => (
        <Card key={metric.title} size="sm">
          <CardHeader className="flex-row items-center justify-between gap-2">
            <div className="flex flex-col gap-1">
              <CardDescription className="text-xs font-medium uppercase tracking-wide">
                {metric.title}
              </CardDescription>
              {isLoading ? (
                <Skeleton className="h-7 w-24" />
              ) : (
                <CardTitle className="text-2xl font-semibold">
                  {metric.isCurrency
                    ? formatCurrency(metric.value)
                    : formatNumber(metric.value)}
                </CardTitle>
              )}
            </div>
            <div className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
              <metric.icon className="size-5" />
            </div>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

// ---------------------------------------------------------------------------
// Visitors detail — GET /api/Statistics/visitors
// ---------------------------------------------------------------------------

function VisitorsCard({
  visitors,
  isLoading,
}: {
  visitors: VisitorStatsResponse | undefined;
  isLoading: boolean;
}) {
  const topPaths = visitors?.topPaths ?? [];

  return (
    <Card>
      <CardHeader>
        <CardTitle>Ziyaretçi Detayı</CardTitle>
        <CardDescription>
          {visitors
            ? `${formatNumber(visitors.totalVisits)} toplam ziyaret`
            : "Yükleniyor..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-col gap-4">
        <div className="grid grid-cols-2 gap-3">
          <StatRow
            label="Toplam Ziyaret"
            value={formatNumber(visitors?.totalVisits)}
            loading={isLoading}
            icon={Eye}
          />
          <StatRow
            label="Tekil Ziyaretçi"
            value={formatNumber(visitors?.uniqueVisitors)}
            loading={isLoading}
            icon={Users}
          />
          <StatRow
            label="Üye Ziyaret"
            value={formatNumber(visitors?.authenticatedVisits)}
            loading={isLoading}
            icon={UserCheck}
          />
          <StatRow
            label="Anonim Ziyaret"
            value={formatNumber(visitors?.anonymousVisits)}
            loading={isLoading}
            icon={UserPlus}
          />
        </div>

        <div className="flex flex-col gap-2">
          <p className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            En Çok Ziyaret Edilen Sayfalar
          </p>
          {isLoading ? (
            <div className="flex flex-col gap-2">
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
              <Skeleton className="h-8 w-full" />
            </div>
          ) : topPaths.length === 0 ? (
            <p className="rounded-lg border border-dashed border-border p-3 text-xs text-muted-foreground">
              Henüz sayfa ziyaret verisi yok.
            </p>
          ) : (
            <ul className="flex flex-col gap-1.5">
              {topPaths.slice(0, 5).map((path) => (
                <li
                  key={path.path}
                  className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2"
                >
                  <span className="truncate font-mono text-xs text-foreground">
                    {path.path}
                  </span>
                  <span className="text-xs font-medium text-muted-foreground">
                    {formatNumber(path.count)}
                  </span>
                </li>
              ))}
            </ul>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Registration stats — GET /api/Statistics/registrations
// ---------------------------------------------------------------------------

function RegistrationsCard({
  registrations,
  isLoading,
}: {
  registrations: RegistrationStatsResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Kayıt İstatistikleri</CardTitle>
        <CardDescription>
          {registrations
            ? `${formatNumber(registrations.totalRegistrations)} toplam kayıt`
            : "Yükleniyor..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-1 gap-3">
        <StatRow
          label="Toplam Kayıt"
          value={formatNumber(registrations?.totalRegistrations)}
          loading={isLoading}
          icon={UserPlus}
        />
        <StatRow
          label="Email Onaylı"
          value={formatNumber(registrations?.emailConfirmedCount)}
          loading={isLoading}
          icon={UserCheck}
        />
        <StatRow
          label="Email Onaysız"
          value={formatNumber(registrations?.emailPendingCount)}
          loading={isLoading}
          icon={CircleUserRound}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Order stats — GET /api/Statistics/orders
// ---------------------------------------------------------------------------

function OrderStatsCard({
  orders,
  isLoading,
}: {
  orders: OrderStatsResponse | undefined;
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>Sipariş İstatistikleri</CardTitle>
        <CardDescription>
          {orders
            ? `${formatNumber(orders.totalOrders)} toplam sipariş`
            : "Yükleniyor..."}
        </CardDescription>
      </CardHeader>
      <CardContent className="grid grid-cols-2 gap-3">
        <StatRow
          label="Toplam Sipariş"
          value={formatNumber(orders?.totalOrders)}
          loading={isLoading}
          icon={ShoppingCart}
        />
        <StatRow
          label="İptal Edilen"
          value={formatNumber(orders?.cancelledOrders)}
          loading={isLoading}
          icon={ListOrdered}
        />
        <StatRow
          label="Toplam Gelir"
          value={formatCurrency(orders?.totalRevenue)}
          loading={isLoading}
          icon={TrendingUp}
        />
        <StatRow
          label="Ortalama Sepet"
          value={formatCurrency(orders?.averageOrderValue)}
          loading={isLoading}
          icon={CircleDollarSign}
        />
        <StatRow
          label="Kapıda Ödeme"
          value={formatNumber(orders?.cashOnDeliveryOrders)}
          loading={isLoading}
          icon={Package}
        />
        <StatRow
          label="Online Ödeme"
          value={formatNumber(orders?.onlinePaymentOrders)}
          loading={isLoading}
          icon={CircleDollarSign}
        />
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Top products — GET /api/Statistics/top-products
// ---------------------------------------------------------------------------

function TopProductsCard({
  items,
  isLoading,
}: {
  items: TopProductItem[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>En Çok Satılan Ürünler</CardTitle>
        <CardDescription>Adet ve ciroya göre ilk 5</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Henüz satış verisi yok.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li
                key={item.productId}
                className="flex items-center gap-3 py-2.5 first:pt-0 last:pb-0"
              >
                <div className="grid size-9 shrink-0 place-items-center overflow-hidden rounded-md bg-muted text-muted-foreground">
                  {item.imageUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={item.imageUrl}
                      alt={item.productName ?? ""}
                      className="size-full object-cover"
                    />
                  ) : (
                    <Package className="size-4" />
                  )}
                </div>
                <div className="flex min-w-0 flex-1 flex-col">
                  <span className="truncate text-sm font-medium text-foreground">
                    {item.productName}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    {formatNumber(item.totalQuantitySold)} adet ·{" "}
                    {formatNumber(item.orderCount)} sipariş
                  </span>
                </div>
                <span className="shrink-0 text-sm font-semibold text-foreground">
                  {formatCurrency(item.totalRevenue)}
                </span>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Top categories — GET /api/Statistics/top-categories
// ---------------------------------------------------------------------------

function TopCategoriesCard({
  items,
  isLoading,
}: {
  items: TopCategoryItem[];
  isLoading: boolean;
}) {
  return (
    <Card>
      <CardHeader>
        <CardTitle>En Çok Satılan Kategoriler</CardTitle>
        <CardDescription>Adet ve ciroya göre ilk 5</CardDescription>
      </CardHeader>
      <CardContent>
        {isLoading ? (
          <div className="flex flex-col gap-2">
            {Array.from({ length: 5 }).map((_, index) => (
              <Skeleton key={index} className="h-10 w-full" />
            ))}
          </div>
        ) : items.length === 0 ? (
          <p className="rounded-lg border border-dashed border-border p-4 text-center text-xs text-muted-foreground">
            Henüz kategori satış verisi yok.
          </p>
        ) : (
          <ul className="flex flex-col divide-y divide-border">
            {items.map((item) => (
              <li key={item.categoryId} className="first:pt-0 last:pb-0">
                <Link
                  href={`/dash/categories/${item.categoryId}`}
                  className="group flex items-center gap-3 py-2.5 transition-colors hover:text-foreground"
                >
                  <div className="flex min-w-0 flex-1 flex-col">
                    <span className="truncate text-sm font-medium text-foreground">
                      {item.categoryName}
                    </span>
                    <span className="text-xs text-muted-foreground">
                      {formatNumber(item.totalQuantitySold)} adet satıldı
                    </span>
                  </div>
                  <span className="shrink-0 text-sm font-semibold text-foreground">
                    {formatCurrency(item.totalRevenue)}
                  </span>
                  <ChevronRight className="size-4 shrink-0 text-muted-foreground transition-transform group-hover:translate-x-0.5 group-hover:text-foreground" />
                </Link>
              </li>
            ))}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}

// ---------------------------------------------------------------------------
// Small helpers (local to this page)
// ---------------------------------------------------------------------------

function StatRow({
  label,
  value,
  loading,
  icon: Icon,
}: {
  label: string;
  value: string;
  loading: boolean;
  icon: LucideIcon;
}) {
  return (
    <div className="flex items-center justify-between gap-3 rounded-lg border border-border bg-card/40 px-3 py-2">
      <div className="flex items-center gap-2 text-xs text-muted-foreground">
        <Icon className="size-3.5" />
        <span>{label}</span>
      </div>
      {loading ? (
        <Skeleton className="h-4 w-16" />
      ) : (
        <span className="text-sm font-semibold text-foreground">{value}</span>
      )}
    </div>
  );
}

function QuickLink({
  href,
  title,
  description,
}: {
  href: string;
  title: string;
  description: string;
}) {
  return (
    <li>
      <Link
        href={href}
        className="group flex items-center justify-between gap-3 rounded-lg border border-border bg-card/50 p-4 transition-all hover:border-primary/30 hover:bg-card hover:shadow-sm"
      >
        <div>
          <p className="text-sm font-semibold text-foreground">{title}</p>
          <p className="text-xs text-muted-foreground">{description}</p>
        </div>
        <ArrowUpRight className="size-4 text-muted-foreground transition-transform group-hover:-translate-y-0.5 group-hover:translate-x-0.5 group-hover:text-foreground" />
      </Link>
    </li>
  );
}

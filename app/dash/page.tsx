import Link from "next/link";
import {
  Package,
  ShoppingCart,
  Users,
  TrendingUp,
  ArrowUpRight,
} from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";

const stats = [
  {
    title: "Toplam Ürün",
    value: "—",
    description: "Aktif ürün sayısı",
    icon: Package,
  },
  {
    title: "Siparişler",
    value: "—",
    description: "Bu ay",
    icon: ShoppingCart,
  },
  {
    title: "Müşteriler",
    value: "—",
    description: "Kayıtlı müşteri",
    icon: Users,
  },
  {
    title: "Gelir",
    value: "—",
    description: "Bu ay",
    icon: TrendingUp,
  },
];

export default function DashOverviewPage() {
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

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.title} size="sm">
              <CardHeader className="flex-row items-center justify-between gap-2">
                <div className="flex flex-col gap-1">
                  <CardDescription className="text-xs font-medium uppercase tracking-wide">
                    {stat.title}
                  </CardDescription>
                  <CardTitle className="text-2xl font-semibold">
                    {stat.value}
                  </CardTitle>
                </div>
                <div className="grid size-10 place-items-center rounded-lg bg-muted text-muted-foreground">
                  <Icon className="size-5" />
                </div>
              </CardHeader>
              <CardContent>
                <p className="text-xs text-muted-foreground">
                  {stat.description}
                </p>
              </CardContent>
            </Card>
          );
        })}
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

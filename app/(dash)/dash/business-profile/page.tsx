"use client";

import { useState } from "react";
import { PencilLine, Store } from "lucide-react";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Skeleton } from "@/components/ui/skeleton";
import { BusinessProfileFormModal } from "./_components/business-profile-form-modal";
import {
  useGetBusinessProfile,
  type BusinessProfile,
} from "./_services/queries";

export default function BusinessProfilePage() {
  const [editOpen, setEditOpen] = useState(false);
  const profileQuery = useGetBusinessProfile();
  const profile = profileQuery.data?.profile as BusinessProfile | null | undefined;

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mağaza Profili
        </h1>
        <p className="text-sm text-muted-foreground">
          Mağazanızın vitrine görünen adını, iletişim ve adres bilgilerini
          buradan yönetin.
        </p>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Mağaza bilgileri</CardTitle>
            <CardDescription>
              Müşterilerinize gösterilen temel mağaza bilgileri.
            </CardDescription>
          </div>
          <Button
            onClick={() => setEditOpen(true)}
            disabled={profileQuery.isLoading}
            className="self-start sm:self-auto"
          >
            <PencilLine className="size-4" />
            Düzenle
          </Button>
        </CardHeader>
        <CardContent>
          {profileQuery.isLoading ? (
            <ProfileSkeleton />
          ) : profile ? (
            <ProfileReadonlyView profile={profile} />
          ) : (
            <EmptyState />
          )}
        </CardContent>
      </Card>

      <BusinessProfileFormModal
        open={editOpen}
        onOpenChange={setEditOpen}
        profile={profile ?? null}
      />
    </div>
  );
}

function ProfileReadonlyView({ profile }: { profile: BusinessProfile }) {
  const rows: Array<{ label: string; value: string }> = [
    { label: "Mağaza adı", value: profile.shopName?.trim() ?? "" },
    { label: "Sektör", value: profile.businessType?.trim() ?? "" },
    { label: "Telefon", value: profile.phone?.trim() ?? "" },
    { label: "Adres", value: profile.address?.trim() ?? "" },
    {
      label: "Açıklama",
      value: profile.description?.trim() ?? "",
    },
    {
      label: "Durum",
      value: profile.isOpen ? "Açık" : "Kapalı",
    },
  ];

  return (
    <dl className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {rows.map((row) => (
        <div
          key={row.label}
          className="rounded-2xl border border-border bg-card/40 p-4"
        >
          <dt className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
            {row.label}
          </dt>
          <dd className="mt-1.5 text-sm font-medium text-foreground">
            {row.value || "—"}
          </dd>
        </div>
      ))}
    </dl>
  );
}

function ProfileSkeleton() {
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
      {Array.from({ length: 6 }).map((_, index) => (
        <div
          key={index}
          className="flex flex-col gap-2 rounded-2xl border border-border bg-card/40 p-4"
        >
          <Skeleton className="h-3 w-20" />
          <Skeleton className="h-4 w-32" />
        </div>
      ))}
    </div>
  );
}

function EmptyState() {
  return (
    <div className="flex flex-col items-center gap-3 rounded-2xl border border-dashed border-border bg-card/40 px-4 py-12 text-center">
      <span className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
        <Store className="size-5" />
      </span>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Mağaza profili henüz oluşturulmamış
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Yönetim panelini kullanabilmek için önce mağaza bilgilerinizi
          tamamlamanız gerekiyor. &quot;Düzenle&quot; butonuna basarak
          başlayabilirsiniz.
        </p>
      </div>
    </div>
  );
}
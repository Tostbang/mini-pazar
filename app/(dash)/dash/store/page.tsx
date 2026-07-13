"use client";

import { AlertCircle, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { SettingsForm } from "./_components/settings-form";
import { useGetSiteSettings } from "./_services/queries";

export default function StorePage() {
  const { data, isLoading, isError, refetch, isFetching } = useGetSiteSettings();

  return (
    <div className="mx-auto flex w-full max-w-5xl flex-col gap-6">
      <div className="flex flex-col gap-1">
        <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
          Mağaza Ayarları
        </h1>
        <p className="text-sm text-muted-foreground">
          Mağazanızın görünümünü, ödeme yöntemlerini ve ana sayfa düzenini
          buradan yönetin.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Mağaza Yapılandırması</CardTitle>
          <CardDescription>
            Yaptığınız değişiklikler yalnızca &quot;Değişiklikleri Kaydet&quot;
            butonuna bastıktan sonra yayına alınır.
          </CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <SettingsSkeleton />
          ) : isError || !data?.settings ? (
            <ErrorState onRetry={() => refetch()} retrying={isFetching} />
          ) : (
            <SettingsForm settings={data.settings} />
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SettingsSkeleton() {
  return (
    <div className="flex flex-col gap-6">
      <div className="flex gap-2">
        {Array.from({ length: 4 }).map((_, index) => (
          <Skeleton key={index} className="h-9 w-24 rounded-full" />
        ))}
      </div>
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
        {Array.from({ length: 6 }).map((_, index) => (
          <div key={index} className="flex flex-col gap-2">
            <Skeleton className="h-3.5 w-24" />
            <Skeleton className="h-9 w-full rounded-3xl" />
          </div>
        ))}
      </div>
    </div>
  );
}

function ErrorState({
  onRetry,
  retrying,
}: {
  onRetry: () => void;
  retrying: boolean;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="grid size-12 place-items-center rounded-full bg-destructive/10 text-destructive">
        <AlertCircle className="size-5" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          Ayarlar yüklenemedi
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Bağlantınızı kontrol edip tekrar deneyin.
        </p>
      </div>
      <Button onClick={onRetry} size="sm" disabled={retrying}>
        {retrying ? <Loader2 className="size-4 animate-spin" /> : null}
        {retrying ? "Tekrar deneniyor..." : "Tekrar Dene"}
      </Button>
    </div>
  );
}
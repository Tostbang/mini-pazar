"use client";

import { useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  ImageOff,
  PencilLine,
  Plus,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { AboutFormModal } from "./_components/about-form-modal";
import {
  useGetAbout,
  type AboutModel,
} from "./_services/queries";

function stripMdx(input: string | null | undefined): string {
  if (!input) return "";
  return input
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#*_>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AboutPage() {
  const { data, isLoading, isFetching } = useGetAbout();

  const [formOpen, setFormOpen] = useState(false);
  // The endpoint returns a single record. Mode is "edit" when the record
  // exists, otherwise "create" — the backend's SaveAbout upserts either way.
  const formMode: "create" | "edit" = data?.about ? "edit" : "create";

  const openEdit = () => setFormOpen(true);

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hakkımızda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mağazanızın hikâyesini, misyonunu ve görsel materyallerini
            yönetin. Tek bir içerik kaydı tutulur; MDX editörü ile başlık ve
            açıklamayı düzenleyin.
          </p>
        </div>
        <Button
          onClick={openEdit}
          disabled={isLoading}
          className="self-start sm:self-auto"
        >
          {formMode === "edit" ? (
            <PencilLine className="size-4" />
          ) : (
            <Plus className="size-4" />
          )}
          {formMode === "edit" ? "Düzenle" : "İçerik Ekle"}
        </Button>
      </div>

      {isLoading ? (
        <AboutCardSkeleton />
      ) : !data?.about ? (
        <EmptyState onCreate={openEdit} />
      ) : (
        <AboutCard about={data.about} fetching={isFetching} />
      )}

      <AboutFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        about={data?.about ?? null}
      />
    </div>
  );
}

function AboutCard({
  about,
  fetching,
}: {
  about: AboutModel;
  fetching?: boolean;
}) {
  const title = about.title?.trim() || "—";
  const preview = stripMdx(about.description) || "Açıklama eklenmemiş.";
  const imageUrl = about.imageUrl?.trim() || null;
  const isActive = about.isActive;

  return (
    <Card className={fetching ? "opacity-60 transition-opacity" : undefined}>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-1">
          <CardTitle>Mağaza hakkımızda içeriği</CardTitle>
          <CardDescription>
            Vitrinin "Hakkımızda" bölümünde yayımlanan tek kayıt.
          </CardDescription>
        </div>
        <span
          className={
            isActive
              ? "inline-flex items-center rounded-full bg-brand/10 px-3 py-1 text-xs font-semibold text-brand"
              : "inline-flex items-center rounded-full bg-muted px-3 py-1 text-xs font-semibold text-muted-foreground"
          }
        >
          {isActive ? "Yayında" : "Taslak"}
        </span>
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[200px_1fr] sm:items-start">
        <AboutCover src={imageUrl} title={title} />
        <div className="flex flex-col gap-2">
          <h2 className="text-xl font-semibold text-foreground">{title}</h2>
          <p className="line-clamp-6 text-sm leading-relaxed text-muted-foreground">
            {preview}
          </p>
        </div>
      </CardContent>
    </Card>
  );
}

function AboutCover({
  src,
  title,
}: {
  src: string | null;
  title: string;
}) {
  if (!src) {
    return (
      <div className="grid aspect-square w-full place-items-center rounded-2xl border border-dashed border-border bg-muted/40 text-muted-foreground">
        <div className="flex flex-col items-center gap-1.5">
          <ImageOff className="size-6" />
          <span className="text-[11px] font-medium">
            Görsel eklenmemiş
          </span>
        </div>
      </div>
    );
  }
  return (
    <div className="relative aspect-square w-full overflow-hidden rounded-2xl border border-border bg-muted">
      <Image
        src={src}
        alt={title}
        fill
        sizes="(min-width: 640px) 200px, 100vw"
        unoptimized
        className="object-cover"
      />
    </div>
  );
}

function EmptyState({ onCreate }: { onCreate: () => void }) {
  return (
    <Card>
      <CardContent className="flex flex-col items-center gap-4 px-6 py-16 text-center">
        <span className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
          <BookOpen className="size-6" />
        </span>
        <div className="space-y-1">
          <p className="text-sm font-semibold text-foreground">
            Henüz hakkımızda içeriği eklemediniz
          </p>
          <p className="max-w-md text-xs text-muted-foreground">
            Mağazanızın hikâyesini MDX editörü ile yazın. Görsel isteğe
            bağlıdır; daha sonra ekleyebilirsiniz.
          </p>
        </div>
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" />
          İçeriği oluştur
        </Button>
      </CardContent>
    </Card>
  );
}

function AboutCardSkeleton() {
  return (
    <Card>
      <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex flex-col gap-2">
          <Skeleton className="h-5 w-48" />
          <Skeleton className="h-3 w-64" />
        </div>
        <Skeleton className="h-6 w-16 rounded-full" />
      </CardHeader>
      <CardContent className="grid gap-6 sm:grid-cols-[200px_1fr] sm:items-start">
        <Skeleton className="aspect-square w-full rounded-2xl" />
        <div className="flex flex-col gap-3">
          <Skeleton className="h-5 w-2/3" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-full" />
          <Skeleton className="h-3 w-4/5" />
        </div>
      </CardContent>
    </Card>
  );
}
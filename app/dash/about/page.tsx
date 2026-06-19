"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  BookOpen,
  FileText,
  ImageOff,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Input } from "@/components/ui/input";
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { AboutFormModal } from "./_components/about-form-modal";
import {
  useGetAbouts,
  type AboutListItem,
} from "./_services/queries";

const PAGE_SIZE = 10;

function stripMdx(input: string | null | undefined): string {
  if (!input) return "—";
  return input
    .replace(/!\[[^\]]*]\([^)]*\)/g, "")
    .replace(/\[([^\]]+)]\([^)]*\)/g, "$1")
    .replace(/[#*_>`~]/g, "")
    .replace(/\s+/g, " ")
    .trim();
}

export default function AboutPage() {
  const { data, isLoading, isFetching } = useGetAbouts();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeAbout, setActiveAbout] = useState<AboutListItem | null>(
    null,
  );

  const allAbouts = useMemo(
    () => data?.abouts ?? [],
    [data?.abouts],
  );

  const filteredAbouts = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allAbouts;
    return allAbouts.filter((about) => {
      const title = (about.title ?? "").toLowerCase();
      const body = stripMdx(about.description).toLowerCase();
      return title.includes(query) || body.includes(query);
    });
  }, [allAbouts, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredAbouts.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const pagedAbouts = filteredAbouts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const openCreate = () => {
    setActiveAbout(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEdit = (about: AboutListItem) => {
    setActiveAbout(about);
    setFormMode("edit");
    setFormOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Hakkımızda
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Mağazanızın hikâyesini, misyonunu ve görsel materyallerini
            yönetin. MDX editörü ile başlık, metin ve görselleri tek
            yerden düzenleyin.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Yeni İçerik
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Tüm Hakkımızda İçerikleri</CardTitle>
            <CardDescription>
              {isLoading
                ? "İçerikler yükleniyor..."
                : `Toplam ${allAbouts.length} içerik${
                    search ? ` · ${filteredAbouts.length} eşleşme` : ""
                  }`}
            </CardDescription>
          </div>
          <div className="relative w-full sm:w-72">
            <Search className="pointer-events-none absolute left-3 top-1/2 size-4 -translate-y-1/2 text-muted-foreground" />
            <Input
              type="search"
              value={search}
              onChange={(event) => {
                setSearch(event.target.value);
                setPage(1);
              }}
              placeholder="İçerik ara..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <AboutsTableSkeleton />
          ) : pagedAbouts.length === 0 ? (
            <EmptyState
              hasAbouts={allAbouts.length > 0}
              isFiltering={search.trim().length > 0}
              onCreate={openCreate}
            />
          ) : (
            <AboutsTable
              abouts={pagedAbouts}
              onEdit={openEdit}
              fetching={isFetching}
            />
          )}
        </CardContent>
        {filteredAbouts.length > PAGE_SIZE && (
          <div className="flex items-center justify-between gap-3 border-t border-border px-4 py-3 sm:px-6">
            <p className="text-xs text-muted-foreground">
              Sayfa {safePage} / {totalPages}
            </p>
            <div className="flex items-center gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.max(1, safePage - 1))}
                disabled={safePage === 1}
              >
                Önceki
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={() => setPage(Math.min(totalPages, safePage + 1))}
                disabled={safePage === totalPages}
              >
                Sonraki
              </Button>
            </div>
          </div>
        )}
      </Card>

      <AboutFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        about={activeAbout}
      />
    </div>
  );
}

function AboutsTable({
  abouts,
  onEdit,
  fetching,
}: {
  abouts: AboutListItem[];
  onEdit: (about: AboutListItem) => void;
  fetching?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[72px]">Görsel</TableHead>
          <TableHead>Başlık</TableHead>
          <TableHead>Açıklama</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody
        className={fetching ? "opacity-60 transition-opacity" : undefined}
      >
        {abouts.map((about) => {
          const preview = stripMdx(about.description);
          return (
            <TableRow key={about.aboutId}>
              <TableCell>
                <AboutThumbnail
                  src={about.imageUrl}
                  alt={about.title ?? "Hakkımızda"}
                />
              </TableCell>
              <TableCell>
                <div className="flex flex-col">
                  <span className="font-medium text-foreground">
                    {about.title ?? "—"}
                  </span>
                  <span className="text-xs text-muted-foreground">
                    #{about.aboutId}
                  </span>
                </div>
              </TableCell>
              <TableCell className="max-w-[420px]">
                <p className="line-clamp-2 text-sm text-muted-foreground">
                  {preview}
                </p>
              </TableCell>
              <TableCell className="text-right">
                <DropdownMenu>
                  <DropdownMenuTrigger
                    render={
                      <Button variant="ghost" size="icon-sm">
                        <span className="sr-only">İşlemler menüsünü aç</span>
                        <MoreHorizontal className="size-4" />
                      </Button>
                    }
                  />
                  <DropdownMenuContent align="end">
                    <DropdownMenuItem onClick={() => onEdit(about)}>
                      <PencilLine className="size-4" />
                      Düzenle
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              </TableCell>
            </TableRow>
          );
        })}
      </TableBody>
    </Table>
  );
}

function AboutThumbnail({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid size-12 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
        <ImageOff className="size-4" />
      </div>
    );
  }
  return (
    <div className="relative size-12 overflow-hidden rounded-lg border border-border bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="48px"
        className="object-cover"
      />
    </div>
  );
}

function EmptyState({
  hasAbouts,
  isFiltering,
  onCreate,
}: {
  hasAbouts: boolean;
  isFiltering: boolean;
  onCreate: () => void;
}) {
  if (isFiltering) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Search className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Eşleşen içerik bulunamadı
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Aramayı temizleyin veya farklı bir terim deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <BookOpen className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {hasAbouts
            ? "Bu sayfada içerik yok"
            : "Henüz hakkımızda içeriği eklemediniz"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasAbouts
            ? "Diğer sayfaları kontrol edin ya da arama filtresini temizleyin."
            : "Mağazanızın hikâyesini MDX editörü ile yazıp görseller ekleyin."}
        </p>
      </div>
      {!hasAbouts && (
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" />
          İlk içeriği oluştur
        </Button>
      )}
    </div>
  );
}

function AboutsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[72px]">Görsel</TableHead>
          <TableHead>Başlık</TableHead>
          <TableHead>Açıklama</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 5 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="size-12 rounded-lg" />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-16" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3 w-64" />
                <Skeleton className="h-3 w-40" />
              </div>
            </TableCell>
            <TableCell className="text-right">
              <Skeleton className="ml-auto size-7 rounded-md" />
            </TableCell>
          </TableRow>
        ))}
        <TableRow className="border-0">
          <TableCell colSpan={4} className="py-4 text-center">
            <p className="inline-flex items-center gap-1.5 text-xs text-muted-foreground">
              <FileText className="size-3" />
              İçerikler yükleniyor...
            </p>
          </TableCell>
        </TableRow>
      </TableBody>
    </Table>
  );
}

"use client";

import { useMemo, useState } from "react";
import {
  Inbox,
  Mail,
  MailOpen,
  MoreHorizontal,
  RefreshCcw,
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
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
import { cn } from "@/lib/format";
import {
  useGetSupportMessages,
  type SupportMessageItem,
} from "./_services/queries";

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

export default function SupportMessagesPage() {
  const messagesQuery = useGetSupportMessages();
  const { data, isLoading, isFetching, refetch } = messagesQuery;

  const allItems = useMemo(() => data?.items ?? [], [data?.items]);

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [activeItem, setActiveItem] = useState<SupportMessageItem | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allItems;
    return allItems.filter((item) => {
      return (
        (item.name ?? "").toLowerCase().includes(query) ||
        (item.surname ?? "").toLowerCase().includes(query) ||
        (item.email ?? "").toLowerCase().includes(query) ||
        (item.title ?? "").toLowerCase().includes(query) ||
        (item.message ?? "").toLowerCase().includes(query)
      );
    });
  }, [allItems, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const openDetail = (item: SupportMessageItem) => {
    setActiveItem(item);
    setDetailOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Destek Mesajları
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Site genelinden gelen kullanıcı mesajlarını buradan görüntüleyin.
            En yeni mesaj en üstte listelenir.
          </p>
        </div>
        <Button
          variant="outline"
          onClick={() => refetch()}
          disabled={isFetching}
          className="self-start sm:self-auto"
        >
          <RefreshCcw
            className={cn("size-4", isFetching && "animate-spin")}
          />
          Yenile
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Tüm Mesajlar</CardTitle>
            <CardDescription>
              {isLoading
                ? "Mesajlar yükleniyor..."
                : `Toplam ${allItems.length} mesaj${
                    search ? ` · ${filteredItems.length} eşleşme` : ""
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
              placeholder="Ad, e-posta, konu veya mesaj ara..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <SupportMessagesTableSkeleton />
          ) : pagedItems.length === 0 ? (
            <EmptyState
              isFiltering={search.trim().length > 0}
              hasItems={allItems.length > 0}
              onRefresh={() => refetch()}
            />
          ) : (
            <SupportMessagesTable
              items={pagedItems}
              fetching={isFetching}
              onOpen={openDetail}
            />
          )}
        </CardContent>
        {filteredItems.length > PAGE_SIZE && (
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

      <Dialog open={detailOpen} onOpenChange={setDetailOpen}>
        <DialogContent className="sm:max-w-xl">
          <DialogHeader>
            <DialogTitle>
              {activeItem?.title?.trim() || "Mesaj"}
            </DialogTitle>
            <DialogDescription>
              {activeItem ? (
                <span className="block">
                  <span className="font-medium text-foreground">
                    {fullSenderName(activeItem) || activeItem.email || "—"}
                  </span>
                  {activeItem.email ? (
                    <>
                      {" "}
                      ·{" "}
                      <a
                        href={`mailto:${activeItem.email.trim()}`}
                        className="underline-offset-4 hover:underline"
                      >
                        {activeItem.email}
                      </a>
                    </>
                  ) : null}
                  {" "}
                  · {formatDate(activeItem.createdDate)}
                </span>
              ) : null}
            </DialogDescription>
          </DialogHeader>

          {activeItem ? (
            <div className="flex flex-col gap-3 text-sm">
              <div className="rounded-xl border border-border bg-muted/30 px-4 py-3 text-foreground">
                <p className="whitespace-pre-line text-sm leading-relaxed">
                  {activeItem.message?.trim() ||
                    "Mesaj içeriği bulunamadı."}
                </p>
              </div>
              <p className="text-xs text-muted-foreground">
                Yanıtlamak için{" "}
                <a
                  href={`mailto:${(activeItem.email ?? "").trim()}`}
                  className="font-medium text-foreground underline-offset-4 hover:underline"
                >
                  {activeItem.email ?? "—"}
                </a>{" "}
                adresine doğrudan e-posta gönderebilirsiniz.
              </p>
            </div>
          ) : null}
        </DialogContent>
      </Dialog>
    </div>
  );
}

function SupportMessagesTable({
  items,
  fetching,
  onOpen,
}: {
  items: SupportMessageItem[];
  fetching?: boolean;
  onOpen: (item: SupportMessageItem) => void;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[36%]">Konu</TableHead>
          <TableHead className="w-[28%]">Gönderen</TableHead>
          <TableHead className="w-[160px]">Tarih</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody
        className={fetching ? "opacity-60 transition-opacity" : undefined}
      >
        {items.map((item) => (
          <TableRow
            key={item.supportMessageId}
            className="cursor-pointer"
            onClick={() => onOpen(item)}
          >
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="line-clamp-1 font-medium text-foreground">
                  {item.title?.trim() || "İsimsiz mesaj"}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {item.message?.trim() || ""}
                </span>
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="text-sm font-medium text-foreground">
                  {fullSenderName(item) || "İsimsiz ziyaretçi"}
                </span>
                <span className="text-xs text-muted-foreground">
                  {item.email ?? "—"}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-sm text-muted-foreground">
              {formatDate(item.createdDate)}
            </TableCell>
            <TableCell className="text-right">
              <DropdownMenu>
                <DropdownMenuTrigger
                  render={
                    <Button
                      variant="ghost"
                      size="icon-sm"
                      onClick={(event) => event.stopPropagation()}
                    >
                      <span className="sr-only">İşlemler menüsünü aç</span>
                      <MoreHorizontal className="size-4" />
                    </Button>
                  }
                />
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(event) => {
                      event.stopPropagation();
                      onOpen(item);
                    }}
                  >
                    <MailOpen className="size-4" />
                    Mesajı Aç
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    render={
                      <a
                        href={`mailto:${(item.email ?? "").trim()}`}
                        onClick={(event) => event.stopPropagation()}
                      />
                    }
                  >
                    <Mail className="size-4" />
                    E-posta Gönder
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </TableCell>
          </TableRow>
        ))}
      </TableBody>
    </Table>
  );
}

function fullSenderName(item: Pick<SupportMessageItem, "name" | "surname">) {
  return [item.name, item.surname]
    .map((part) => (part ?? "").trim())
    .filter(Boolean)
    .join(" ");
}

function EmptyState({
  isFiltering,
  hasItems,
  onRefresh,
}: {
  isFiltering: boolean;
  hasItems: boolean;
  onRefresh: () => void;
}) {
  if (isFiltering) {
    return (
      <div className="flex flex-col items-center gap-2 px-4 py-12 text-center">
        <div className="grid size-12 place-items-center rounded-full bg-muted text-muted-foreground">
          <Search className="size-5" />
        </div>
        <p className="text-sm font-medium text-foreground">
          Eşleşen mesaj bulunamadı
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          Aramanızı temizleyin veya farklı bir terim deneyin.
        </p>
      </div>
    );
  }

  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Inbox className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {hasItems
            ? "Bu sayfada mesaj yok"
            : "Henüz destek mesajı yok"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasItems
            ? "Diğer sayfaları kontrol edin ya da arama filtresini temizleyin."
            : "Kullanıcılar iletişim formundan mesaj gönderdiğinde burada görünecek."}
        </p>
      </div>
      {!hasItems && (
        <Button onClick={onRefresh} variant="outline" size="sm">
          <RefreshCcw className="size-4" />
          Yenile
        </Button>
      )}
    </div>
  );
}

function SupportMessagesTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[36%]">Konu</TableHead>
          <TableHead className="w-[28%]">Gönderen</TableHead>
          <TableHead className="w-[160px]">Tarih</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-3/4" />
                <Skeleton className="h-3 w-1/2" />
              </div>
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-1.5">
                <Skeleton className="h-3.5 w-28" />
                <Skeleton className="h-3 w-36" />
              </div>
            </TableCell>
            <TableCell>
              <Skeleton className="h-3.5 w-28" />
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
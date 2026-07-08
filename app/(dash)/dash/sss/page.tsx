"use client";

import { useMemo, useState } from "react";
import {
  CircleHelp,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Trash2,
} from "lucide-react";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
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
import { SupportFormModal } from "./_components/support-form-modal";
import { DeleteSupportDialog } from "./_components/delete-support-dialog";
import { useGetSupports, type SupportListItem } from "./_services/queries";

const PAGE_SIZE = 10;

export default function SssPage() {
  const { data, isLoading, isFetching } = useGetSupports();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeItem, setActiveItem] = useState<SupportListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const allItems = useMemo(() => data?.items ?? [], [data?.items]);

  const filteredItems = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allItems;
    return allItems.filter((item) => {
      const question = (item.question ?? "").toLowerCase();
      const answer = (item.answer ?? "").toLowerCase();
      const category = (item.category ?? "").toLowerCase();
      return (
        question.includes(query) ||
        answer.includes(query) ||
        category.includes(query)
      );
    });
  }, [allItems, search]);

  const totalPages = Math.max(1, Math.ceil(filteredItems.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedItems = filteredItems.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const openCreate = () => {
    setActiveItem(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEdit = (item: SupportListItem) => {
    setActiveItem(item);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDelete = (item: SupportListItem) => {
    setActiveItem(item);
    setDeleteOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Sıkça Sorulan Sorular
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Müşterilerinizin sık sorduğu soruları buradan yönetin. Aktif
            kayıtlar mağaza vitrininde görüntülenir.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Yeni SSS
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Tüm SSS Kayıtları</CardTitle>
            <CardDescription>
              {isLoading
                ? "SSS kayıtları yükleniyor..."
                : `Toplam ${allItems.length} kayıt${
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
              placeholder="Soru, cevap veya kategori ara..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <SssTableSkeleton />
          ) : pagedItems.length === 0 ? (
            <EmptyState
              hasItems={allItems.length > 0}
              isFiltering={search.trim().length > 0}
              onCreate={openCreate}
            />
          ) : (
            <SssTable
              items={pagedItems}
              onEdit={openEdit}
              onDelete={openDelete}
              fetching={isFetching}
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

      <SupportFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        item={activeItem}
      />

      <DeleteSupportDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        item={activeItem}
      />
    </div>
  );
}

function SssTable({
  items,
  onEdit,
  onDelete,
  fetching,
}: {
  items: SupportListItem[];
  onEdit: (item: SupportListItem) => void;
  onDelete: (item: SupportListItem) => void;
  fetching?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[44%]">Soru</TableHead>
          <TableHead className="w-[20%]">Kategori</TableHead>
          <TableHead className="w-[80px] text-center">Sıra</TableHead>
          <TableHead className="w-[110px] text-center">Durum</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody
        className={fetching ? "opacity-60 transition-opacity" : undefined}
      >
        {items.map((item) => (
          <TableRow key={item.supportId}>
            <TableCell>
              <div className="flex flex-col gap-1">
                <span className="line-clamp-1 font-medium text-foreground">
                  {item.question ?? "—"}
                </span>
                <span className="line-clamp-1 text-xs text-muted-foreground">
                  {item.answer ?? ""}
                </span>
              </div>
            </TableCell>
            <TableCell>
              {item.category ? (
                <Badge variant="secondary" className="font-normal">
                  {item.category}
                </Badge>
              ) : (
                <span className="text-xs text-muted-foreground">—</span>
              )}
            </TableCell>
            <TableCell className="text-center text-xs text-muted-foreground">
              #{item.displayOrder}
            </TableCell>
            <TableCell className="text-center">
              <StatusBadge isActive={item.isActive} />
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
                  <DropdownMenuItem onClick={() => onEdit(item)}>
                    <PencilLine className="size-4" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(item)}
                    className="text-destructive focus:text-destructive"
                  >
                    <Trash2 className="size-4" />
                    Sil
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

function StatusBadge({ isActive }: { isActive: boolean }) {
  if (isActive) {
    return (
      <Badge variant="default" className="font-normal">
        Aktif
      </Badge>
    );
  }
  return (
    <Badge variant="outline" className="font-normal text-muted-foreground">
      Pasif
    </Badge>
  );
}

function EmptyState({
  hasItems,
  isFiltering,
  onCreate,
}: {
  hasItems: boolean;
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
          Eşleşen kayıt bulunamadı
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
        <CircleHelp className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {hasItems
            ? "Bu sayfada SSS kaydı yok"
            : "Henüz SSS kaydı eklemediniz"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasItems
            ? "Diğer sayfaları kontrol edin ya da arama filtresini temizleyin."
            : "Müşterilerin sık sorduğu soruları yanıtlayan ilk SSS kaydınızı oluşturun."}
        </p>
      </div>
      {!hasItems && (
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" />
          İlk SSS kaydını ekle
        </Button>
      )}
    </div>
  );
}

function SssTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[44%]">Soru</TableHead>
          <TableHead className="w-[20%]">Kategori</TableHead>
          <TableHead className="w-[80px] text-center">Sıra</TableHead>
          <TableHead className="w-[110px] text-center">Durum</TableHead>
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
              <Skeleton className="h-5 w-20" />
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="mx-auto h-3 w-8" />
            </TableCell>
            <TableCell className="text-center">
              <Skeleton className="mx-auto h-5 w-14" />
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
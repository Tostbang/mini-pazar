"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  FolderTree,
  ImageOff,
  MoreHorizontal,
  PencilLine,
  Plus,
  Search,
  Trash2,
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
import { CategoryFormModal } from "./_components/category-form-modal";
import { DeleteCategoryDialog } from "./_components/delete-category-dialog";
import {
  useGetCategories,
  type CategoryListItem,
} from "./_services/queries";

const PAGE_SIZE = 10;

export default function CategoriesPage() {
  const { data, isLoading, isFetching } = useGetCategories();

  const [search, setSearch] = useState("");
  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeCategory, setActiveCategory] =
    useState<CategoryListItem | null>(null);
  const [deleteOpen, setDeleteOpen] = useState(false);

  const allCategories = useMemo(
    () => data?.categories ?? [],
    [data?.categories],
  );

  const filteredCategories = useMemo(() => {
    const query = search.trim().toLowerCase();
    if (!query) return allCategories;
    return allCategories.filter((category) =>
      (category.categoryName ?? "").toLowerCase().includes(query),
    );
  }, [allCategories, search]);

  const totalPages = Math.max(
    1,
    Math.ceil(filteredCategories.length / PAGE_SIZE),
  );
  const safePage = Math.min(page, totalPages);
  const pagedCategories = filteredCategories.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const openCreate = () => {
    setActiveCategory(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEdit = (category: CategoryListItem) => {
    setActiveCategory(category);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDelete = (category: CategoryListItem) => {
    setActiveCategory(category);
    setDeleteOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Kategoriler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Ürünlerinizi gruplamak için kategoriler oluşturun ve yönetin.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Yeni Kategori
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Tüm Kategoriler</CardTitle>
            <CardDescription>
              {isLoading
                ? "Kategoriler yükleniyor..."
                : `Toplam ${allCategories.length} kategori${
                    search ? ` · ${filteredCategories.length} eşleşme` : ""
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
              placeholder="Kategori ara..."
              className="pl-9"
            />
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <CategoriesTableSkeleton />
          ) : pagedCategories.length === 0 ? (
            <EmptyState
              hasCategories={allCategories.length > 0}
              isFiltering={search.trim().length > 0}
              onCreate={openCreate}
            />
          ) : (
            <CategoriesTable
              categories={pagedCategories}
              onEdit={openEdit}
              onDelete={openDelete}
              fetching={isFetching}
            />
          )}
        </CardContent>
        {filteredCategories.length > PAGE_SIZE && (
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

      <CategoryFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        category={activeCategory}
      />

      <DeleteCategoryDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        category={activeCategory}
      />
    </div>
  );
}

function CategoriesTable({
  categories,
  onEdit,
  onDelete,
  fetching,
}: {
  categories: CategoryListItem[];
  onEdit: (category: CategoryListItem) => void;
  onDelete: (category: CategoryListItem) => void;
  fetching?: boolean;
}) {
  return (
      <Table>
        <TableHeader>
          <TableRow>
            <TableHead className="w-[64px]">Görsel</TableHead>
            <TableHead>Kategori</TableHead>
            <TableHead className="w-10 text-right">
              <span className="sr-only">İşlemler</span>
            </TableHead>
          </TableRow>
        </TableHeader>
        <TableBody
          className={fetching ? "opacity-60 transition-opacity" : undefined}
        >
          {categories.map((category) => (
            <TableRow key={category.categoryId}>
              <TableCell>
                <CategoryThumbnail
                  src={category.imageUrl}
                  alt={category.categoryName ?? "Kategori"}
                />
              </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {category.categoryName ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{category.categoryId}
                </span>
              </div>
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
                  <DropdownMenuItem onClick={() => onEdit(category)}>
                    <PencilLine className="size-4" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(category)}
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

function EmptyState({
  hasCategories,
  isFiltering,
  onCreate,
}: {
  hasCategories: boolean;
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
          Eşleşen kategori bulunamadı
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
        <FolderTree className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {hasCategories
            ? "Bu sayfada kategori yok"
            : "Henüz kategori eklemediniz"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasCategories
            ? "Diğer sayfaları kontrol edin ya da arama filtresini temizleyin."
            : "Ürünlerinizi düzenlemek için ilk kategorinizi oluşturun."}
        </p>
      </div>
      {!hasCategories && (
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" />
          İlk kategoriyi ekle
        </Button>
      )}
    </div>
  );
}

function CategoriesTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[64px]">Görsel</TableHead>
          <TableHead>Kategori</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
          <TableRow key={index}>
            <TableCell>
              <Skeleton className="size-9 rounded-lg" />
            </TableCell>
            <TableCell>
              <div className="flex flex-col gap-2">
                <Skeleton className="h-3.5 w-44" />
                <Skeleton className="h-3 w-16" />
              </div>
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

function CategoryThumbnail({
  src,
  alt,
}: {
  src?: string | null;
  alt: string;
}) {
  if (!src) {
    return (
      <div className="grid size-9 place-items-center rounded-lg border border-border bg-muted text-muted-foreground">
        <ImageOff className="size-4" />
      </div>
    );
  }
  return (
    <div className="relative size-9 overflow-hidden rounded-lg border border-border bg-muted">
      <Image
        src={src}
        alt={alt}
        fill
        sizes="36px"
        unoptimized
        className="object-contain p-1"
      />
    </div>
  );
}

"use client";

import { useMemo, useState } from "react";
import Image from "next/image";
import {
  ImageOff,
  MoreHorizontal,
  Package,
  PencilLine,
  Plus,
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
import { Skeleton } from "@/components/ui/skeleton";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { DeleteProductDialog } from "./_components/delete-product-dialog";
import { ProductFormModal } from "./_components/product-form-modal";
import { useGetProducts, type ProductListItem } from "./_services/queries";

const PAGE_SIZE = 10;

const currencyFormatter = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

function formatPrice(value: number | undefined | null) {
  if (value === null || value === undefined) return "—";
  try {
    return currencyFormatter.format(value);
  } catch {
    return `₺${value.toFixed(2)}`;
  }
}

export default function ProductsPage() {
  const { data, isLoading, isFetching } = useGetProducts();

  const [page, setPage] = useState(1);
  const [formOpen, setFormOpen] = useState(false);
  const [formMode, setFormMode] = useState<"create" | "edit">("create");
  const [activeProduct, setActiveProduct] = useState<ProductListItem | null>(
    null,
  );
  const [deleteOpen, setDeleteOpen] = useState(false);

  const allProducts = useMemo(
    () => data?.products ?? [],
    [data?.products],
  );

  const totalPages = Math.max(1, Math.ceil(allProducts.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const pagedProducts = allProducts.slice(
    (safePage - 1) * PAGE_SIZE,
    safePage * PAGE_SIZE,
  );

  const openCreate = () => {
    setActiveProduct(null);
    setFormMode("create");
    setFormOpen(true);
  };

  const openEdit = (product: ProductListItem) => {
    setActiveProduct(product);
    setFormMode("edit");
    setFormOpen(true);
  };

  const openDelete = (product: ProductListItem) => {
    setActiveProduct(product);
    setDeleteOpen(true);
  };

  return (
    <div className="mx-auto flex w-full max-w-6xl flex-col gap-6">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight sm:text-3xl">
            Ürünler
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Vitrininizdeki ürünleri görüntüleyin, yeni ürün ekleyin veya mevcut
            ürünleri güncelleyin.
          </p>
        </div>
        <Button onClick={openCreate} className="self-start sm:self-auto">
          <Plus className="size-4" />
          Yeni Ürün
        </Button>
      </div>

      <Card>
        <CardHeader className="gap-3 sm:flex-row sm:items-center sm:justify-between">
          <div className="flex flex-col gap-1">
            <CardTitle>Tüm Ürünler</CardTitle>
            <CardDescription>
              {isLoading
                ? "Ürünler yükleniyor..."
                : `Toplam ${allProducts.length} ürün`}
            </CardDescription>
          </div>
        </CardHeader>
        <CardContent className="px-0">
          {isLoading ? (
            <ProductsTableSkeleton />
          ) : pagedProducts.length === 0 ? (
            <EmptyState
              hasProducts={allProducts.length > 0}
              onCreate={openCreate}
            />
          ) : (
            <ProductsTable
              products={pagedProducts}
              onEdit={openEdit}
              onDelete={openDelete}
              fetching={isFetching}
            />
          )}
        </CardContent>
        {allProducts.length > PAGE_SIZE && (
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

      <ProductFormModal
        open={formOpen}
        onOpenChange={setFormOpen}
        mode={formMode}
        product={activeProduct}
      />

      <DeleteProductDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        product={activeProduct}
      />
    </div>
  );
}

function ProductsTable({
  products,
  onEdit,
  onDelete,
  fetching,
}: {
  products: ProductListItem[];
  onEdit: (product: ProductListItem) => void;
  onDelete: (product: ProductListItem) => void;
  fetching?: boolean;
}) {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[64px]">Görsel</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead className="text-right">Fiyat</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody
        className={fetching ? "opacity-60 transition-opacity" : undefined}
      >
        {products.map((product) => (
          <TableRow key={product.productId}>
            <TableCell>
              <ProductThumbnail
                src={product.imageUrl}
                alt={product.name ?? "Ürün"}
              />
            </TableCell>
            <TableCell>
              <div className="flex flex-col">
                <span className="font-medium text-foreground">
                  {product.name ?? "—"}
                </span>
                <span className="text-xs text-muted-foreground">
                  #{product.productId}
                </span>
              </div>
            </TableCell>
            <TableCell className="text-right font-medium tabular-nums">
              {formatPrice(product.price)}
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
                  <DropdownMenuItem onClick={() => onEdit(product)}>
                    <PencilLine className="size-4" />
                    Düzenle
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={() => onDelete(product)}
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

function ProductThumbnail({ src, alt }: { src?: string | null; alt: string }) {
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
  hasProducts,
  onCreate,
}: {
  hasProducts: boolean;
  onCreate: () => void;
}) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-12 text-center">
      <div className="grid size-14 place-items-center rounded-full bg-muted text-muted-foreground">
        <Package className="size-6" />
      </div>
      <div className="space-y-1">
        <p className="text-sm font-semibold text-foreground">
          {hasProducts ? "Bu sayfada ürün yok" : "Henüz ürün eklemediniz"}
        </p>
        <p className="max-w-sm text-xs text-muted-foreground">
          {hasProducts
            ? "Diğer sayfaları kontrol edin."
            : "İlk ürününüzü ekleyerek vitrininizi oluşturmaya başlayın."}
        </p>
      </div>
      {!hasProducts && (
        <Button onClick={onCreate} size="sm">
          <Plus className="size-4" />
          İlk ürünü ekle
        </Button>
      )}
    </div>
  );
}

function ProductsTableSkeleton() {
  return (
    <Table>
      <TableHeader>
        <TableRow>
          <TableHead className="w-[64px]">Görsel</TableHead>
          <TableHead>Ürün</TableHead>
          <TableHead className="text-right">Fiyat</TableHead>
          <TableHead className="w-10 text-right">
            <span className="sr-only">İşlemler</span>
          </TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {Array.from({ length: 6 }).map((_, index) => (
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
            <TableCell className="text-right">
              <Skeleton className="ml-auto h-4 w-20" />
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

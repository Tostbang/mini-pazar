"use client";

import { useEffect, useRef, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import {
  ImagePlus,
  Loader2,
  Save,
  Upload,
  X,
} from "lucide-react";
import Image from "next/image";
import { toast } from "sonner";
import { FormInput } from "@/components/FormInput";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { ProductImageEditor } from "./product-image-editor";
import {
  useCreateProduct,
  useGetCategories,
  useUpdateProduct,
  useUploadImage,
  type ProductListItem,
} from "../_services/queries";

const formSchema = z.object({
  name: z
    .string()
    .trim()
    .min(2, "Ürün adı en az 2 karakter olmalıdır.")
    .max(120, "Ürün adı en fazla 120 karakter olabilir."),
  description: z
    .string()
    .trim()
    .max(500, "Açıklama en fazla 500 karakter olabilir.")
    .optional()
    .or(z.literal("")),
  categoryId: z
    .number({ error: "Lütfen bir kategori seçin." })
    .int()
    .positive("Lütfen bir kategori seçin."),
  price: z
    .number({ error: "Lütfen geçerli bir fiyat girin." })
    .min(0, "Fiyat 0'dan küçük olamaz."),
  stock: z
    .number({ error: "Lütfen geçerli bir stok adedi girin." })
    .int("Stok tam sayı olmalıdır.")
    .min(0, "Stok 0'dan küçük olamaz."),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Lütfen bir ürün görseli yükleyin."),
});

type FormValues = z.infer<typeof formSchema>;

type Mode = "create" | "edit";

interface ProductFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  product?: ProductListItem | null;
  defaultCategoryId?: number;
  defaultDescription?: string;
  defaultStock?: number;
}

export function ProductFormModal({
  open,
  onOpenChange,
  mode,
  product,
  defaultCategoryId,
  defaultDescription = "",
  defaultStock = 0,
}: ProductFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const categoriesQuery = useGetCategories();
  const uploadMutation = useUploadImage();
  const createMutation = useCreateProduct();
  const updateMutation = useUpdateProduct();

  const [editorOpen, setEditorOpen] = useState(false);
  const [editorFile, setEditorFile] = useState<File | null>(null);

  const isEdit = mode === "edit";
  const isSubmitting =
    createMutation.isPending ||
    updateMutation.isPending ||
    uploadMutation.isPending;

  const { control, handleSubmit, watch, setValue, reset, formState } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
      defaultValues: {
        name: "",
        description: "",
        categoryId: 0,
        price: 0,
        stock: 0,
        imageUrl: "",
      },
    });

  useEffect(() => {
    if (!open) return;
    reset({
      name: product?.name ?? "",
      description: defaultDescription,
      categoryId: defaultCategoryId ?? 0,
      price: product?.price ?? 0,
      stock: defaultStock,
      imageUrl: product?.imageUrl ?? "",
    });
  }, [
    open,
    product,
    defaultCategoryId,
    defaultDescription,
    defaultStock,
    reset,
  ]);

  const imageUrl = watch("imageUrl");
  const categories = categoriesQuery.data?.categories ?? [];

  const onSelectFile = () => fileInputRef.current?.click();

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }
    setEditorFile(file);
    setEditorOpen(true);
  };

  const handleEditorConfirm = async (file: File) => {
    setEditorOpen(false);
    try {
      const response = await uploadMutation.mutateAsync({
        file,
        type: "product",
      });
      const url = response.fileUrl;
      if (!url) {
        toast.error("Görsel yüklendi fakat URL alınamadı.");
        return;
      }
      setValue("imageUrl", url, { shouldValidate: true, shouldDirty: true });
      toast.success("Görsel yüklendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Görsel yüklenirken bir hata oluştu.";
      toast.error(message);
    } finally {
      setEditorFile(null);
    }
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      categoryId: data.categoryId,
      name: data.name.trim(),
      description: data.description?.trim() || null,
      price: data.price,
      stock: data.stock,
      imageUrl: data.imageUrl.trim(),
      displayOrder: 0,
    };

    try {
      if (isEdit && product) {
        await updateMutation.mutateAsync({
          body: { productId: product.productId, ...payload },
        });
        toast.success("Ürün güncellendi.");
      } else {
        await createMutation.mutateAsync({ body: payload });
        toast.success("Ürün oluşturuldu.");
      }
      onOpenChange(false);
    } catch {
      toast.error(
        isEdit
          ? "Ürün güncellenirken bir hata oluştu."
          : "Ürün oluşturulurken bir hata oluştu.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Ürünü Düzenle" : "Yeni Ürün Oluştur"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Ürün bilgilerini güncelleyin ve değişiklikleri kaydedin."
              : "Vitrininize yeni bir ürün ekleyin. Tüm alanları doldurun."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="grid gap-5 sm:grid-cols-[180px_1fr]">
            <ImageUploader
              imageUrl={imageUrl}
              uploading={uploadMutation.isPending}
              onClick={onSelectFile}
              onClear={() =>
                setValue("imageUrl", "", {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
              error={formState.errors.imageUrl?.message}
            />
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              hidden
              onChange={onFileChange}
            />

            <div className="flex flex-col gap-4">
              <FormInput
                type="text"
                name="name"
                label="Ürün Adı"
                control={control}
                placeholder="Örn. Organik Beyaz Un"
              />

              <Controller
                control={control}
                name="categoryId"
                render={({ field, fieldState }) => {
                  const categoryItems = categories.map((category) => ({
                    value: String(category.categoryId),
                    label: category.categoryName ?? "—",
                  }));
                  return (
                    <div className="flex flex-col gap-1.5">
                      <label
                        htmlFor="product-category"
                        className="text-sm font-medium text-foreground"
                      >
                        Kategori
                      </label>
                      <Select
                        items={categoryItems}
                        value={field.value ? String(field.value) : ""}
                        onValueChange={(value) =>
                          field.onChange(Number(value))
                        }
                        disabled={categoriesQuery.isLoading}
                      >
                        <SelectTrigger
                          id="product-category"
                          className="h-9 w-full"
                          aria-invalid={!!fieldState.error}
                        >
                          <SelectValue
                            placeholder={
                              categoriesQuery.isLoading
                                ? "Kategoriler yükleniyor..."
                                : "Kategori seçin"
                            }
                          />
                        </SelectTrigger>
                        <SelectContent>
                          {categories.length === 0 ? (
                            <div className="px-3 py-4 text-center text-xs text-muted-foreground">
                              Önce bir kategori oluşturun.
                            </div>
                          ) : (
                            categories.map((category) => (
                              <SelectItem
                                key={category.categoryId}
                                value={String(category.categoryId)}
                              >
                                {category.categoryName ?? "—"}
                              </SelectItem>
                            ))
                          )}
                        </SelectContent>
                      </Select>
                      {fieldState.error?.message && (
                        <p className="text-xs font-medium text-destructive">
                          {fieldState.error.message}
                        </p>
                      )}
                    </div>
                  );
                }}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
            <Controller
              control={control}
              name="price"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="product-price"
                    className="text-sm font-medium text-foreground"
                  >
                    Fiyat (₺)
                  </label>
                  <Input
                    id="product-price"
                    type="number"
                    inputMode="decimal"
                    step="0.01"
                    min={0}
                    placeholder="0.00"
                    aria-invalid={!!fieldState.error}
                    value={field.value ? field.value : ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;
                      field.onChange(value === "" ? 0 : parseFloat(value));
                    }}
                  />
                  {fieldState.error?.message && (
                    <p className="text-xs font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />

            <Controller
              control={control}
              name="stock"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <label
                    htmlFor="product-stock"
                    className="text-sm font-medium text-foreground"
                  >
                    Stok
                  </label>
                  <Input
                    id="product-stock"
                    type="number"
                    inputMode="numeric"
                    step="1"
                    min={0}
                    placeholder="0"
                    aria-invalid={!!fieldState.error}
                    value={field.value ? field.value : ""}
                    onChange={(event) => {
                      const value = (event.target as HTMLInputElement).value;
                      field.onChange(value === "" ? 0 : parseInt(value, 10));
                    }}
                  />
                  {fieldState.error?.message && (
                    <p className="text-xs font-medium text-destructive">
                      {fieldState.error.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

          <Controller
            control={control}
            name="description"
            render={({ field, fieldState }) => (
              <div className="flex flex-col gap-1.5">
                <label
                  htmlFor="product-description"
                  className="text-sm font-medium text-foreground"
                >
                  Açıklama
                </label>
                <Textarea
                  id="product-description"
                  placeholder="Ürünün kısa açıklaması (isteğe bağlı)"
                  value={field.value ?? ""}
                  onChange={(event) => field.onChange(event.target.value)}
                />
                {fieldState.error?.message && (
                  <p className="text-xs font-medium text-destructive">
                    {fieldState.error.message}
                  </p>
                )}
              </div>
            )}
          />

          <DialogFooter className="gap-2 sm:gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => onOpenChange(false)}
              disabled={isSubmitting}
            >
              İptal
            </Button>
            <Button type="submit" disabled={isSubmitting}>
              {isSubmitting ? (
                <Loader2 className="size-4 animate-spin" />
              ) : (
                <Save className="size-4" />
              )}
              {isSubmitting
                ? isEdit
                  ? "Güncelleniyor..."
                  : "Oluşturuluyor..."
                : isEdit
                  ? "Güncelle"
                  : "Ürünü Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
      <ProductImageEditor
        open={editorOpen}
        onOpenChange={setEditorOpen}
        file={editorFile}
        onConfirm={handleEditorConfirm}
      />
    </Dialog>
  );
}

function ImageUploader({
  imageUrl,
  uploading,
  onClick,
  onClear,
  error,
}: {
  imageUrl: string;
  uploading: boolean;
  onClick: () => void;
  onClear: () => void;
  error?: string;
}) {
  const triggerProps = {
    role: "button" as const,
    tabIndex: uploading ? -1 : 0,
    onClick: uploading ? undefined : onClick,
    onKeyDown: uploading
      ? undefined
      : (event: React.KeyboardEvent<HTMLDivElement>) => {
          if (event.key === "Enter" || event.key === " ") {
            event.preventDefault();
            onClick();
          }
        },
    "aria-label": imageUrl ? "Ürün görselini değiştir" : "Ürün görseli yükle",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-medium text-foreground">Görsel</span>
      <div
        {...triggerProps}
        className={cn(
          "group relative grid aspect-square w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed bg-muted/40 text-center text-xs text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
          uploading && "cursor-wait opacity-70",
          error ? "border-destructive" : "border-border hover:border-foreground/30",
        )}
      >
        {uploading ? (
          <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-2 bg-background/80 backdrop-blur-sm">
            <Loader2 className="size-7 animate-spin text-foreground" />
            <span className="text-xs font-semibold text-foreground">
              Yükleniyor...
            </span>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Ürün görseli"
              fill
              sizes="180px"
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm">
                <Upload className="size-3.5" />
                Değiştir
              </div>
            </div>
            <button
              type="button"
              onClick={(event) => {
                event.stopPropagation();
                onClear();
              }}
              aria-label="Görseli kaldır"
              className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div className="flex flex-col items-center gap-1.5 px-3 py-6">
            <ImagePlus className="size-6 text-muted-foreground/70" />
            <span className="font-medium">Görsel yüklemek için tıklayın</span>
            <span className="text-[11px] text-muted-foreground/70">
              PNG, JPG, WEBP
            </span>
          </div>
        )}
      </div>
      {error && (
        <p className="text-xs font-medium text-destructive">{error}</p>
      )}
    </div>
  );
}

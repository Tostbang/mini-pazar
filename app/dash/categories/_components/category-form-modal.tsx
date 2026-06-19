"use client";

import Image from "next/image";
import { useEffect, useState } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save, X } from "lucide-react";
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
import { CategoryEmojiPicker } from "./category-emoji-picker";
import {
  useCreateCategory,
  useUpdateCategory,
  type CategoryListItem,
} from "../_services/queries";

const formSchema = z.object({
  categoryName: z
    .string()
    .trim()
    .min(2, "Kategori adı en az 2 karakter olmalıdır.")
    .max(80, "Kategori adı en fazla 80 karakter olabilir."),
  imageUrl: z
    .string()
    .trim()
    .min(1, "Lütfen bir emoji seçin."),
});

type FormValues = z.infer<typeof formSchema>;

type Mode = "create" | "edit";

interface CategoryFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  category?: CategoryListItem | null;
}

export function CategoryFormModal({
  open,
  onOpenChange,
  mode,
  category,
}: CategoryFormModalProps) {
  const createMutation = useCreateCategory();
  const updateMutation = useUpdateCategory();

  const isEdit = mode === "edit";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const [selectedEmoji, setSelectedEmoji] = useState<string | null>(null);

  const { control, handleSubmit, watch, setValue, reset, formState } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
      defaultValues: {
        categoryName: "",
        imageUrl: "",
      },
    });

  const categoryName = watch("categoryName") ?? "";
  const imageUrl = watch("imageUrl") ?? "";

  useEffect(() => {
    if (!open) return;
    reset({
      categoryName: category?.categoryName ?? "",
      imageUrl: category?.imageUrl ?? "",
    });
    setSelectedEmoji(null);
  }, [open, category, reset]);

  const handleSelectEmoji = (emoji: string, url: string) => {
    setSelectedEmoji(emoji);
    setValue("imageUrl", url, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleClearEmoji = () => {
    setSelectedEmoji(null);
    setValue("imageUrl", "", {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      categoryName: data.categoryName.trim(),
      imageUrl: data.imageUrl.trim(),
      displayOrder: 0,
      isActive: true,
    };

    try {
      if (isEdit && category) {
        await updateMutation.mutateAsync({
          body: { categoryId: category.categoryId, ...payload },
        });
        toast.success("Kategori güncellendi.");
      } else {
        await createMutation.mutateAsync({ body: payload });
        toast.success("Kategori oluşturuldu.");
      }
      onOpenChange(false);
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error(
          isEdit
            ? "Kategori güncellenirken bir hata oluştu."
            : "Kategori oluşturulurken bir hata oluştu.",
        );
      }
    }
  };

  const showExistingImage = !selectedEmoji && isEdit && Boolean(imageUrl);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Kategoriyi Düzenle" : "Yeni Kategori Oluştur"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Kategori bilgilerini güncelleyin ve değişiklikleri kaydedin."
              : "Ürünlerinizi gruplamak için yeni bir kategori ekleyin. Bir emoji seçmeyi unutmayın."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-4">
            <FormInput
              type="text"
              name="categoryName"
              label="Kategori Adı"
              control={control}
              placeholder="Örn. Atıştırmalıklar"
              autoFocus
            />

            <Controller
              control={control}
              name="imageUrl"
              render={() => (
                <div className="flex flex-col gap-1.5">
                  <div className="flex items-center justify-between">
                    <span className="text-sm font-semibold text-foreground">
                      Emoji
                    </span>
                    {selectedEmoji && (
                      <button
                        type="button"
                        onClick={handleClearEmoji}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3" />
                        Seçimi temizle
                      </button>
                    )}
                  </div>
                  <CategoryEmojiPicker
                    query={categoryName}
                    selectedEmoji={selectedEmoji}
                    onSelect={handleSelectEmoji}
                  />
                  {showExistingImage && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <span className="relative size-6 overflow-hidden rounded-md border border-border bg-background">
                        <Image
                          src={imageUrl}
                          alt="Mevcut kategori görseli"
                          fill
                          sizes="24px"
                          unoptimized
                          className="object-contain"
                        />
                      </span>
                      <span>
                        Mevcut görsel korunuyor. Değiştirmek için yeni bir emoji
                        seçin.
                      </span>
                    </div>
                  )}
                  {formState.errors.imageUrl?.message && (
                    <p className="text-xs font-medium text-destructive">
                      {formState.errors.imageUrl.message}
                    </p>
                  )}
                </div>
              )}
            />
          </div>

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
                  : "Kategoriyi Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

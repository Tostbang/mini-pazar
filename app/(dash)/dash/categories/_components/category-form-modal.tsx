"use client";

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
import { CategoryIconPicker } from "./category-icon-picker";
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
    .min(1, "Lütfen bir icon seçin."),
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

  const [selectedIcon, setSelectedIcon] = useState<string | null>(null);

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
    setSelectedIcon(null);
  }, [open, category, reset]);

  const handleSelectIcon = (character: string) => {
    setSelectedIcon(character);
    setValue("imageUrl", character, {
      shouldValidate: true,
      shouldDirty: true,
    });
  };

  const handleClearIcon = () => {
    setSelectedIcon(null);
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

  // Whichever icon the form will save right now: the user's just-picked
  // emoji, or — in edit mode only — the existing category's icon when
  // the user hasn't picked a replacement. We show this in a chip so
  // the user has a clear "this is what I'll save" confirmation in
  // both add and edit flows.
  const currentIcon =
    selectedIcon ?? (isEdit && imageUrl ? imageUrl : null);
  const showIconPreview = Boolean(currentIcon);

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
              : "Ürünlerinizi gruplamak için yeni bir kategori ekleyin. Bir icon seçmeyi unutmayın."}
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
                      Icon
                    </span>
                    {selectedIcon && (
                      <button
                        type="button"
                        onClick={handleClearIcon}
                        className="inline-flex items-center gap-1 text-xs font-medium text-muted-foreground transition-colors hover:text-foreground"
                      >
                        <X className="size-3" />
                        Seçimi temizle
                      </button>
                    )}
                  </div>
                  <CategoryIconPicker
                    query={categoryName}
                    selectedIcon={selectedIcon}
                    onSelect={handleSelectIcon}
                  />
                  {showIconPreview && currentIcon && (
                    <div className="flex items-center gap-2 rounded-lg border border-dashed border-border bg-muted/40 px-3 py-2 text-xs text-muted-foreground">
                      <span className="grid size-7 place-items-center rounded-md border border-border bg-background text-lg">
                        {currentIcon}
                      </span>
                      <span>
                        {selectedIcon
                          ? "Şu anda seçili icon. Değiştirmek için listeden başka bir tane seçebilirsiniz."
                          : "Mevcut icon korunuyor. Değiştirmek için yeni bir icon seçin."}
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

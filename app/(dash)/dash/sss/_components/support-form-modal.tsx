"use client";

import { useEffect } from "react";
import { Controller, useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { Loader2, Save } from "lucide-react";
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
import { Switch } from "@/components/ui/switch";
import { Textarea } from "@/components/ui/textarea";
import {
  useCreateSupport,
  useUpdateSupport,
  type SupportListItem,
} from "../_services/queries";

const formSchema = z.object({
  category: z
    .string()
    .trim()
    .max(60, "Kategori en fazla 60 karakter olabilir."),
  question: z
    .string()
    .trim()
    .min(5, "Soru en az 5 karakter olmalıdır.")
    .max(200, "Soru en fazla 200 karakter olabilir."),
  answer: z
    .string()
    .trim()
    .min(5, "Cevap en az 5 karakter olmalıdır.")
    .max(2000, "Cevap en fazla 2000 karakter olabilir."),
  displayOrder: z
    .number({ message: "Sıra bir sayı olmalıdır." })
    .int("Sıra tam sayı olmalıdır.")
    .min(0, "Sıra 0'dan küçük olamaz."),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type Mode = "create" | "edit";

interface SupportFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  item?: SupportListItem | null;
}

export function SupportFormModal({
  open,
  onOpenChange,
  mode,
  item,
}: SupportFormModalProps) {
  const createMutation = useCreateSupport();
  const updateMutation = useUpdateSupport();

  const isEdit = mode === "edit";
  const isSubmitting = createMutation.isPending || updateMutation.isPending;

  const { control, handleSubmit, reset } = useForm<FormValues>({
    resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
    defaultValues: buildDefaults(null),
  });

  useEffect(() => {
    if (!open) return;
    reset(buildDefaults(item));
  }, [open, item, reset]);

  const onSubmit = async (data: FormValues) => {
    const payload = {
      category: data.category.trim() || null,
      question: data.question.trim(),
      answer: data.answer.trim(),
      displayOrder: data.displayOrder,
      isActive: data.isActive,
    };

    try {
      if (isEdit && item) {
        await updateMutation.mutateAsync({
          body: { supportId: item.supportId, ...payload },
        });
        toast.success("SSS kaydı güncellendi.");
      } else {
        await createMutation.mutateAsync({ body: payload });
        toast.success("SSS kaydı oluşturuldu.");
      }
      onOpenChange(false);
    } catch {
      toast.error(
        isEdit
          ? "SSS kaydı güncellenirken bir hata oluştu."
          : "SSS kaydı oluşturulurken bir hata oluştu.",
      );
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "SSS Kaydını Düzenle" : "Yeni SSS Kaydı"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Mevcut SSS kaydını güncelleyin."
              : "Müşterilerin sık sorduğu bir soru ve cevabı buradan ekleyin. Aktif kayıtlar mağaza vitrininde görüntülenir."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <div className="flex flex-col gap-4">
            <FormInput
              type="text"
              name="category"
              label="Kategori"
              control={control}
              placeholder="Örn. Sipariş, Kargo, Ödeme"
              hint="Boş bırakırsanız kategori olmadan listelenir."
            />

            <Controller
              control={control}
              name="question"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    Soru
                  </span>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Müşterinin sorduğu soruyu buraya yazın."
                    rows={2}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid &&
                    typeof fieldState.error?.message === "string" && (
                      <p
                        className="text-xs font-medium text-destructive"
                        role="alert"
                      >
                        {fieldState.error.message}
                      </p>
                    )}
                </div>
              )}
            />

            <Controller
              control={control}
              name="answer"
              render={({ field, fieldState }) => (
                <div className="flex flex-col gap-1.5">
                  <span className="text-sm font-semibold text-foreground">
                    Cevap
                  </span>
                  <Textarea
                    {...field}
                    value={field.value ?? ""}
                    placeholder="Sorunun cevabını buraya yazın."
                    rows={5}
                    aria-invalid={fieldState.invalid}
                  />
                  {fieldState.invalid &&
                    typeof fieldState.error?.message === "string" && (
                      <p
                        className="text-xs font-medium text-destructive"
                        role="alert"
                      >
                        {fieldState.error.message}
                      </p>
                    )}
                </div>
              )}
            />

            <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
              <Controller
                control={control}
                name="displayOrder"
                render={({ field, fieldState }) => (
                  <div className="flex flex-col gap-1.5">
                    <span className="text-sm font-semibold text-foreground">
                      Sıralama
                    </span>
                    <input
                      type="number"
                      inputMode="numeric"
                      min={0}
                      step={1}
                      value={Number.isFinite(field.value) ? field.value : 0}
                      onChange={(event) => {
                        const value = event.target.value;
                        field.onChange(value === "" ? 0 : parseInt(value, 10));
                      }}
                      aria-invalid={fieldState.invalid}
                      placeholder="0"
                      className="flex h-9 w-full rounded-md border border-input bg-transparent px-3 py-1 text-sm shadow-sm transition-colors placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring aria-invalid:border-destructive aria-invalid:ring-destructive/20"
                    />
                    <span className="text-xs text-muted-foreground">
                      Küçük sayı önce gösterilir.
                    </span>
                    {fieldState.invalid &&
                      typeof fieldState.error?.message === "string" && (
                        <p
                          className="text-xs font-medium text-destructive"
                          role="alert"
                        >
                          {fieldState.error.message}
                        </p>
                      )}
                  </div>
                )}
              />

              <Controller
                control={control}
                name="isActive"
                render={({ field }) => (
                  <label className="flex h-full cursor-pointer items-start justify-between gap-4 rounded-xl border border-border bg-card p-4">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm font-medium text-foreground">
                        Aktif
                      </span>
                      <span className="text-xs text-muted-foreground">
                        Mağaza vitrininde görünür.
                      </span>
                    </div>
                    <Switch
                      checked={field.value ?? false}
                      onCheckedChange={field.onChange}
                    />
                  </label>
                )}
              />
            </div>
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
                  : "Kaydı Oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function buildDefaults(item: SupportListItem | null | undefined): FormValues {
  return {
    category: item?.category ?? "",
    question: item?.question ?? "",
    answer: item?.answer ?? "",
    displayOrder: item?.displayOrder ?? 0,
    isActive: item?.isActive ?? true,
  };
}
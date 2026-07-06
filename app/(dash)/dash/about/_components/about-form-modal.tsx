"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";
import { useForm, type Resolver } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { z } from "zod";
import { ImagePlus, Loader2, Save, X } from "lucide-react";
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
import { MdxEditor } from "./mdx-editor";
import {
  useSaveAbout,
  useUploadImage,
  type AboutModel,
} from "../_services/queries";
import { cn } from "@/lib/utils";

const formSchema = z.object({
  title: z
    .string()
    .trim()
    .min(2, "Başlık en az 2 karakter olmalıdır.")
    .max(150, "Başlık en fazla 150 karakter olabilir."),
  description: z
    .string()
    .trim()
    .min(1, "Açıklama (MDX) zorunludur."),
  imageUrl: z.string().trim().optional(),
  isActive: z.boolean(),
});

type FormValues = z.infer<typeof formSchema>;

type Mode = "create" | "edit";

interface AboutFormModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  mode: Mode;
  about?: AboutModel | null;
}

export function AboutFormModal({
  open,
  onOpenChange,
  mode,
  about,
}: AboutFormModalProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const saveMutation = useSaveAbout();
  const uploadMutation = useUploadImage();

  const isEdit = mode === "edit";
  const isSubmitting =
    saveMutation.isPending || uploadMutation.isPending;

  const { control, handleSubmit, watch, setValue, reset, formState } =
    useForm<FormValues>({
      resolver: zodResolver(formSchema as never) as Resolver<FormValues>,
      defaultValues: {
        title: "",
        description: "",
        imageUrl: "",
        isActive: true,
      },
    });

  const imageUrl = watch("imageUrl") ?? "";
  const description = watch("description") ?? "";
  const isActive = watch("isActive");

  useEffect(() => {
    if (!open) return;
    reset({
      title: about?.title ?? "",
      description: about?.description ?? "",
      imageUrl: about?.imageUrl ?? "",
      isActive: true,
    });
  }, [open, about, reset]);

  const onSelectFile = () => fileInputRef.current?.click();

  const onFileChange = async (
    event: React.ChangeEvent<HTMLInputElement>,
  ) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }
    try {
      const response = await uploadMutation.mutateAsync({
        file,
        type: "about",
      });
      const url = response.fileUrl;
      if (!url) {
        toast.error("Görsel yüklendi fakat URL alınamadı.");
        return;
      }
      setValue("imageUrl", url, {
        shouldValidate: true,
        shouldDirty: true,
      });
      toast.success("Görsel yüklendi.");
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error("Görsel yüklenirken bir hata oluştu.");
      }
    }
  };

  const onSubmit = async (data: FormValues) => {
    const payload = {
      title: data.title.trim(),
      description: data.description.trim(),
      imageUrl: data.imageUrl?.trim() || null,
      isActive: data.isActive,
    };

    try {
      await saveMutation.mutateAsync({ body: payload });
      toast.success(
        isEdit
          ? "Hakkımızda içeriği güncellendi."
          : "Hakkımızda içeriği oluşturuldu.",
      );
      onOpenChange(false);
    } catch (error) {
      if (!(error instanceof Error)) {
        toast.error(
          isEdit
            ? "İçerik güncellenirken bir hata oluştu."
            : "İçerik oluşturulurken bir hata oluştu.",
        );
      }
    }
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] overflow-y-auto sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle>
            {isEdit ? "Hakkımızda içeriğini düzenle" : "Yeni hakkımızda içeriği"}
          </DialogTitle>
          <DialogDescription>
            {isEdit
              ? "Başlık, açıklama ve isteğe bağlı görseli güncelleyin."
              : "Hakkımızda bölümü için başlık ve MDX ile zenginleştirilmiş açıklama yazın. Görsel isteğe bağlıdır."}
          </DialogDescription>
        </DialogHeader>

        <form
          onSubmit={handleSubmit(onSubmit)}
          className="flex flex-col gap-5"
        >
          <FormInput
            type="text"
            name="title"
            label="Başlık"
            control={control}
            placeholder="Örn. Hikayemiz"
            autoFocus
          />

          <div className="grid gap-5 sm:grid-cols-[200px_1fr] sm:items-start">
            <ImagePicker
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

            <label className="inline-flex cursor-pointer select-none items-center gap-3 text-sm font-medium text-foreground">
              <Switch
                checked={isActive}
                onCheckedChange={(value) =>
                  setValue("isActive", value, { shouldDirty: true })
                }
              />
              Yayında
            </label>
          </div>

          <div className="flex flex-col gap-1.5">
            <label
              htmlFor="about-description"
              className="text-sm font-semibold text-foreground"
            >
              Açıklama (MDX)
            </label>
            <MdxEditor
              id="about-description"
              value={description}
              onChange={(value) =>
                setValue("description", value, {
                  shouldValidate: true,
                  shouldDirty: true,
                })
              }
            />
            {formState.errors.description?.message && (
              <p className="text-xs font-medium text-destructive">
                {formState.errors.description.message}
              </p>
            )}
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
                  : "İçeriği oluştur"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ImagePicker({
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
    "aria-label": imageUrl ? "Görseli değiştir" : "Görsel yükle",
  };

  return (
    <div className="flex flex-col gap-1.5">
      <span className="text-sm font-semibold text-foreground">
        Görsel <span className="font-normal text-muted-foreground">(opsiyonel)</span>
      </span>
      <div
        {...triggerProps}
        className={cn(
          "group relative grid aspect-square w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed bg-muted/40 text-center text-xs text-muted-foreground outline-none transition-colors hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
          uploading && "cursor-wait opacity-70",
          error ? "border-destructive" : "border-border hover:border-foreground/30",
        )}
      >
        {uploading ? (
          <div className="flex flex-col items-center gap-1.5">
            <Loader2 className="size-5 animate-spin text-foreground" />
            <span className="text-[11px] font-medium text-foreground">
              Yükleniyor...
            </span>
          </div>
        ) : imageUrl ? (
          <>
            <Image
              src={imageUrl}
              alt="Hakkımızda görseli"
              fill
              sizes="200px"
              unoptimized
              className="object-cover"
            />
            <div className="pointer-events-none absolute inset-0 flex items-center justify-center bg-foreground/40 opacity-0 transition-opacity group-hover:opacity-100">
              <div className="flex items-center gap-1.5 rounded-full bg-background/95 px-3 py-1.5 text-[11px] font-semibold text-foreground shadow-sm">
                <ImagePlus className="size-3.5" />
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

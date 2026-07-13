"use client";

import { useRef } from "react";
import Image from "next/image";
import { ImagePlus, Loader2, Upload, X } from "lucide-react";
import { toast } from "sonner";
import { Skeleton } from "@/components/ui/skeleton";
import { cn } from "@/lib/utils";
import { resolveImageUrl } from "@/lib/image-url";
import { useUploadImage } from "@/lib/upload";

interface ImageUploadFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  type: string;
  aspect?: "square" | "wide";
  /**
   * Preview-container size. `default` fills the parent width; `sm` constrains
   * the preview to ~60px so small icons (city advantages, etc.) don't
   * dominate the form.
   */
  size?: "default" | "sm";
  className?: string;
}

export function ImageUploadField({
  label,
  description,
  value,
  onChange,
  type,
  aspect = "square",
  size = "default",
  className,
}: ImageUploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement | null>(null);
  const uploadMutation = useUploadImage();

  const onSelectFile = () => fileInputRef.current?.click();

  const onFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = "";
    if (!file) return;
    if (!file.type.startsWith("image/")) {
      toast.error("Lütfen geçerli bir görsel dosyası seçin.");
      return;
    }
    try {
      const response = await uploadMutation.mutateAsync({ file, type });
      const url = response.fileUrl;
      if (!url) {
        toast.error("Görsel yüklendi fakat URL alınamadı.");
        return;
      }
      onChange(url);
      toast.success("Görsel yüklendi.");
    } catch (error) {
      const message =
        error instanceof Error
          ? error.message
          : "Görsel yüklenirken bir hata oluştu.";
      toast.error(message);
    }
  };

  const uploading = uploadMutation.isPending;

  // API can return relative paths like "/defaults/mainCard.png" — the
  // storefront's `resolveImageUrl` prepends the API origin so the image
  // loads from the backend's CDN instead of the Next.js dev origin. We
  // keep `value` itself untouched so the form round-trips whatever the
  // API sent (relative paths included).
  const displayUrl = resolveImageUrl(value);

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <span className="text-sm font-medium text-foreground">{label}</span>
      <div
        role="button"
        tabIndex={uploading ? -1 : 0}
        onClick={uploading ? undefined : onSelectFile}
        onKeyDown={
          uploading
            ? undefined
            : (event) => {
                if (event.key === "Enter" || event.key === " ") {
                  event.preventDefault();
                  onSelectFile();
                }
              }
        }
        aria-label={value ? `${label} değiştir` : `${label} yükle`}
        className={cn(
          "group relative grid w-full cursor-pointer place-items-center overflow-hidden rounded-2xl border border-dashed border-border bg-muted/40 text-center text-xs text-muted-foreground outline-none transition-colors hover:border-foreground/30 hover:bg-muted focus-visible:ring-2 focus-visible:ring-ring/40",
          aspect === "square" ? "aspect-square" : "aspect-[3/1]",
          size === "sm" && "w-[60px] shrink-0",
          uploading && "cursor-wait opacity-70",
        )}
      >
        {uploading ? (
          <>
            <Skeleton className="absolute inset-0 size-full rounded-2xl" />
            <div className="relative z-10 flex flex-col items-center gap-1.5">
              <Loader2 className="size-5 animate-spin text-foreground" />
              <span className="text-[11px] font-medium text-foreground">
                Yükleniyor...
              </span>
            </div>
          </>
        ) : displayUrl ? (
          <>
            <Image
              src={displayUrl}
              alt={label}
              fill
              sizes={aspect === "square" ? (size === "sm" ? "60px" : "180px") : "360px"}
              className="object-contain p-3"
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
                onChange("");
              }}
              aria-label="Görseli kaldır"
              className="absolute right-2 top-2 z-10 grid size-7 place-items-center rounded-full bg-background/90 text-foreground shadow-sm ring-1 ring-foreground/10 transition-colors hover:bg-destructive hover:text-destructive-foreground focus-visible:ring-2 focus-visible:ring-ring/40"
            >
              <X className="size-3.5" />
            </button>
          </>
        ) : (
          <div
            className={cn(
              "flex flex-col items-center justify-center text-center",
              size === "sm" ? "gap-0 p-1" : "gap-1.5 px-3 py-6",
            )}
          >
            <ImagePlus
              className={cn(
                "text-muted-foreground/70",
                size === "sm" ? "size-4" : "size-6",
              )}
            />
            {size !== "sm" && (
              <>
                <span className="font-medium">Görsel yüklemek için tıklayın</span>
                <span className="text-[11px] text-muted-foreground/70">
                  PNG, JPG, WEBP, SVG
                </span>
              </>
            )}
          </div>
        )}
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/*"
        hidden
        onChange={onFileChange}
      />
    </div>
  );
}
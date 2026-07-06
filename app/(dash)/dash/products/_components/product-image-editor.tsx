"use client";

import { useCallback, useEffect, useRef, useState } from "react";
import Cropper, { type Area } from "react-easy-crop";
import { useBackgroundRemoval } from "../_hooks/use-background-removal";
import {
  Check,
  Crop as CropIcon,
  Eraser,
  Loader2,
  RefreshCcw,
  Scissors,
  Sun,
  Wand2,
  X,
} from "lucide-react";
import { toast } from "sonner";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { cn } from "@/lib/utils";

type Stage = "preview" | "cropping" | "processing";

export type ProductImageEditorProps = {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  file: File | null;
  onConfirm: (file: File) => void;
};

const MAX_DIMENSION = 1280;
const CROP_ASPECT = 1;
// Shadow rendering parameters tuned to look like a soft, professional product
// photo. CSS preview uses similar values so what you see matches what gets
// baked into the exported PNG.
const SHADOW_PAD = 40;
const SHADOW_BLUR = 32;
const SHADOW_OFFSET_Y = 16;
const SHADOW_COLOR = "rgba(0, 0, 0, 0.35)";

async function resizeIfNeeded(
  blob: Blob,
  maxDimension = MAX_DIMENSION,
): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const { width, height } = bitmap;
  if (width <= maxDimension && height <= maxDimension) {
    return blob;
  }
  const scale = Math.min(maxDimension / width, maxDimension / height);
  const targetWidth = Math.round(width * scale);
  const targetHeight = Math.round(height * scale);
  const canvas = document.createElement("canvas");
  canvas.width = targetWidth;
  canvas.height = targetHeight;
  const ctx = canvas.getContext("2d");
  if (!ctx) return blob;
  ctx.drawImage(bitmap, 0, 0, targetWidth, targetHeight);
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Görsel dönüştürülemedi."));
      },
      "image/png",
      0.95,
    );
  });
}

async function applyCrop(sourceUrl: string, area: Area): Promise<Blob> {
  const image = new Image();
  image.src = sourceUrl;
  await new Promise<void>((resolve, reject) => {
    image.onload = () => resolve();
    image.onerror = () => reject(new Error("Görsel yüklenemedi."));
  });

  const canvas = document.createElement("canvas");
  canvas.width = Math.round(area.width);
  canvas.height = Math.round(area.height);
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas bağlamı oluşturulamadı.");
  ctx.drawImage(
    image,
    Math.round(area.x),
    Math.round(area.y),
    Math.round(area.width),
    Math.round(area.height),
    0,
    0,
    Math.round(area.width),
    Math.round(area.height),
  );
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Kırpılmış görsel oluşturulamadı."));
      },
      "image/png",
      0.95,
    );
  });
}

// Bakes a soft drop-shadow into a transparent PNG by drawing it on a canvas
// with shadow* properties. The canvas is padded so the shadow has room to
// spread and isn't clipped at the edges. Result dimensions are slightly
// larger than the input — handled by the resize step that follows.
async function applyShadow(blob: Blob): Promise<Blob> {
  const bitmap = await createImageBitmap(blob);
  const canvas = document.createElement("canvas");
  canvas.width = bitmap.width + SHADOW_PAD * 2;
  canvas.height = bitmap.height + SHADOW_PAD * 2;
  const ctx = canvas.getContext("2d");
  if (!ctx) throw new Error("Canvas bağlamı oluşturulamadı.");
  ctx.shadowColor = SHADOW_COLOR;
  ctx.shadowBlur = SHADOW_BLUR;
  ctx.shadowOffsetX = 0;
  ctx.shadowOffsetY = SHADOW_OFFSET_Y;
  ctx.drawImage(bitmap, SHADOW_PAD, SHADOW_PAD);
  bitmap.close();
  return new Promise<Blob>((resolve, reject) => {
    canvas.toBlob(
      (result) => {
        if (result) resolve(result);
        else reject(new Error("Gölgeli görsel oluşturulamadı."));
      },
      "image/png",
      0.95,
    );
  });
}

function blobToFile(blob: Blob, originalName: string): File {
  const baseName = originalName.replace(/\.[^.]+$/, "");
  return new File([blob], `${baseName}-edited.png`, {
    type: "image/png",
    lastModified: Date.now(),
  });
}

export function ProductImageEditor({
  open,
  onOpenChange,
  file,
  onConfirm,
}: ProductImageEditorProps) {
  const [stage, setStage] = useState<Stage>("preview");
  const [removeBg, setRemoveBg] = useState(true);
  const [addShadow, setAddShadow] = useState(true);
  const [processedUrl, setProcessedUrl] = useState<string | null>(null);
  const [progressLabel, setProgressLabel] = useState<string | null>(null);
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);
  const previewUrlRef = useRef<string | null>(null);
  const processedUrlRef = useRef<string | null>(null);
  const processingRef = useRef(false);
  const { removeBackground, cancel } = useBackgroundRemoval();
  // Bumped whenever a new background-removal run starts or the user toggles
  // it off mid-run. Lets an in-flight promise detect it has been superseded
  // and discard its result instead of overwriting the current preview.
  const runIdRef = useRef(0);

  useEffect(() => {
    if (!open || !file) {
      setStage("preview");
      setRemoveBg(true);
      setAddShadow(true);
      setCroppedAreaPixels(null);
      setCrop({ x: 0, y: 0 });
      setZoom(1);
      setProgressLabel(null);
      return;
    }
    if (processedUrlRef.current) {
      URL.revokeObjectURL(processedUrlRef.current);
      processedUrlRef.current = null;
    }
    setProcessedUrl(null);
    const url = URL.createObjectURL(file);
    previewUrlRef.current = url;
    return () => {
      URL.revokeObjectURL(url);
      previewUrlRef.current = null;
    };
  }, [open, file]);

  const onCropComplete = useCallback((_area: Area, areaPixels: Area) => {
    setCroppedAreaPixels(areaPixels);
  }, []);

  const runBackgroundRemoval = useCallback(async () => {
    if (!file || processingRef.current) return;
    processingRef.current = true;
    const runId = ++runIdRef.current;
    setStage("processing");
    setProgressLabel("Model hazırlanıyor…");
    try {
      const resized = await resizeIfNeeded(file);
      if (runIdRef.current !== runId) return;
      setProgressLabel("Arka plan kaldırılıyor…");
      const result = await removeBackground(resized, {
        runId,
        onProgress: ({ key, current, total }) => {
          if (runIdRef.current !== runId) return;
          if (key === "compute:download") {
            setProgressLabel("Model indiriliyor…");
          } else if (key === "compute:inference") {
            setProgressLabel(
              `Arka plan kaldırılıyor (${Math.round((current / total) * 100)}%)`,
            );
          }
        },
      });
      // If the user toggled off (or started a new run) while we were
      // working, discard this result so the UI stays consistent.
      if (runIdRef.current !== runId) return;
      const url = URL.createObjectURL(result);
      processedUrlRef.current = url;
      setProcessedUrl(url);
      setProgressLabel(null);
      setStage("preview");
    } catch (error) {
      if (runIdRef.current !== runId) return;
      console.warn("[image-editor] background removal failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Arka plan kaldırılamadı. Orijinal görsel kullanılacak.",
      );
      setRemoveBg(false);
      setStage("preview");
      setProgressLabel(null);
    } finally {
      if (runIdRef.current === runId) {
        processingRef.current = false;
      }
    }
  }, [file, removeBackground]);

  // Auto-trigger background removal whenever it's enabled and we don't have
  // a processed preview yet. Safe because the model is preloaded on
  // dashboard mount and the dialog's Cancel/X stay interactive during the
  // run — the user can always back out.
  useEffect(() => {
    if (!open || !file || !removeBg || stage !== "preview" || processedUrl) {
      return;
    }
    void runBackgroundRemoval();
  }, [open, file, removeBg, stage, processedUrl, runBackgroundRemoval]);

  const handleRemoveBgChange = (next: boolean) => {
    setRemoveBg(next);
    if (next) {
      void runBackgroundRemoval();
    } else {
      // Bumping the run id invalidates any in-flight run so its result is
      // discarded. The next time the user flips the switch on, runBackgroundRemoval
      // will start fresh.
      runIdRef.current += 1;
      processingRef.current = false;
      cancel();
      if (processedUrlRef.current) {
        URL.revokeObjectURL(processedUrlRef.current);
        processedUrlRef.current = null;
      }
      setProcessedUrl(null);
      setProgressLabel(null);
      setStage("preview");
    }
  };

  const handleConfirm = async () => {
    if (!file) return;
    setStage("processing");
    setProgressLabel("Görsel hazırlanıyor…");
    try {
      // Crop from whatever preview the user is currently looking at, so that
      // cropping a background-removed preview applies to the cutout, not the
      // original.
      const cropSourceUrl = processedUrl ?? previewUrlRef.current;
      let workingBlob: Blob = file;
      if (croppedAreaPixels && cropSourceUrl) {
        setProgressLabel("Kırpma uygulanıyor…");
        workingBlob = await applyCrop(cropSourceUrl, croppedAreaPixels);
      } else if (removeBg && processedUrl) {
        setProgressLabel("Arka plan kaldırılıyor…");
        const fetched = await fetch(processedUrl);
        workingBlob = await fetched.blob();
      }
      setProgressLabel("Boyutlandırılıyor…");
      let finalBlob = await resizeIfNeeded(workingBlob);
      if (addShadow) {
        setProgressLabel("Gölge ekleniyor…");
        finalBlob = await applyShadow(finalBlob);
        // Shadow baking expands the canvas beyond the source dimensions, so
        // run the final resize again to honour the 1280px cap.
        finalBlob = await resizeIfNeeded(finalBlob);
      }
      const finalFile = blobToFile(finalBlob, file.name);
      onConfirm(finalFile);
      handleClose();
    } catch (error) {
      console.warn("[image-editor] confirm failed", error);
      toast.error(
        error instanceof Error
          ? error.message
          : "Görsel işlenemedi. Lütfen tekrar deneyin.",
      );
      setStage("preview");
      setProgressLabel(null);
    }
  };

  const handleClose = () => {
    onOpenChange(false);
  };

  const handleReset = () => {
    setRemoveBg(true);
    setAddShadow(true);
    setCroppedAreaPixels(null);
    setCrop({ x: 0, y: 0 });
    setZoom(1);
    setStage("preview");
  };

  if (!file) return null;

  const previewUrl = processedUrl ?? previewUrlRef.current;
  const isProcessing = stage === "processing";
  const isCropping = stage === "cropping";

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-h-[92vh] !max-w-[600px] overflow-hidden p-0 sm:p-0">
        <DialogHeader className="border-b border-border px-6 py-4">
          <div className="flex items-center justify-between gap-3">
            <div>
              <DialogTitle className="flex items-center gap-2">
                <Wand2 className="size-4 text-brand" />
                Görsel Düzenleyici
              </DialogTitle>
              <DialogDescription>
                Arka plan kaldırma ve gölge varsayılan olarak açıktır. Kare
                (1:1) oranında kırpın, isterseniz seçenekleri kapatın.
              </DialogDescription>
            </div>
            <button
              type="button"
              onClick={handleClose}
              className="grid size-8 place-items-center rounded-full text-muted-foreground transition-colors hover:bg-muted hover:text-foreground"
              aria-label="Kapat"
            >
              <X className="size-4" />
            </button>
          </div>
        </DialogHeader>

        <div className="grid gap-0 sm:grid-cols-[1fr_280px]">
          <div
            className={cn(
              "relative grid min-h-[420px] place-items-center overflow-hidden bg-muted/60",
              "bg-[conic-gradient(at_50%_50%,theme(colors.muted)_25%,transparent_0,transparent_50%,theme(colors.muted)_0,theme(colors.muted)_75%,transparent_0)]",
              "bg-[length:24px_24px]",
            )}
          >
            {isProcessing ? (
              <ProcessingState label={progressLabel} />
            ) : previewUrl ? (
              isCropping ? (
                <div className="relative size-full">
                  <Cropper
                    image={previewUrl}
                    crop={crop}
                    zoom={zoom}
                    aspect={CROP_ASPECT}
                    onCropChange={setCrop}
                    onZoomChange={setZoom}
                    onCropComplete={onCropComplete}
                    showGrid
                    style={{
                      containerStyle: {
                        background: "transparent",
                      },
                    }}
                  />
                </div>
              ) : (
                <div className="relative grid size-full place-items-center p-6">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={previewUrl}
                    alt={file.name}
                    className="max-h-[400px] max-w-full rounded-xl object-contain shadow-md"
                    style={
                      addShadow
                        ? {
                            filter:
                              "drop-shadow(0 12px 24px rgba(0, 0, 0, 0.35))",
                          }
                        : undefined
                    }
                  />
                </div>
              )
            ) : null}
          </div>

          <aside className="flex flex-col gap-3 border-l border-border bg-card p-4">
            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-lg",
                    removeBg
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Eraser className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Arka planı kaldır
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Şeffaf arka plan
                  </p>
                </div>
              </div>
              <Switch
                checked={removeBg}
                onCheckedChange={handleRemoveBgChange}
                disabled={isProcessing}
              />
            </div>

            <div className="flex items-center justify-between gap-3 rounded-xl border border-border p-3">
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-lg",
                    addShadow
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <Sun className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Gölge ekle
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Profesyonel ürün fotoğrafı
                  </p>
                </div>
              </div>
              <Switch
                checked={addShadow}
                onCheckedChange={setAddShadow}
                disabled={isProcessing}
              />
            </div>

            <button
              type="button"
              onClick={() => setStage(isCropping ? "preview" : "cropping")}
              disabled={isProcessing}
              className={cn(
                "flex items-center justify-between gap-3 rounded-xl border p-3 text-left transition-colors",
                isCropping
                  ? "border-brand bg-brand/5"
                  : "border-border hover:border-brand/40",
              )}
            >
              <div className="flex items-center gap-3">
                <span
                  className={cn(
                    "grid size-9 place-items-center rounded-lg",
                    isCropping
                      ? "bg-brand text-brand-foreground"
                      : "bg-muted text-muted-foreground",
                  )}
                >
                  <CropIcon className="size-4" />
                </span>
                <div>
                  <p className="text-sm font-semibold text-foreground">
                    Kırp
                  </p>
                  <p className="text-[11px] text-muted-foreground">
                    Kare (1:1) en-boy oranı
                  </p>
                </div>
              </div>
              {isCropping ? (
                <Check className="size-4 text-brand" />
              ) : (
                <Scissors className="size-4 text-muted-foreground" />
              )}
            </button>

            <button
              type="button"
              onClick={handleReset}
              disabled={isProcessing}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-border bg-background px-3 py-2 text-xs font-semibold text-muted-foreground transition-colors hover:border-foreground/30 hover:text-foreground disabled:opacity-50"
            >
              <RefreshCcw className="size-3.5" />
              Sıfırla
            </button>

            <div className="mt-auto rounded-xl bg-muted/40 p-3 text-[11px] leading-relaxed text-muted-foreground">
              <p className="font-semibold text-foreground">Tasarıma uygun</p>
              <p className="mt-1">
                Tüm ürün görselleri kare (1:1) ve 1280px sınırında olacak
                şekilde otomatik olarak hazırlanır.
              </p>
            </div>
          </aside>
        </div>

        <DialogFooter className="flex-row items-center justify-between gap-3 border-t border-border bg-muted/30 px-6 py-4">
          <p className="text-[11px] text-muted-foreground">
            {file.name} • {Math.round(file.size / 1024)} KB
          </p>
          <div className="flex items-center gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={handleClose}
              disabled={isProcessing}
            >
              İptal
            </Button>
            <Button
              type="button"
              onClick={handleConfirm}
              disabled={isProcessing}
            >
              {isProcessing ? (
                <>
                  <Loader2 className="size-4 animate-spin" />
                  İşleniyor…
                </>
              ) : (
                <>
                  <Check className="size-4" />
                  Uygula ve yükle
                </>
              )}
            </Button>
          </div>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}

function ProcessingState({ label }: { label: string | null }) {
  return (
    <div className="flex flex-col items-center gap-3 text-center">
      <Loader2 className="size-10 animate-spin text-brand" />
      <p className="text-sm font-semibold text-foreground">
        {label ?? "İşleniyor…"}
      </p>
      <p className="max-w-xs text-xs text-muted-foreground">
        Bu işlem görselin boyutuna bağlı olarak birkaç saniye sürebilir.
      </p>
    </div>
  );
}

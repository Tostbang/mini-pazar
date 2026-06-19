"use client";

import { useEffect, useState } from "react";
import { MDXRemote, type MDXRemoteSerializeResult } from "next-mdx-remote";
import { AlertTriangle, Eye, Loader2 } from "lucide-react";
import { compileMdxAction } from "../_actions/compile-mdx";
import { mdxComponents } from "@/lib/mdx-components";

type MdxPreviewProps = {
  source: string;
};

export function MdxPreview({ source }: MdxPreviewProps) {
  const [result, setResult] = useState<MDXRemoteSerializeResult | null>(
    null,
  );
  const [error, setError] = useState<string | null>(null);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    const trimmed = source.trim();
    if (!trimmed) {
      setResult(null);
      setError(null);
      setIsLoading(false);
      return;
    }

    let cancelled = false;
    setIsLoading(true);

    const handle = window.setTimeout(() => {
      compileMdxAction(trimmed)
        .then((res) => {
          if (cancelled) return;
          if (res && "error" in res) {
            setError(res.error);
            setResult(null);
          } else if (res) {
            setResult(res);
            setError(null);
          } else {
            setResult(null);
            setError(null);
          }
        })
        .catch((err: unknown) => {
          if (cancelled) return;
          setError(
            err instanceof Error
              ? err.message
              : "MDX önizlemesi oluşturulamadı.",
          );
        })
        .finally(() => {
          if (cancelled) return;
          setIsLoading(false);
        });
    }, 350);

    return () => {
      cancelled = true;
      window.clearTimeout(handle);
    };
  }, [source]);

  if (!source.trim()) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-muted text-muted-foreground">
          <Eye className="size-4" />
        </span>
        <p className="text-sm font-medium text-foreground">
          Henüz içerik yok
        </p>
        <p className="max-w-xs text-xs text-muted-foreground">
          Sol taraftaki editöre MDX yazmaya başlayın. Sonuç burada canlı
          olarak görünecek.
        </p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-10 text-center">
        <span className="grid size-10 place-items-center rounded-full bg-destructive/10 text-destructive">
          <AlertTriangle className="size-4" />
        </span>
        <p className="text-sm font-medium text-destructive">
          MDX derlenemedi
        </p>
        <p className="max-w-md text-xs text-muted-foreground">{error}</p>
      </div>
    );
  }

  if (!result) {
    return (
      <div className="flex h-full flex-col items-center justify-center gap-2 px-6 py-12 text-center">
        <Loader2 className="size-4 animate-spin text-muted-foreground" />
        <p className="text-xs text-muted-foreground">Önizleme hazırlanıyor…</p>
      </div>
    );
  }

  return (
    <div
      className={
        isLoading
          ? "pointer-events-none opacity-70 transition-opacity"
          : "transition-opacity"
      }
    >
      <MDXRemote {...result} components={mdxComponents} />
    </div>
  );
}

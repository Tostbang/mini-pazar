"use client";

import { useEffect, useState } from "react";
import { Eye, FileText, PencilLine } from "lucide-react";
import { MdxPreview } from "./mdx-preview";

const STARTER_TEMPLATE = `## Bölüm başlığı

Bu alana **kalın**, *italik* ve [bağlantı](https://example.com) yazabilirsiniz.

CTA örnekleri: [Ücretsiz Başla](/register) · [Örnek Mağazalar](/)

- Sıralı olmayan liste öğesi
- Bir diğer öğe

> Alıntı bloğu örneği.

![Görsel açıklaması](https://example.com/image.jpg)
`;

export type MdxEditorProps = {
  value: string;
  onChange: (value: string) => void;
  minRows?: number;
  placeholder?: string;
  id?: string;
};

export function MdxEditor({
  value,
  onChange,
  minRows = 14,
  placeholder = STARTER_TEMPLATE,
  id,
}: MdxEditorProps) {
  const [activeView, setActiveView] = useState<"edit" | "preview">("edit");

  useEffect(() => {
    if (!id) return;
    if (value && value.length > 0) return;
  }, [id, value]);

  return (
    <div className="flex flex-col gap-2 rounded-2xl border border-border bg-card">
      <div className="flex items-center justify-between gap-2 border-b border-border px-3 py-2">
        <div className="flex items-center gap-1 rounded-full bg-muted/60 p-0.5 text-xs">
          <button
            type="button"
            onClick={() => setActiveView("edit")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition ${
              activeView === "edit"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <PencilLine className="size-3.5" />
            Düzenle
          </button>
          <button
            type="button"
            onClick={() => setActiveView("preview")}
            className={`inline-flex items-center gap-1.5 rounded-full px-3 py-1.5 font-semibold transition ${
              activeView === "preview"
                ? "bg-foreground text-background shadow-sm"
                : "text-muted-foreground hover:text-foreground"
            }`}
          >
            <Eye className="size-3.5" />
            Önizleme
          </button>
        </div>

        <p className="hidden text-[11px] text-muted-foreground sm:block">
          MDX: başlık, paragraf, görsel, liste, alıntı, kod, tablo…
        </p>
      </div>

      <div className="grid gap-0 md:grid-cols-2">
        <div
          className={`${
            activeView === "edit" ? "block" : "hidden"
          } md:block`}
        >
          <label className="sr-only" htmlFor={id}>
            MDX içerik
          </label>
          <textarea
            id={id}
            value={value}
            onChange={(event) => onChange(event.target.value)}
            placeholder={placeholder}
            rows={minRows}
            spellCheck={false}
            className="h-full min-h-[280px] w-full resize-y bg-transparent px-4 py-3 font-mono text-sm leading-relaxed text-foreground placeholder:text-muted-foreground/60 focus:outline-none md:border-r md:border-border"
          />
        </div>

        <div
          className={`${
            activeView === "preview" ? "block" : "hidden"
          } md:block`}
        >
          <div className="min-h-[280px] overflow-y-auto bg-muted/30 px-5 py-4 md:max-h-[480px]">
            <MdxPreview source={value} />
          </div>
        </div>
      </div>

      <div className="flex items-center justify-between border-t border-border bg-muted/30 px-3 py-1.5 text-[11px] text-muted-foreground">
        <span className="inline-flex items-center gap-1">
          <FileText className="size-3" />
          {value.length} karakter
        </span>
        <span className="hidden sm:inline">
          Görsel:{" "}
          <code className="rounded bg-background px-1 py-0.5 text-foreground">
            ![alt](url)
          </code>{" "}
          · Başlık:{" "}
          <code className="rounded bg-background px-1 py-0.5 text-foreground">
            ##
          </code>
        </span>
      </div>
    </div>
  );
}

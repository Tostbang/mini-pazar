"use client";

import { useEffect, useId, useRef, useState } from "react";
import { Input } from "@/components/ui/input";
import { cn } from "@/lib/utils";

interface ColorFieldProps {
  label: string;
  description?: string;
  value: string;
  onChange: (value: string) => void;
  className?: string;
  placeholder?: string;
}

const HEX_REGEX = /^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$/;

function normalizeHex(value: string): string {
  const trimmed = value.trim();
  if (!trimmed) return "#000000";
  if (trimmed.startsWith("#")) return trimmed;
  return `#${trimmed}`;
}

export function ColorField({
  label,
  description,
  value,
  onChange,
  className,
  placeholder = "#000000",
}: ColorFieldProps) {
  const id = useId();
  const colorRef = useRef<HTMLInputElement | null>(null);
  const [draft, setDraft] = useState(value || "");

  useEffect(() => {
    setDraft(value || "");
  }, [value]);

  const safeValue = HEX_REGEX.test(draft) ? normalizeHex(draft) : "#000000";

  return (
    <div className={cn("flex flex-col gap-1.5", className)}>
      <label htmlFor={id} className="text-sm font-medium text-foreground">
        {label}
      </label>
      <div className="flex items-stretch gap-2">
        <button
          type="button"
          onClick={() => colorRef.current?.click()}
          className="relative size-9 shrink-0 overflow-hidden rounded-lg border border-border outline-none transition-shadow focus-visible:ring-2 focus-visible:ring-ring/40"
          style={{ backgroundColor: safeValue }}
          aria-label={`${label} renk seçici`}
        >
          <input
            ref={colorRef}
            type="color"
            value={safeValue}
            onChange={(event) => {
              const next = event.target.value;
              setDraft(next);
              onChange(next);
            }}
            className="absolute inset-0 size-full cursor-pointer opacity-0"
            tabIndex={-1}
          />
        </button>
        <Input
          id={id}
          type="text"
          value={draft}
          onChange={(event) => {
            const next = event.target.value;
            setDraft(next);
            if (HEX_REGEX.test(next)) {
              onChange(normalizeHex(next));
            } else if (next === "") {
              onChange("");
            }
          }}
          onBlur={() => {
            if (draft && !HEX_REGEX.test(draft)) {
              setDraft(value || "");
            }
          }}
          placeholder={placeholder}
          spellCheck={false}
          className="font-mono uppercase"
        />
      </div>
      {description && (
        <p className="text-xs text-muted-foreground">{description}</p>
      )}
    </div>
  );
}
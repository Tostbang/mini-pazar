"use client";

import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

/**
 * Fetches an SVG from a remote URL, inlines it into the DOM, and rewrites
 * paint colors to `currentColor` so a parent CSS `color` (e.g. `text-lime`)
 * cascades into the artwork.
 *
 * Why not <img src> or next/image? Both render the SVG as an external
 * resource — the browser keeps the SVG in its own document, so inherited
 * `color` from the host page does NOT reach into the SVG. Inlining the
 * markup (via dangerouslySetInnerHTML) is what makes `currentColor`
 * resolve against the parent.
 *
 * Caching: react-query keys on the URL and the response is treated as
 * immutable (staleTime: Infinity) — SVGs are static assets so we never
 * want to refetch them. The shared QueryClient persists across layouts,
 * so a card rendered on the storefront reuses the dashboard's fetch.
 */
export function RemoteSvg({
  src,
  className,
  ariaLabel,
}: {
  src: string;
  className?: string;
  ariaLabel?: string;
}) {
  const query = useQuery({
    queryKey: ["remote-svg", src] as const,
    queryFn: async () => {
      const res = await fetch(src);
      if (!res.ok) {
        throw new Error(`SVG fetch failed: ${res.status}`);
      }
      return res.text();
    },
    staleTime: Infinity,
    gcTime: 1000 * 60 * 60 * 24,
  });

  const markup = useMemo(() => {
    if (!query.data) return null;
    return recolorSvg(query.data);
  }, [query.data]);

  if (!markup) return null;

  return (
    <div
      className={className}
      role={ariaLabel ? "img" : undefined}
      aria-label={ariaLabel}
      aria-hidden={ariaLabel ? undefined : true}
      dangerouslySetInnerHTML={{ __html: markup }}
    />
  );
}

/**
 * Replace hardcoded fill/stroke with `currentColor` so a parent `text-*`
 * class drives the color. We rewrite:
 *   - the `fill` / `stroke` attributes
 *   - the equivalent CSS properties inside `style="..."`
 *
 * We skip:
 *   - `fill="none"` / `stroke="none"` (intentional transparency)
 *   - `url(#id)` references (gradients/patterns — leave them alone)
 *   - values that are already `currentColor`
 *
 * Width/height are stripped so the host element can size the SVG via
 * CSS (the parent already controls size with Tailwind utilities).
 */
function recolorSvg(svg: string): string {
  if (typeof DOMParser === "undefined") return svg;
  const doc = new DOMParser().parseFromString(svg, "image/svg+xml");
  const root = doc.querySelector("svg");
  if (!root) return svg;

  root.removeAttribute("width");
  root.removeAttribute("height");

  root.querySelectorAll("*").forEach((el) => {
    repaintAttr(el, "fill");
    repaintAttr(el, "stroke");
    repaintStyle(el);
  });

  return root.outerHTML;
}

function repaintAttr(el: Element, name: string) {
  const value = el.getAttribute(name);
  if (!value) return;
  if (value === "none" || value.startsWith("url(") || value === "currentColor") return;
  el.setAttribute(name, "currentColor");
}

function repaintStyle(el: Element) {
  const style = el.getAttribute("style");
  if (!style) return;
  // Only touch the simple `prop: value;` declarations. Anything more
  // exotic (var(), calc(), etc.) is left alone.
  const rewritten = style.replace(
    /(fill|stroke)\s*:\s*([^;]+)/gi,
    (_match, prop: string, value: string) => {
      const trimmed = value.trim();
      if (
        trimmed === "none" ||
        trimmed.startsWith("url(") ||
        trimmed === "currentColor"
      ) {
        return `${prop}: ${trimmed}`;
      }
      return `${prop}: currentColor`;
    },
  );
  el.setAttribute("style", rewritten);
}

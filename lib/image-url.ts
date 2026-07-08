import { baseUrl } from "@/lib/fetch";

/**
 * API'den gelen imageUrl alanları göreli yol olabilir
 * ("/uploads/foo.png" gibi) ya da mutlak bir URL olabilir.
 * Göreli olanları backend baseUrl'i ile birleştirip mutlak hale
 * getiriyoruz; mutlak veya boş değerleri olduğu gibi geri veriyoruz.
 */
export function resolveImageUrl(
  url: string | null | undefined,
): string | null {
  if (!url) return null;
  const trimmed = url.trim();
  if (!trimmed) return null;
  // Zaten mutlak bir URL — olduğu gibi bırak.
  if (/^https?:\/\//i.test(trimmed)) return trimmed;
  // Protokol-relative ya da data URL — olduğu gibi bırak.
  if (trimmed.startsWith("//") || trimmed.startsWith("data:")) return trimmed;
  // Göreli yol — baseUrl ile birleştir. baseUrl'in sonundaki /'i sil,
  // trimmed'in başındaki /'i koru.
  const base = baseUrl.replace(/\/+$/, "");
  const path = trimmed.startsWith("/") ? trimmed : `/${trimmed}`;
  return `${base}${path}`;
}
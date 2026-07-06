import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

/**
 * Tailwind sınıflarını koşullu olarak birleştirmek için kullanılan yardımcı.
 * shadcn standart `cn` yardımcısının takma adıdır.
 */
export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

const TRY_CURRENCY_FORMATTER = new Intl.NumberFormat("tr-TR", {
  style: "currency",
  currency: "TRY",
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Türk Lirası cinsinden tutarı TR yerelleştirmesine uygun şekilde biçimlendirir.
 * Geçersiz değerler için em-dash (`—`) döndürür.
 */
export function formatCurrency(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "—";
  try {
    return TRY_CURRENCY_FORMATTER.format(numeric);
  } catch {
    return `₺${numeric.toFixed(2)}`;
  }
}

const TRY_NUMBER_FORMATTER = new Intl.NumberFormat("tr-TR", {
  minimumFractionDigits: 2,
  maximumFractionDigits: 2,
});

/**
 * Türk Lirası simgesi olmadan yalnızca sayıyı TR yerelleştirmesine göre
 * biçimlendirir. Tablo hücreleri gibi tekdüze alanlarda kullanılır.
 */
export function formatNumber(value: number | string | null | undefined) {
  if (value === null || value === undefined || value === "") return "—";
  const numeric = typeof value === "number" ? value : Number(value);
  if (!Number.isFinite(numeric)) return "—";
  return TRY_NUMBER_FORMATTER.format(numeric);
}

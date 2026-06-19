import rawTranslations from "./emoji-translations.json";

export type EmojiTranslation = {
  tr: string;
  terms: string[];
};

export type EmojiTranslations = {
  categories: Record<string, string>;
  translations: Record<string, EmojiTranslation>;
  wordTranslations: Record<string, string>;
};

export const emojiTranslations: EmojiTranslations =
  rawTranslations as EmojiTranslations;

export function getTranslation(character: string): EmojiTranslation | null {
  return emojiTranslations.translations[character] ?? null;
}

export function getCategoryLabel(slug: string): string {
  return emojiTranslations.categories[slug] ?? slug;
}

export function getWordTranslation(word: string): string | null {
  const normalized = word.trim().toLocaleLowerCase("tr-TR");
  if (!normalized) return null;
  const direct = emojiTranslations.wordTranslations[normalized];
  if (direct) return direct;
  const compact = normalized.replace(/[^\p{L}\p{N}]+/gu, "");
  if (!compact || compact === normalized) return null;
  return emojiTranslations.wordTranslations[compact] ?? null;
}

export function normalizeText(value: string): string {
  return value
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "");
}

export function emojiUrlFromCodePoint(codePoint: string): string {
  const cleaned = codePoint
    .toLowerCase()
    .split(/\s+/)
    .filter((part) => part && part !== "fe0f")
    .join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${cleaned}.png`;
}

export function emojiUrlFromCharacter(character: string): string {
  const codes = [...character]
    .map((char) => char.codePointAt(0)?.toString(16))
    .filter((code): code is string => Boolean(code) && code !== "fe0f")
    .join("-");
  return `https://cdn.jsdelivr.net/gh/twitter/twemoji@14.0.2/assets/72x72/${codes}.png`;
}

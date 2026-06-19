import { NextResponse } from "next/server";
import { getEmojis } from "@/lib/emoji-api";
import {
  emojiTranslations,
  emojiUrlFromCodePoint,
  normalizeText,
} from "@/lib/emoji-translations";
import { translateToEnglish } from "@/lib/translate";

export type EnrichedEmoji = {
  character: string;
  codePoint: string;
  englishName: string;
  turkishName: string;
  terms: string[];
  group: string;
  subGroup: string;
  groupLabel: string;
  subGroupLabel: string;
  url: string;
};

export type EmojiListResponse = {
  source: "emoji-api.com" | "unpkg";
  categories: Record<string, string>;
  translatedQuery?: string;
  emojis: EnrichedEmoji[];
};

function enrichEmoji(emoji: {
  codePoint: string;
  character: string;
  name: string;
  group: string;
  subGroup: string;
}): EnrichedEmoji {
  const translation = emojiTranslations.translations[emoji.character];
  return {
    character: emoji.character,
    codePoint: emoji.codePoint,
    englishName: emoji.name,
    turkishName: translation?.tr ?? emoji.name,
    terms: translation?.terms ?? [],
    group: emoji.group,
    subGroup: emoji.subGroup,
    groupLabel:
      emojiTranslations.categories[emoji.subGroup] ??
      emojiTranslations.categories[emoji.group] ??
      emoji.group,
    subGroupLabel:
      emojiTranslations.categories[emoji.subGroup] ?? emoji.subGroup,
    url: emojiUrlFromCodePoint(emoji.codePoint),
  };
}

function scoreEmoji(
  emoji: EnrichedEmoji,
  normalizedQueries: string[],
): number {
  if (normalizedQueries.length === 0) return 0;
  const tr = normalizeText(emoji.turkishName);
  const en = normalizeText(emoji.englishName);
  const terms = emoji.terms.map(normalizeText);

  let best = 0;
  for (const normalizedQuery of normalizedQueries) {
    if (!normalizedQuery) continue;
    let score = 0;
    if (tr === normalizedQuery) score += 140;
    if (en === normalizedQuery) score += 130;
    if (tr.startsWith(normalizedQuery)) score += 70;
    if (en.startsWith(normalizedQuery)) score += 60;
    if (tr.includes(normalizedQuery)) score += 50;
    if (en.includes(normalizedQuery)) score += 40;
    for (const term of terms) {
      if (term === normalizedQuery) score += 100;
      if (term.startsWith(normalizedQuery)) score += 50;
      if (term.includes(normalizedQuery)) score += 30;
    }
    if (score > best) best = score;
  }
  return best;
}

export async function GET(request: Request) {
  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q")?.trim() ?? "";
  const rawLimit = parseInt(searchParams.get("limit") ?? "0", 10);
  const limit = Number.isFinite(rawLimit)
    ? Math.min(Math.max(rawLimit, 0), 60)
    : 0;
  const group = searchParams.get("group")?.trim() ?? "";

  const { source, emojis } = await getEmojis();
  const enriched = emojis.map(enrichEmoji);

  if (!query) {
    const body: EmojiListResponse = {
      source,
      categories: emojiTranslations.categories,
      emojis: [],
    };
    return NextResponse.json(body, responseHeaders());
  }

  const translatedQuery = await translateToEnglish(query);
  const queries = Array.from(
    new Set(
      [query, translatedQuery]
        .map((value) => value?.trim())
        .filter((value): value is string => Boolean(value)),
    ),
  );
  const normalizedQueries = queries.map(normalizeText);

  const filtered = group
    ? enriched.filter(
        (emoji) => emoji.subGroup === group || emoji.group === group,
      )
    : enriched;

  const scored = filtered
    .map((emoji) => ({ emoji, score: scoreEmoji(emoji, normalizedQueries) }))
    .filter(({ score }) => score > 0)
    .sort((left, right) => right.score - left.score)
    .map(({ emoji }) => emoji);

  const limited = limit > 0 ? scored.slice(0, limit) : scored;

  const body: EmojiListResponse = {
    source,
    categories: emojiTranslations.categories,
    translatedQuery: translatedQuery !== query ? translatedQuery : undefined,
    emojis: limited,
  };

  return NextResponse.json(body, responseHeaders());
}

function responseHeaders() {
  return {
    headers: {
      "Cache-Control": "public, max-age=60, stale-while-revalidate=600",
    },
  };
}

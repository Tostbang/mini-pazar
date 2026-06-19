import { getWordTranslation, normalizeText } from "./emoji-translations";

const MYMEMORY_URL = "https://api.mymemory.translated.net/get";

type TranslationResult = {
  translatedText: string;
  match: number;
};

const cache = new Map<string, TranslationResult>();
const inflight = new Map<string, Promise<TranslationResult>>();

const NON_LATIN_RE =
  /[\u0370-\u03FF\u0400-\u04FF\u0500-\u052F\u0530-\u058F\u0590-\u05FF\u0600-\u06FF\u0700-\u074F\u0750-\u077F\u0780-\u07BF\u07C0-\u07FF\u0800-\u083F\u0840-\u085F\u08A0-\u08FF\u0900-\u097F\u0980-\u09FF\u0A00-\u0A7F\u0A80-\u0AFF\u0B00-\u0B7F\u0B80-\u0BFF\u0C00-\u0C7F\u0C80-\u0CFF\u0D00-\u0D7F\u0D80-\u0DFF\u0E00-\u0E7F\u0E80-\u0EFF\u0F00-\u0FFF\u1000-\u109F\u10A0-\u10FF\u1100-\u11FF\u1200-\u12FF\u1300-\u13FF\u1400-\u167F\u1680-\u169F\u16A0-\u16FF\u1700-\u171F\u1720-\u173F\u1740-\u175F\u1760-\u177F\u1780-\u17FF\u1800-\u18AF\u1E00-\u1EFF\u2C60-\u2C7F\u2E00-\u2E7F\u3400-\u4DBF\u4E00-\u9FFF\uA000-\uA48F\uA490-\uA4CF\uAC00-\uD7A3\uF900-\uFAFF\uFB00-\uFB06\uFE70-\uFEFF\uFF00-\uFFEF]/;

const PUNCT_RE = /[:;<>{}\[\]\\|]/;

const ENGLISH_HINT_RE =
  /\b(the|a|an|and|or|for|with|of|in|on|at|to|by|is|are|was|were|it|this|that)\b/i;

function isLikelyEnglish(text: string): boolean {
  return ENGLISH_HINT_RE.test(text);
}

function isCleanLatin(text: string): boolean {
  if (!text) return false;
  if (NON_LATIN_RE.test(text)) return false;
  if (PUNCT_RE.test(text)) return false;
  if (!/[a-zA-Z]/.test(text)) return false;
  if (text.length < 2) return false;
  return true;
}

function tokenize(text: string): string[] {
  return text
    .split(/[\s,;:.!?()\[\]{}'"`/\\|]+/u)
    .map((token) => token.trim())
    .filter(Boolean);
}

function buildCuratedTranslation(text: string): string | null {
  const tokens = tokenize(text);
  if (tokens.length === 0) return null;

  const translated: string[] = [];
  let mappedCount = 0;
  for (const token of tokens) {
    const english = getWordTranslation(token);
    if (english) {
      translated.push(english);
      mappedCount += 1;
    } else {
      translated.push(token);
    }
  }

  if (mappedCount === 0) return null;
  return translated.join(" ");
}

async function fetchFromMyMemory(
  text: string,
  sourceLang: "tr" | "en" = "tr",
  targetLang: "en" | "tr" = "en",
): Promise<TranslationResult | null> {
  try {
    const url = `${MYMEMORY_URL}?q=${encodeURIComponent(
      text,
    )}&langpair=${sourceLang}|${targetLang}`;
    const response = await fetch(url, {
      next: { revalidate: 60 * 60 * 24 * 7 },
    });
    if (!response.ok) {
      throw new Error(`mymemory ${response.status}`);
    }
    const data = (await response.json()) as {
      responseData?: { translatedText?: string; match?: number };
      responseStatus?: number;
    };
    if (data?.responseStatus && data.responseStatus >= 400) {
      return null;
    }
    const translatedText = data?.responseData?.translatedText;
    if (typeof translatedText !== "string") return null;
    const match =
      typeof data?.responseData?.match === "number"
        ? data.responseData.match
        : 0;
    return { translatedText, match };
  } catch (error) {
    console.warn("[translate] mymemory failed:", error);
    return null;
  }
}

async function translateSingleToken(token: string): Promise<string> {
  const key = `tok:${token.toLocaleLowerCase("tr-TR")}`;
  const cached = cache.get(key);
  if (cached) return cached.translatedText;

  const pending = inflight.get(key);
  if (pending) {
    const result = await pending;
    return result.translatedText;
  }

  const request = (async () => {
    const trimmed = token.trim();
    if (!trimmed) {
      const result = { translatedText: "", match: 0 };
      cache.set(key, result);
      return result;
    }

    if (isLikelyEnglish(trimmed)) {
      const result = { translatedText: trimmed, match: 1 };
      cache.set(key, result);
      return result;
    }

    const curated = getWordTranslation(trimmed);
    if (curated) {
      const result = { translatedText: curated, match: 1 };
      cache.set(key, result);
      return result;
    }

    const remote = await fetchFromMyMemory(trimmed);
    if (remote && isCleanLatin(remote.translatedText)) {
      const finalText = remote.translatedText.trim();
      if (finalText && finalText.toLowerCase() !== trimmed.toLowerCase()) {
        const result = { translatedText: finalText, match: remote.match };
        cache.set(key, result);
        return result;
      }
    }

    const curatedAny = getWordTranslation(trimmed);
    const result = {
      translatedText: curatedAny ?? trimmed,
      match: curatedAny ? 1 : 0,
    };
    cache.set(key, result);
    return result;
  })().finally(() => {
    inflight.delete(key);
  });

  inflight.set(key, request);
  const result = await request;
  return result.translatedText;
}

export async function translateToEnglish(text: string): Promise<string> {
  const trimmed = text.trim();
  if (!trimmed) return "";

  if (isLikelyEnglish(trimmed)) return trimmed;

  const fullKey = `full:${trimmed.toLocaleLowerCase("tr-TR")}`;
  const fullCached = cache.get(fullKey);
  if (fullCached) return fullCached.translatedText;

  const tokens = tokenize(trimmed);
  const translatedParts = await Promise.all(
    tokens.map((token) => translateSingleToken(token)),
  );

  const result = translatedParts.join(" ").trim();
  cache.set(fullKey, { translatedText: result, match: 1 });
  return result || trimmed;
}

export const __testing = {
  isCleanLatin,
  buildCuratedTranslation,
  tokenize,
};

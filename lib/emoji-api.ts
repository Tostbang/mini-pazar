export type ApiEmoji = {
  codePoint: string;
  character: string;
  name: string;
  group: string;
  subGroup: string;
};

export type EmojiSource = "emoji-api.com" | "unpkg";

const EMOJI_API_KEY = process.env.EMOJI_API_KEY;
const EMOJI_API_BASE = "https://emoji-api.com/emojis";
const UNPKG_EMOJI_JSON = "https://unpkg.com/emoji.json@13.1.0/emoji.json";

let cache: { source: EmojiSource; emojis: ApiEmoji[] } | null = null;
let inflight: Promise<{ source: EmojiSource; emojis: ApiEmoji[] }> | null =
  null;

function decodeEscape(input: string): string {
  return input
    .replace(/\\u([0-9A-Fa-f]{4})/g, (_match, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    )
    .replace(/\\U([0-9A-Fa-f]{8})/g, (_match, hex: string) =>
      String.fromCodePoint(parseInt(hex, 16)),
    );
}

async function fetchFromEmojiApi(): Promise<ApiEmoji[]> {
  if (!EMOJI_API_KEY) {
    throw new Error("EMOJI_API_KEY is not set");
  }
  const response = await fetch(`${EMOJI_API_BASE}?access_key=${EMOJI_API_KEY}`, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) {
    throw new Error(`emoji-api.com ${response.status}`);
  }
  const raw = (await response.json()) as Array<{
    slug?: string;
    character?: string;
    unicodeName?: string;
    codePoint?: string;
    group?: string;
    subGroup?: string;
  }>;
  return raw
    .filter(
      (item) =>
        typeof item.character === "string" &&
        typeof item.codePoint === "string" &&
        typeof item.unicodeName === "string" &&
        typeof item.group === "string" &&
        typeof item.subGroup === "string",
    )
    .map((item) => ({
      codePoint: item.codePoint!,
      character: decodeEscape(item.character!),
      name: item.unicodeName!,
      group: item.group!,
      subGroup: item.subGroup!,
    }));
}

async function fetchFromUnpkg(): Promise<ApiEmoji[]> {
  const response = await fetch(UNPKG_EMOJI_JSON, {
    next: { revalidate: 60 * 60 * 24 },
  });
  if (!response.ok) {
    throw new Error(`unpkg emoji.json ${response.status}`);
  }
  const raw = (await response.json()) as Array<{
    codes?: string;
    char?: string;
    name?: string;
    category?: string;
    group?: string;
    subgroup?: string;
  }>;
  return raw
    .filter(
      (item) =>
        typeof item.codes === "string" &&
        typeof item.char === "string" &&
        typeof item.name === "string" &&
        typeof item.group === "string" &&
        typeof item.subgroup === "string",
    )
    .map((item) => ({
      codePoint: item.codes!,
      character: item.char!,
      name: item.name!,
      group: item.group!,
      subGroup: item.subgroup!,
    }));
}

export async function getEmojis(): Promise<{
  source: EmojiSource;
  emojis: ApiEmoji[];
}> {
  if (cache) return cache;
  if (inflight) return inflight;

  inflight = (async () => {
    if (EMOJI_API_KEY) {
      try {
        const emojis = await fetchFromEmojiApi();
        cache = { source: "emoji-api.com", emojis };
        return cache;
      } catch (error) {
        console.warn(
          "[emoji-api] emoji-api.com fetch failed, falling back to unpkg:",
          error,
        );
      }
    }
    const emojis = await fetchFromUnpkg();
    cache = { source: "unpkg", emojis };
    return cache;
  })().finally(() => {
    inflight = null;
  });

  return inflight;
}

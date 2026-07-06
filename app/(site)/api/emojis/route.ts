import { NextResponse } from "next/server";
import { EMOJI_DATA, type EnrichedEmoji } from "./emoji-data";

// Pre-bundled Unicode 17.0 emoji dataset (1663 base emojis across 9 groups).
// Served from a static module instead of an external API so first paint
// stays instant; Cache-Control + ISR keep subsequent requests off the wire.

type EmojiListResponse = {
  emojis: EnrichedEmoji[];
};

// `force-static` pre-renders the JSON once at build time. The picker also
// caches the response in TanStack Query (30min staleTime) and the browser
// respects the long max-age header below.
export const dynamic = "force-static";
export const revalidate = 86400; // refresh generated data once a day at most

export function GET() {
  return NextResponse.json(
    { emojis: EMOJI_DATA as EnrichedEmoji[] } satisfies EmojiListResponse,
    {
      headers: {
        // The dataset ships with the app, so it is safe to mark the
        // response immutable for a year — any change forces a re-deploy
        // (and a new URL via the build hash, in case we ever wrap it in a
        // versioned endpoint).
        "Cache-Control": "public, max-age=31536000, immutable",
      },
    },
  );
}
import { NextResponse, type NextRequest } from "next/server";

function firstValue(value: string | null | undefined): string | null {
  if (!value) return null;
  const first = value.split(",")[0]?.trim();
  return first && first.length > 0 ? first : null;
}

function extractIp(req: NextRequest): string | null {
  const candidates = [
    firstValue(req.headers.get("x-forwarded-for")),
    firstValue(req.headers.get("x-real-ip")),
    firstValue(req.headers.get("cf-connecting-ip")),
    firstValue(req.headers.get("true-client-ip")),
    firstValue(req.headers.get("x-client-ip")),
  ];

  for (const candidate of candidates) {
    if (candidate) return candidate;
  }

  const fallback = (req as unknown as { ip?: string | null }).ip;
  return fallback ?? null;
}

export const dynamic = "force-dynamic";

export function GET(req: NextRequest) {
  const ip = extractIp(req);
  return NextResponse.json({ ip });
}
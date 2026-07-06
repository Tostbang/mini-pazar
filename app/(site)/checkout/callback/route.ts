import { cookies } from "next/headers";
import { redirect } from "next/navigation";
import { NextRequest, NextResponse } from "next/server";

const RESULT_PATH = "/checkout/result";

async function extractToken(req: NextRequest): Promise<string> {
  const contentType = req.headers.get("content-type") ?? "";

  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    return params.get("token") ?? "";
  }

  try {
    const json = (await req.json()) as { token?: string };
    return json?.token ?? "";
  } catch {
    return "";
  }
}

export async function POST(req: NextRequest) {
  const token = await extractToken(req);
  if (!token) {
    return NextResponse.redirect(new URL("/checkout", req.url));
  }

  const cookieStore = await cookies();
  cookieStore.set("paymentId", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  redirect(RESULT_PATH);
}

export async function GET(req: NextRequest) {
  const token = req.nextUrl.searchParams.get("token") ?? "";
  if (!token) {
    return NextResponse.redirect(new URL("/checkout", req.url));
  }

  const cookieStore = await cookies();
  cookieStore.set("paymentId", token, {
    httpOnly: true,
    sameSite: "lax",
    secure: process.env.NODE_ENV === "production",
    path: "/",
    maxAge: 600,
  });

  redirect(RESULT_PATH);
}
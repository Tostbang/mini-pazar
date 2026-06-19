import { cookies } from "next/headers";
import { NextRequest, NextResponse } from "next/server";

const RESULT_PATH = "/checkout/result";

export async function POST(req: NextRequest) {
  let token = "";

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("application/x-www-form-urlencoded")) {
    const text = await req.text();
    const params = new URLSearchParams(text);
    token = params.get("token") ?? "";
  } else {
    try {
      const json = (await req.json()) as { token?: string };
      token = json?.token ?? "";
    } catch {
      token = "";
    }
  }

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

  return NextResponse.redirect(new URL(RESULT_PATH, req.url));
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

  return NextResponse.redirect(new URL(RESULT_PATH, req.url));
}

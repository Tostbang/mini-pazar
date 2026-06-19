import { NextResponse } from "next/server";
import type { NextRequest } from "next/server";
import { Role } from "@/lib/types";

type JwtPayload = {
  roleId?: number | string;
  exp?: number;
};

function decodeJwtPayload(token: string): JwtPayload | null {
  try {
    const parts = token.split(".");
    if (parts.length !== 3) return null;
    const payload = parts[1];
    const normalized = payload.replace(/-/g, "+").replace(/_/g, "/");
    const padded = normalized + "===".slice((normalized.length + 3) % 4);
    const json = atob(padded);
    return JSON.parse(json) as JwtPayload;
  } catch {
    return null;
  }
}

function isTokenExpired(payload: JwtPayload): boolean {
  return (
    typeof payload.exp === "number" && payload.exp * 1000 < Date.now()
  );
}

export function proxy(request: NextRequest) {
  const token = request.cookies.get("token")?.value;

  if (!token) {
    return NextResponse.redirect(new URL("/login", request.url));
  }

  const payload = decodeJwtPayload(token);
  if (!payload || isTokenExpired(payload)) {
    const response = NextResponse.redirect(new URL("/login", request.url));
    response.cookies.set("token", "", { maxAge: 0, path: "/" });
    return response;
  }

  const role = Number(payload.roleId);
  if (role !== Role.Admin) {
    return NextResponse.redirect(new URL("/", request.url));
  }

  return NextResponse.next();
}

export const config = {
  matcher: ["/dash", "/dash/:path*"],
};

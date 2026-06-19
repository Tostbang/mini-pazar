import Cookies from "js-cookie"

export function getToken(): string | undefined {
  return Cookies.get("token")
}

export function setToken(token: string): void {
  Cookies.set("token", token, { expires: 10 })
}

export function deleteToken(): void {
  Cookies.remove("token")
}

export function toStringSafe(
  value: string | number | null | undefined,
): string {
  return value == null ? "" : String(value)
}

export function toErrorMessage(error: unknown, fallback: string): string {
  if (error instanceof Error) return error.message;
  if (typeof error === "string") return error;
  return fallback;
}

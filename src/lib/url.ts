import { redirect } from "next/navigation";

/** Anexa ?ok= ou ?err= à URL, preservando query params existentes. */
export function redirectWithFlash(path: string, key: "ok" | "err", message: string): never {
  const url = new URL(path, "http://local");
  url.searchParams.set(key, message);
  redirect(`${url.pathname}${url.search}`);
}

/** Decodifica returnTo vindo de formulário (encodeURIComponent). */
export function parseReturnTo(raw: string | null | undefined, fallback: string): string {
  const trimmed = String(raw ?? "").trim();
  if (!trimmed) return fallback;
  try {
    const decoded = decodeURIComponent(trimmed);
    if (!decoded.startsWith("/") || decoded.startsWith("//")) return fallback;
    return decoded;
  } catch {
    return fallback;
  }
}

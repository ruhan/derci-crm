import { clsx, type ClassValue } from "clsx";
import { twMerge } from "tailwind-merge";

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs));
}

/** Remove acentos e normaliza para comparação de busca (minúsculas). */
export function normalizeForSearch(value: string): string {
  return value
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();
}

/** Busca parcial ignorando maiúsculas/minúsculas e acentos. */
export function matchesAccentInsensitive(haystack: string, needle: string): boolean {
  const n = normalizeForSearch(needle);
  if (!n) return true;
  return normalizeForSearch(haystack).includes(n);
}

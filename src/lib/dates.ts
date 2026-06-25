import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toValidDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isValid(d) ? d : null;
}

/** Lê ?date= da agenda (yyyy-MM-dd), tolerando URLs corrompidas. */
export function parseAgendaDateParam(raw: string | undefined): Date {
  if (!raw) return new Date();
  const iso = raw.slice(0, 10);
  const parsed = parseISO(iso);
  return isValid(parsed) ? parsed : new Date();
}

export function formatLocalDateTimeInput(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return "";
  return format(d, "yyyy-MM-dd'T'HH:mm");
}

export function safeFormat(
  value: Date | string | null | undefined,
  pattern: string,
  options?: { locale?: typeof ptBR }
): string {
  const d = toValidDate(value);
  if (!d) return "";
  return format(d, pattern, options);
}

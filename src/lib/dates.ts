import { format, isValid, parseISO } from "date-fns";
import { ptBR } from "date-fns/locale";

export function toValidDate(value: Date | string | null | undefined): Date | null {
  if (value == null || value === "") return null;
  const d = value instanceof Date ? value : new Date(value);
  return isValid(d) ? d : null;
}

/** Arredonda para o próximo slot de 30 min (:00 ou :30). */
export function roundToNextHalfHour(date: Date = new Date()): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  if (mins === 0 || mins === 30) return d;
  if (mins < 30) {
    d.setMinutes(30);
  } else {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  }
  return d;
}

/** Formato de exibição/entrada: dd/MM/yyyy HH:mm */
export function formatBrazilianDateTime(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return "";
  return format(d, "dd/MM/yyyy HH:mm");
}

/** Interpreta dd/MM/yyyy HH:mm; minutos devem ser :00 ou :30. */
export function parseBrazilianDateTime(value: string): Date | null {
  const m = value.trim().match(/^(\d{2})\/(\d{2})\/(\d{4}) (\d{2}):(\d{2})$/);
  if (!m) return null;
  const dd = Number(m[1]);
  const mm = Number(m[2]);
  const yyyy = Number(m[3]);
  const hh = Number(m[4]);
  const min = Number(m[5]);
  if (min !== 0 && min !== 30) return null;
  if (hh < 0 || hh > 23) return null;
  const d = new Date(yyyy, mm - 1, dd, hh, min, 0, 0);
  if (!isValid(d)) return null;
  if (d.getFullYear() !== yyyy || d.getMonth() !== mm - 1 || d.getDate() !== dd) return null;
  return d;
}

/** Ajusta minutos existentes para o slot :00 ou :30 mais próximo. */
export function snapToHalfHour(date: Date): Date {
  const d = new Date(date);
  d.setSeconds(0, 0);
  const mins = d.getMinutes();
  if (mins === 0 || mins === 30) return d;
  if (mins < 15) {
    d.setMinutes(0);
  } else if (mins < 45) {
    d.setMinutes(30);
  } else {
    d.setHours(d.getHours() + 1);
    d.setMinutes(0);
  }
  return d;
}

/** Lê ?date= da agenda (yyyy-MM-dd), tolerando URLs corrompidas. */
export function parseAgendaDateParam(raw: string | undefined): Date {
  if (!raw) return new Date();
  const iso = raw.slice(0, 10);
  const parsed = parseISO(iso);
  return isValid(parsed) ? parsed : new Date();
}

/** Valor padrão para campos de agendamento (BR, slot de 30 min). */
export function formatLocalDateTimeInput(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return formatBrazilianDateTime(roundToNextHalfHour(new Date()));
  const mins = d.getMinutes();
  if (mins !== 0 && mins !== 30) {
    return formatBrazilianDateTime(snapToHalfHour(d));
  }
  return formatBrazilianDateTime(d);
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

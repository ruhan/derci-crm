import {
  startOfWeek,
  endOfWeek,
  addWeeks,
  format,
  isWithinInterval,
  parseISO,
} from "date-fns";
import { ptBR } from "date-fns/locale";

// Semana começa na segunda-feira no padrão pt-BR
const WEEK_OPTIONS = { weekStartsOn: 1 as const };

export function getWeekStart(date: Date | string = new Date()): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  const start = startOfWeek(d, WEEK_OPTIONS);
  // Normalizar para 00:00:00 local
  start.setHours(0, 0, 0, 0);
  return start;
}

export function getWeekEnd(date: Date | string = new Date()): Date {
  const d = typeof date === "string" ? new Date(date) : date;
  const end = endOfWeek(d, WEEK_OPTIONS);
  end.setHours(23, 59, 59, 999);
  return end;
}

export function shiftWeek(weekStart: Date, delta: number): Date {
  return getWeekStart(addWeeks(weekStart, delta));
}

export function isThisWeek(date: Date | string): boolean {
  const d = typeof date === "string" ? new Date(date) : date;
  return isWithinInterval(d, {
    start: getWeekStart(),
    end: getWeekEnd(),
  });
}

export function formatWeekRange(weekStart: Date | string): string {
  const start = getWeekStart(weekStart);
  const end = getWeekEnd(weekStart);
  return `${format(start, "dd/MM", { locale: ptBR })} a ${format(end, "dd/MM/yyyy", { locale: ptBR })}`;
}

export function formatWeekRangeShort(weekStart: Date | string): string {
  const start = getWeekStart(weekStart);
  const end = getWeekEnd(weekStart);
  return `${format(start, "dd/MM", { locale: ptBR })} - ${format(end, "dd/MM", { locale: ptBR })}`;
}

export function parseWeekParam(value: string | null | undefined): Date {
  if (!value) return getWeekStart();
  try {
    return getWeekStart(parseISO(value));
  } catch {
    return getWeekStart();
  }
}

export function weekISO(weekStart: Date): string {
  return format(getWeekStart(weekStart), "yyyy-MM-dd");
}

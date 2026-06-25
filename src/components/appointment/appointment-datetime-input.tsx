"use client";

import { useMemo, useState } from "react";
import {
  addMonths,
  eachDayOfInterval,
  endOfMonth,
  endOfWeek,
  format,
  isSameDay,
  isSameMonth,
  isToday,
  setHours,
  setMinutes,
  startOfMonth,
  startOfWeek,
  subMonths,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { CalendarIcon, ChevronLeft, ChevronRight } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Popover, PopoverContent, PopoverTrigger } from "@/components/ui/popover";
import { cn } from "@/lib/utils";
import {
  formatBrazilianDateTime,
  parseBrazilianDateTime,
  roundToNextHalfHour,
  snapToHalfHour,
  toValidDate,
} from "@/lib/dates";

const WEEK_STARTS_ON = 1 as const;
const WEEKDAY_LABELS = ["seg", "ter", "qua", "qui", "sex", "sáb", "dom"];
const HOURS = Array.from({ length: 24 }, (_, i) => i);

function parseInitial(value?: string): Date {
  if (!value) return roundToNextHalfHour(new Date());
  const fromBr = parseBrazilianDateTime(value);
  if (fromBr) return fromBr;
  const d = toValidDate(value);
  if (!d) return roundToNextHalfHour(new Date());
  const mins = d.getMinutes();
  if (mins !== 0 && mins !== 30) return snapToHalfHour(d);
  return d;
}

export function AppointmentDateTimeInput({
  id,
  name = "scheduledAt",
  defaultValue,
  disabled,
  required = true,
}: {
  id: string;
  name?: string;
  defaultValue?: string;
  disabled?: boolean;
  required?: boolean;
}) {
  const initial = useMemo(() => parseInitial(defaultValue), [defaultValue]);
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<Date>(initial);
  const [viewMonth, setViewMonth] = useState<Date>(() => startOfMonth(initial));

  const calendarDays = useMemo(() => {
    const start = startOfWeek(startOfMonth(viewMonth), { weekStartsOn: WEEK_STARTS_ON });
    const end = endOfWeek(endOfMonth(viewMonth), { weekStartsOn: WEEK_STARTS_ON });
    return eachDayOfInterval({ start, end });
  }, [viewMonth]);

  const monthLabel = format(viewMonth, "LLLL yyyy", { locale: ptBR });

  function pickDay(day: Date) {
    setSelected(
      setMinutes(setHours(day, selected.getHours()), selected.getMinutes())
    );
  }

  function setHour(hour: number) {
    setSelected(setHours(selected, hour));
  }

  function setMinute(minute: number) {
    setSelected(setMinutes(selected, minute));
  }

  const formatted = formatBrazilianDateTime(selected);

  return (
    <div className="space-y-1">
      <input type="hidden" name={name} value={formatted} required={required} />
      <Popover open={open} onOpenChange={setOpen}>
        <PopoverTrigger asChild>
          <Button
            id={id}
            type="button"
            variant="outline"
            disabled={disabled}
            className={cn(
              "h-12 w-full justify-start gap-2 border-2 px-4 text-base font-normal",
              !formatted && "text-muted-foreground"
            )}
          >
            <CalendarIcon className="h-5 w-5 shrink-0 opacity-60" />
            {formatted || "dd/mm/aaaa HH:MM"}
          </Button>
        </PopoverTrigger>
        <PopoverContent className="w-[min(100vw-2rem,20rem)] p-3" align="start">
          <div className="flex items-center justify-between mb-3">
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMonth((m) => subMonths(m, 1))}
              aria-label="Mês anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Button>
            <span className="text-sm font-semibold capitalize">{monthLabel}</span>
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => setViewMonth((m) => addMonths(m, 1))}
              aria-label="Próximo mês"
            >
              <ChevronRight className="h-5 w-5" />
            </Button>
          </div>

          <div className="grid grid-cols-7 gap-1 mb-2">
            {WEEKDAY_LABELS.map((label) => (
              <div
                key={label}
                className="text-center text-xs font-medium text-muted-foreground py-1"
              >
                {label}
              </div>
            ))}
            {calendarDays.map((day) => {
              const inMonth = isSameMonth(day, viewMonth);
              const active = isSameDay(day, selected);
              return (
                <button
                  key={day.toISOString()}
                  type="button"
                  onClick={() => pickDay(day)}
                  className={cn(
                    "h-9 w-9 rounded-md text-sm transition-colors",
                    !inMonth && "text-muted-foreground/40",
                    inMonth && !active && "hover:bg-accent",
                    active && "bg-primary text-primary-foreground hover:bg-primary/90",
                    !active && isToday(day) && "border border-primary/40"
                  )}
                >
                  {format(day, "d")}
                </button>
              );
            })}
          </div>

          <div className="grid grid-cols-2 gap-2 border-t pt-3">
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Hora</label>
              <select
                className="h-10 w-full rounded-lg border-2 border-input bg-background px-2 text-sm"
                value={selected.getHours()}
                onChange={(e) => setHour(Number(e.target.value))}
              >
                {HOURS.map((h) => (
                  <option key={h} value={h}>
                    {String(h).padStart(2, "0")}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-1">
              <label className="text-xs font-medium text-muted-foreground">Minuto</label>
              <select
                className="h-10 w-full rounded-lg border-2 border-input bg-background px-2 text-sm"
                value={selected.getMinutes()}
                onChange={(e) => setMinute(Number(e.target.value))}
              >
                <option value={0}>00</option>
                <option value={30}>30</option>
              </select>
            </div>
          </div>
        </PopoverContent>
      </Popover>
      <p className="text-xs text-muted-foreground">
        Formato: dd/mm/aaaa HH:MM — minutos :00 ou :30
      </p>
    </div>
  );
}

import Link from "next/link";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  parseISO,
  addDays,
  addWeeks,
  addMonths,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { AppointmentStatusBadge } from "@/components/ui/status-badge";
import { fmtDateTime, fmtTime } from "@/lib/format";
import { parseAgendaDateParam, safeFormat } from "@/lib/dates";
import { getWeekStart, getWeekEnd, formatWeekRange } from "@/lib/week";
import { ScheduleAppointmentDialog } from "@/components/appointment/schedule-dialog";
import { DeleteSessionButton } from "@/components/session/delete-session-button";
import { AppointmentActions } from "@/components/appointment/appointment-actions";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

type View = "dia" | "semana" | "mes";

export default async function AgendaPage({
  searchParams,
}: {
  searchParams: { view?: string; date?: string };
}) {
  const view: View = (searchParams.view as View) || "semana";
  const baseDate = parseAgendaDateParam(searchParams.date);

  let from: Date;
  let to: Date;
  let label: string;
  let prevDate: Date;
  let nextDate: Date;

  if (view === "dia") {
    from = startOfDay(baseDate);
    to = endOfDay(baseDate);
    label = format(baseDate, "dd 'de' MMMM, yyyy", { locale: ptBR });
    prevDate = addDays(baseDate, -1);
    nextDate = addDays(baseDate, 1);
  } else if (view === "mes") {
    from = startOfMonth(baseDate);
    to = endOfMonth(baseDate);
    label = format(baseDate, "MMMM 'de' yyyy", { locale: ptBR });
    prevDate = addMonths(baseDate, -1);
    nextDate = addMonths(baseDate, 1);
  } else {
    from = getWeekStart(baseDate);
    to = getWeekEnd(baseDate);
    label = `Semana de ${formatWeekRange(from)}`;
    prevDate = addWeeks(baseDate, -1);
    nextDate = addWeeks(baseDate, 1);
  }

  const [appts, patients] = await Promise.all([
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: from, lte: to } },
      include: { patient: true, plan: true, session: true },
      orderBy: { scheduledAt: "asc" },
    }),
    prisma.patient.findMany({
      where: { status: { not: "FECHADO" } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  // agrupa por dia para visões semana/mês
  const groupByDay: Record<string, typeof appts> = {};
  for (const a of appts) {
    const k = format(a.scheduledAt, "yyyy-MM-dd");
    (groupByDay[k] ||= []).push(a);
  }
  const days = Object.keys(groupByDay).sort();
  const agendaReturnTo = `/agenda?view=${view}&date=${format(baseDate, "yyyy-MM-dd")}`;

  return (
    <div className="space-y-5">
      <PageHeader
        title="Agenda"
        description={label}
        action={<ScheduleAppointmentDialog patients={patients} />}
      />

      <div className="flex flex-wrap items-center gap-2">
        <ViewLink current={view} value="dia" date={baseDate}>
          Dia
        </ViewLink>
        <ViewLink current={view} value="semana" date={baseDate}>
          Semana
        </ViewLink>
        <ViewLink current={view} value="mes" date={baseDate}>
          Mês
        </ViewLink>
        <div className="ml-auto flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/agenda?view=${view}&date=${format(prevDate, "yyyy-MM-dd")}`}
              aria-label="Anterior"
            >
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href={`/agenda?view=${view}`}>Hoje</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link
              href={`/agenda?view=${view}&date=${format(nextDate, "yyyy-MM-dd")}`}
              aria-label="Próximo"
            >
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
      </div>

      {appts.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-10 w-10" />}
          title="Sem atendimentos no período"
          description='Toque em "Agendar atendimento" no topo para criar um novo.'
        />
      ) : view === "dia" ? (
        <DayList appts={appts} agendaReturnTo={agendaReturnTo} />
      ) : (
        <div className="space-y-3">
          {days.map((d) => (
            <Card key={d}>
              <CardHeader>
                <CardTitle className="text-lg capitalize">
                  {safeFormat(parseISO(d), "EEEE, dd/MM", { locale: ptBR })}
                </CardTitle>
              </CardHeader>
              <CardContent>
                <DayList appts={groupByDay[d]} agendaReturnTo={agendaReturnTo} />
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}

function DayList({ appts, agendaReturnTo }: { appts: any[]; agendaReturnTo: string }) {
  return (
    <ul className="divide-y">
      {appts.map((a) => (
        <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div>
            <p className="text-base font-semibold">
              {fmtTime(a.scheduledAt)} — {a.patient.name}
            </p>
            <p className="text-sm text-muted-foreground">
              {a.durationMin} min — {fmtDateTime(a.scheduledAt)}
            </p>
            {a.notes && <p className="text-sm">{a.notes}</p>}
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <AppointmentStatusBadge status={a.status} />
            <DeleteSessionButton
              sessionId={a.session?.id}
              appointmentId={a.id}
              patientId={a.patientId}
              occurredAtLabel={fmtDateTime(a.scheduledAt)}
              returnTo={agendaReturnTo}
              fromAgenda
            />
            <AppointmentActions
              appointmentId={a.id}
              status={a.status}
              patientId={a.patientId}
              scheduledAt={a.scheduledAt}
              durationMin={a.durationMin}
            />
          </div>
        </li>
      ))}
    </ul>
  );
}

function ViewLink({
  current,
  value,
  date,
  children,
}: {
  current: string;
  value: View;
  date: Date;
  children: React.ReactNode;
}) {
  const active = current === value;
  return (
    <Button asChild variant={active ? "default" : "outline"} size="sm">
      <Link href={`/agenda?view=${value}&date=${format(date, "yyyy-MM-dd")}`}>{children}</Link>
    </Button>
  );
}

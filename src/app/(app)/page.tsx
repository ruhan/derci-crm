import Link from "next/link";
import {
  startOfDay,
  endOfDay,
  startOfMonth,
  endOfMonth,
  format,
} from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  AppointmentStatusBadge,
  PaymentStatusBadge,
  TaskStatusBadge,
} from "@/components/ui/status-badge";
import { fmtDateTime, fmtTime, formatBRL } from "@/lib/format";
import { getWeekStart, getWeekEnd } from "@/lib/week";
import { Plus, Calendar } from "lucide-react";

export const dynamic = "force-dynamic";

export default async function DashboardPage() {
  const now = new Date();
  const todayStart = startOfDay(now);
  const todayEnd = endOfDay(now);
  const weekStart = getWeekStart(now);
  const weekEnd = getWeekEnd(now);
  const monthStart = startOfMonth(now);
  const monthEnd = endOfMonth(now);

  const [
    activeCount,
    closedCount,
    nonResponsiveCount,
    newWeekCount,
    todayAppts,
    weekAppts,
    overduePayments,
    pendingRenewals,
    openTasks,
    monthIn,
    monthOut,
    nextAppts,
    pendingTaskList,
    overdueList,
  ] = await Promise.all([
    prisma.patient.count({ where: { status: "ATIVO" } }),
    prisma.patient.count({ where: { status: "FECHADO" } }),
    prisma.patient.count({ where: { status: "PAROU_DE_RESPONDER" } }),
    prisma.patient.count({
      where: {
        status: { in: ["EM_CONVERSACAO", "FEZ_PRIMEIRA_SESSAO"] },
        entryDate: { gte: weekStart, lte: weekEnd },
      },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: todayStart, lte: todayEnd } },
    }),
    prisma.appointment.count({
      where: { scheduledAt: { gte: weekStart, lte: weekEnd } },
    }),
    prisma.payment.count({ where: { status: "ATRASADO" } }),
    prisma.task.count({
      where: { type: "RENOVACAO", status: { in: ["A_FAZER", "EM_ANDAMENTO"] } },
    }),
    prisma.task.count({
      where: {
        weekStart,
        status: { in: ["A_FAZER", "EM_ANDAMENTO"] },
      },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "ENTRADA", occurredAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.financialTransaction.aggregate({
      _sum: { amount: true },
      where: { type: "SAIDA", occurredAt: { gte: monthStart, lte: monthEnd } },
    }),
    prisma.appointment.findMany({
      where: { scheduledAt: { gte: now }, status: "AGENDADO" },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { scheduledAt: "asc" },
      take: 5,
    }),
    prisma.task.findMany({
      where: { status: { in: ["A_FAZER", "EM_ANDAMENTO"] } },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { weekStart: "asc" },
      take: 5,
    }),
    prisma.payment.findMany({
      where: { status: { in: ["ATRASADO", "PENDENTE"] } },
      include: { patient: { select: { id: true, name: true } } },
      orderBy: { paidAt: "asc" },
      take: 5,
    }),
  ]);

  const inSum = Number(monthIn._sum.amount ?? 0);
  const outSum = Number(monthOut._sum.amount ?? 0);
  const balance = inSum - outSum;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Início"
        description={format(now, "EEEE, dd 'de' MMMM", { locale: ptBR })}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild size="lg">
              <Link href="/pacientes/novo">
                <Plus className="h-5 w-5" /> Novo paciente
              </Link>
            </Button>
            <Button asChild variant="secondary" size="lg">
              <Link href="/agenda">
                <Calendar className="h-5 w-5" /> Agenda
              </Link>
            </Button>
          </div>
        }
      />

      {/* Cards principais */}
      <section>
        <h2 className="text-lg font-semibold mb-3">Visão geral</h2>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3">
          <StatCard label="Pacientes ativos" value={activeCount} href="/pacientes?status=ATIVO" />
          <StatCard label="Fechados" value={closedCount} href="/pacientes?status=FECHADO" />
          <StatCard
            label="Pararam de responder"
            value={nonResponsiveCount}
            href="/pacientes?status=PAROU_DE_RESPONDER"
          />
          <StatCard label="Novos contatos da semana" value={newWeekCount} />
          <StatCard label="Sessões hoje" value={todayAppts} href="/agenda?view=dia" />
          <StatCard label="Sessões da semana" value={weekAppts} href="/agenda?view=semana" />
          <StatCard
            label="Pagamentos em atraso"
            value={overduePayments}
            href="/financeiro/pagamentos?status=ATRASADO"
            accent="destructive"
          />
          <StatCard label="Renovações pendentes" value={pendingRenewals} href="/tarefas" accent="warning" />
          <StatCard label="Tarefas abertas" value={openTasks} href="/tarefas" />
          <StatCard label="Entradas do mês" value={formatBRL(inSum)} href="/financeiro" accent="success" />
          <StatCard label="Saídas do mês" value={formatBRL(outSum)} href="/financeiro" accent="destructive" />
          <StatCard
            label="Saldo do mês"
            value={formatBRL(balance)}
            href="/financeiro"
            accent={balance >= 0 ? "success" : "destructive"}
          />
        </div>
      </section>

      {/* Próximos atendimentos */}
      <Card>
        <CardHeader>
          <CardTitle>Próximos atendimentos</CardTitle>
        </CardHeader>
        <CardContent>
          {nextAppts.length === 0 ? (
            <p className="text-base text-muted-foreground">Sem atendimentos agendados.</p>
          ) : (
            <ul className="divide-y">
              {nextAppts.map((a) => (
                <li key={a.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <Link href={`/pacientes/${a.patient.id}`} className="font-semibold underline">
                      {a.patient.name}
                    </Link>
                    <p className="text-sm text-muted-foreground">{fmtDateTime(a.scheduledAt)}</p>
                  </div>
                  <AppointmentStatusBadge status={a.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Tarefas urgentes */}
      <Card>
        <CardHeader>
          <CardTitle>Ações urgentes</CardTitle>
        </CardHeader>
        <CardContent>
          {pendingTaskList.length === 0 ? (
            <p className="text-base text-muted-foreground">Sem ações urgentes.</p>
          ) : (
            <ul className="divide-y">
              {pendingTaskList.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div className="min-w-0">
                    <p className="font-semibold truncate">{t.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {t.patient ? (
                        <Link href={`/pacientes/${t.patient.id}`} className="underline">
                          {t.patient.name}
                        </Link>
                      ) : (
                        "Sem paciente"
                      )}
                    </p>
                  </div>
                  <TaskStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Pagamentos pendentes */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos pendentes</CardTitle>
        </CardHeader>
        <CardContent>
          {overdueList.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum pagamento pendente.</p>
          ) : (
            <ul className="divide-y">
              {overdueList.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{formatBRL(p.amount.toString())}</p>
                    {p.patient && (
                      <Link href={`/pacientes/${p.patient.id}`} className="text-sm text-primary underline">
                        {p.patient.name}
                      </Link>
                    )}
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function StatCard({
  label,
  value,
  href,
  accent,
}: {
  label: string;
  value: React.ReactNode;
  href?: string;
  accent?: "success" | "destructive" | "warning";
}) {
  const colors: Record<string, string> = {
    success: "text-success",
    destructive: "text-destructive",
    warning: "text-warning",
  };
  const inner = (
    <div className="rounded-2xl border bg-card p-4 shadow-sm h-full hover:shadow-md transition-shadow">
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className={`mt-1 text-3xl font-bold ${accent ? colors[accent] : ""}`}>{value}</p>
    </div>
  );
  return href ? <Link href={href}>{inner}</Link> : inner;
}

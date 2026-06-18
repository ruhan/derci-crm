import { startOfMonth, endOfMonth, subMonths, format } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PATIENT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  PAYMENT_METHOD_LABEL,
  formatBRL,
} from "@/lib/format";
import { ReportsCharts } from "@/components/reports/reports-charts";
import { getWeekStart, formatWeekRangeShort } from "@/lib/week";

export const dynamic = "force-dynamic";

export default async function ReportsPage() {
  const now = new Date();

  // ---- pacientes por status ----
  const patientsByStatus = await prisma.patient.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  // ---- 12 meses de entradas/saídas ----
  const months: { from: Date; to: Date; label: string; key: string }[] = [];
  for (let i = 11; i >= 0; i--) {
    const d = subMonths(now, i);
    const from = startOfMonth(d);
    const to = endOfMonth(d);
    months.push({
      from,
      to,
      label: format(d, "MMM/yy", { locale: ptBR }),
      key: format(d, "yyyy-MM"),
    });
  }

  const monthlyTotals = await Promise.all(
    months.map(async (m) => {
      const [inAgg, outAgg] = await Promise.all([
        prisma.financialTransaction.aggregate({
          _sum: { amount: true },
          where: { type: "ENTRADA", occurredAt: { gte: m.from, lte: m.to } },
        }),
        prisma.financialTransaction.aggregate({
          _sum: { amount: true },
          where: { type: "SAIDA", occurredAt: { gte: m.from, lte: m.to } },
        }),
      ]);
      return {
        mes: m.label,
        entradas: Number(inAgg._sum.amount ?? 0),
        saidas: Number(outAgg._sum.amount ?? 0),
        saldo: Number(inAgg._sum.amount ?? 0) - Number(outAgg._sum.amount ?? 0),
      };
    })
  );

  // ---- entradas por categoria (últimos 6 meses) ----
  const sixFrom = startOfMonth(subMonths(now, 5));
  const incomeByCategory = await prisma.financialTransaction.groupBy({
    by: ["category"],
    _sum: { amount: true },
    where: { type: "ENTRADA", occurredAt: { gte: sixFrom } },
  });

  const incomeByMethod = await prisma.financialTransaction.groupBy({
    by: ["method"],
    _sum: { amount: true },
    where: { type: "ENTRADA", method: { not: null }, occurredAt: { gte: sixFrom } },
  });

  // ---- 12 semanas: novos contatos, sessões realizadas, planos vendidos, tarefas concluídas ----
  const weeks: { from: Date; to: Date; label: string; key: string }[] = [];
  let cursor = getWeekStart(now);
  for (let i = 11; i >= 0; i--) {
    const start = new Date(cursor);
    start.setDate(start.getDate() - i * 7);
    const end = new Date(start);
    end.setDate(end.getDate() + 6);
    end.setHours(23, 59, 59, 999);
    weeks.push({
      from: start,
      to: end,
      label: formatWeekRangeShort(start),
      key: format(start, "yyyy-MM-dd"),
    });
  }

  const weeklyData = await Promise.all(
    weeks.map(async (w) => {
      const [novos, sessoes, planos, tarefasConcluidas, tarefasAbertas] = await Promise.all([
        prisma.patient.count({
          where: { entryDate: { gte: w.from, lte: w.to } },
        }),
        prisma.session.count({
          where: { occurredAt: { gte: w.from, lte: w.to } },
        }),
        prisma.treatmentPlan.count({
          where: { startDate: { gte: w.from, lte: w.to } },
        }),
        prisma.task.count({
          where: { completedAt: { gte: w.from, lte: w.to } },
        }),
        prisma.task.count({
          where: {
            weekStart: { gte: w.from, lte: w.to },
            status: { in: ["A_FAZER", "EM_ANDAMENTO"] },
          },
        }),
      ]);
      return {
        semana: w.label,
        novosContatos: novos,
        sessoes,
        planosVendidos: planos,
        tarefasConcluidas,
        tarefasAbertas,
      };
    })
  );

  // ---- sessões por status nas últimas 12 semanas ----
  const apptByStatus = await prisma.appointment.groupBy({
    by: ["status"],
    _count: { _all: true },
    where: { scheduledAt: { gte: weeks[0].from } },
  });

  // ---- tarefas concluídas vs abertas (semana atual) ----
  const taskCounts = await prisma.task.groupBy({
    by: ["status"],
    _count: { _all: true },
  });

  // ---- pagamentos atrasados ----
  const overdueAggregate = await prisma.payment.aggregate({
    _sum: { amount: true },
    _count: { _all: true },
    where: { status: "ATRASADO" },
  });

  // ---- receita média por paciente nos últimos 6 meses ----
  const pagPorPaciente = await prisma.payment.groupBy({
    by: ["patientId"],
    _sum: { amount: true },
    where: { status: "PAGO", paidAt: { gte: sixFrom } },
  });
  const pacientesComRec = pagPorPaciente.filter((p) => p.patientId).length;
  const totalReceita = pagPorPaciente.reduce((s, p) => s + Number(p._sum.amount ?? 0), 0);
  const receitaMedia = pacientesComRec > 0 ? totalReceita / pacientesComRec : 0;

  return (
    <div className="space-y-6">
      <PageHeader title="Relatórios" description="Visão operacional e financeira" />

      <div className="grid gap-4 sm:grid-cols-3">
        <SummaryItem label="Pacientes (todos)" value={patientsByStatus.reduce((s, p) => s + p._count._all, 0)} />
        <SummaryItem label="Pagamentos atrasados" value={`${overdueAggregate._count._all} (${formatBRL(Number(overdueAggregate._sum.amount ?? 0))})`} />
        <SummaryItem label="Receita média / paciente (6m)" value={formatBRL(receitaMedia)} />
      </div>

      <ReportsCharts
        monthly={monthlyTotals}
        weekly={weeklyData}
        patientsByStatus={patientsByStatus.map((p) => ({
          status: PATIENT_STATUS_LABEL[p.status] ?? p.status,
          quantidade: p._count._all,
        }))}
        incomeByCategory={incomeByCategory
          .filter((c) => Number(c._sum.amount ?? 0) > 0)
          .map((c) => ({
            categoria: c.category,
            valor: Number(c._sum.amount ?? 0),
          }))}
        incomeByMethod={incomeByMethod
          .filter((c) => Number(c._sum.amount ?? 0) > 0)
          .map((c) => ({
            forma: PAYMENT_METHOD_LABEL[c.method ?? "OUTRO"] ?? "Outro",
            valor: Number(c._sum.amount ?? 0),
          }))}
        taskStatus={taskCounts.map((c) => ({
          status: TASK_STATUS_LABEL[c.status] ?? c.status,
          quantidade: c._count._all,
        }))}
      />

      {/* Histórico semanal em tabela */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico semanal (últimas 12 semanas)</CardTitle>
        </CardHeader>
        <CardContent className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr className="text-left border-b">
                <th className="py-2 pr-3">Semana</th>
                <th className="py-2 pr-3">Novos</th>
                <th className="py-2 pr-3">Sessões</th>
                <th className="py-2 pr-3">Planos</th>
                <th className="py-2 pr-3">Tarefas concluídas</th>
                <th className="py-2 pr-3">Tarefas abertas</th>
              </tr>
            </thead>
            <tbody>
              {weeklyData.map((w) => (
                <tr key={w.semana} className="border-b last:border-0">
                  <td className="py-2 pr-3">{w.semana}</td>
                  <td className="py-2 pr-3">{w.novosContatos}</td>
                  <td className="py-2 pr-3">{w.sessoes}</td>
                  <td className="py-2 pr-3">{w.planosVendidos}</td>
                  <td className="py-2 pr-3">{w.tarefasConcluidas}</td>
                  <td className="py-2 pr-3">{w.tarefasAbertas}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryItem({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className="mt-1 text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

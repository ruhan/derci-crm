import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtDateTime, SELECTABLE_TASK_TYPES } from "@/lib/format";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { formatWeekRange, parseWeekParam, shiftWeek, weekISO } from "@/lib/week";
import { TaskCard } from "@/components/task/task-card";
import { NewTaskDialog } from "@/components/task/new-task-dialog";
import { upsertWeeklyCommentAction } from "@/server/actions/tasks";
import { EmptyState } from "@/components/ui/empty-state";

export const dynamic = "force-dynamic";

export default async function TasksPage({
  searchParams,
}: {
  searchParams: { week?: string; type?: string; status?: string };
}) {
  const week = parseWeekParam(searchParams.week);
  const prev = shiftWeek(week, -1);
  const next = shiftWeek(week, 1);

  const where: any = { weekStart: week };
  if (searchParams.type) where.type = searchParams.type;
  if (searchParams.status) where.status = searchParams.status;

  const [tasks, weeklyComment, patients] = await Promise.all([
    prisma.task.findMany({
      where,
      include: {
        patient: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
        comments: {
          orderBy: { createdAt: "desc" },
          include: { author: { select: { name: true } } },
        },
      },
      orderBy: [{ status: "asc" }, { dueDate: "asc" }],
    }),
    prisma.weeklyComment.findUnique({
      where: { weekStart: week },
      include: { author: { select: { name: true } } },
    }),
    prisma.patient.findMany({
      where: { status: { not: "FECHADO" } },
      select: { id: true, name: true },
      orderBy: { name: "asc" },
    }),
  ]);

  const counts = {
    total: tasks.length,
    aFazer: tasks.filter((t) => t.status === "A_FAZER").length,
    emAndamento: tasks.filter((t) => t.status === "EM_ANDAMENTO").length,
    concluidas: tasks.filter((t) => t.status === "CONCLUIDA").length,
  };

  return (
    <div className="space-y-5">
      <PageHeader
        title="Tarefas da Semana"
        description={`Semana de ${formatWeekRange(week)}`}
        action={<NewTaskDialog patients={patients} weekStart={weekISO(week)} />}
      />

      {/* Navegação de semanas: 3 colunas iguais. No mobile os botões
          laterais mostram apenas o chevron para garantir que cabe na tela. */}
      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Button variant="outline" asChild className="px-2 sm:px-5">
          <Link
            href={`/tarefas?week=${weekISO(prev)}`}
            aria-label="Semana anterior"
            className="min-w-0"
          >
            <ChevronLeft className="h-5 w-5 shrink-0" />
            <span className="hidden sm:inline">Anterior</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="px-2 sm:px-5">
          <Link href="/tarefas" className="min-w-0">
            <span className="truncate">Esta semana</span>
          </Link>
        </Button>
        <Button variant="outline" asChild className="px-2 sm:px-5">
          <Link
            href={`/tarefas?week=${weekISO(next)}`}
            aria-label="Próxima semana"
            className="min-w-0"
          >
            <span className="hidden sm:inline">Próxima</span>
            <ChevronRight className="h-5 w-5 shrink-0" />
          </Link>
        </Button>
      </div>

      {/* Resumo */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <CountCard label="Total" value={counts.total} />
        <CountCard label="A fazer" value={counts.aFazer} />
        <CountCard label="Em andamento" value={counts.emAndamento} />
        <CountCard label="Concluídas" value={counts.concluidas} />
      </div>

      {/* Filtros: empilhados no mobile, lado a lado no desktop */}
      <form
        className="grid grid-cols-1 sm:grid-cols-[1fr_1fr_auto] gap-3 sm:items-end"
        method="get"
      >
        <input type="hidden" name="week" value={weekISO(week)} />
        <div>
          <Label className="mb-2 block">Tipo</Label>
          <select
            name="type"
            defaultValue={searchParams.type ?? ""}
            className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">Todos os tipos</option>
            {SELECTABLE_TASK_TYPES.map((t) => (
              <option key={t.value} value={t.value}>
                {t.label}
              </option>
            ))}
          </select>
        </div>
        <div>
          <Label className="mb-2 block">Status</Label>
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">Todos os status</option>
            <option value="A_FAZER">A fazer</option>
            <option value="EM_ANDAMENTO">Em andamento</option>
            <option value="CONCLUIDA">Concluída</option>
            <option value="NAO_DEU_CERTO">Não deu certo</option>
            <option value="CANCELADA">Cancelada</option>
          </select>
        </div>
        <Button type="submit" variant="secondary" size="lg" className="w-full sm:w-auto">
          Filtrar
        </Button>
      </form>

      {/* Comentário semanal */}
      <Card>
        <CardHeader>
          <CardTitle>Comentário geral da semana</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={upsertWeeklyCommentAction} className="space-y-3">
            <input type="hidden" name="weekStart" value={weekISO(week)} />
            <Textarea
              name="content"
              rows={4}
              defaultValue={weeklyComment?.content ?? ""}
              placeholder="Ex.: Semana com muitas remarcações por causa do feriado."
            />
            <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
              {weeklyComment && (
                <p className="text-sm text-muted-foreground">
                  Atualizado em {fmtDateTime(weeklyComment.updatedAt)}
                  {weeklyComment.author?.name ? ` por ${weeklyComment.author.name}` : ""}
                </p>
              )}
              <Button
                type="submit"
                variant="secondary"
                size="lg"
                className="w-full sm:ml-auto sm:w-auto"
              >
                Salvar comentário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      {/* Tarefas */}
      {tasks.length === 0 ? (
        <EmptyState
          icon={<Plus className="h-10 w-10" />}
          title="Sem tarefas nesta semana"
          description="Crie uma tarefa ou navegue para outra semana."
        />
      ) : (
        <ul className="space-y-3">
          {tasks.map((t) => (
            <li key={t.id}>
              <TaskCard task={t as any} />
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

function CountCard({ label, value }: { label: string; value: number }) {
  return (
    <div className="rounded-2xl border bg-card p-4 text-center shadow-sm">
      <p className="text-3xl font-bold">{value}</p>
      <p className="text-sm text-muted-foreground">{label}</p>
    </div>
  );
}

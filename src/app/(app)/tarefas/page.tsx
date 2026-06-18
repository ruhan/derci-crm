import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtDateTime, TASK_TYPE_LABEL } from "@/lib/format";
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
      where: { status: { notIn: ["FECHADO", "INATIVO"] } },
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

      {/* Navegação de semanas */}
      <div className="flex items-center justify-between">
        <Button variant="outline" asChild>
          <Link href={`/tarefas?week=${weekISO(prev)}`}>
            <ChevronLeft className="h-5 w-5" /> Semana anterior
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/tarefas">Esta semana</Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href={`/tarefas?week=${weekISO(next)}`}>
            Próxima <ChevronRight className="h-5 w-5" />
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

      {/* Filtros simples */}
      <form className="flex flex-wrap items-end gap-3" method="get">
        <input type="hidden" name="week" value={weekISO(week)} />
        <div className="flex-1 min-w-[160px]">
          <Label className="mb-2 block">Tipo</Label>
          <select
            name="type"
            defaultValue={searchParams.type ?? ""}
            className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">Todos os tipos</option>
            {Object.entries(TASK_TYPE_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <div className="flex-1 min-w-[160px]">
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
        <Button type="submit" variant="secondary" size="lg">
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
            <div className="flex items-center justify-between">
              {weeklyComment && (
                <p className="text-sm text-muted-foreground">
                  Atualizado em {fmtDateTime(weeklyComment.updatedAt)}
                  {weeklyComment.author?.name ? ` por ${weeklyComment.author.name}` : ""}
                </p>
              )}
              <Button type="submit" variant="secondary" size="lg" className="ml-auto">
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

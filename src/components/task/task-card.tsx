"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Textarea } from "@/components/ui/textarea";
import { TaskStatusBadge } from "@/components/ui/status-badge";
import { fmtDate, fmtDateTime, TASK_TYPE_LABEL } from "@/lib/format";
import { addTaskCommentAction, updateTaskStatusAction } from "@/server/actions/tasks";

type Task = {
  id: string;
  title: string;
  type: string;
  description: string | null;
  status: string;
  weekStart: Date;
  dueDate: Date | null;
  completedAt: Date | null;
  patient: { id: string; name: string } | null;
  assignee: { id: string; name: string } | null;
  comments: { id: string; content: string; createdAt: Date; author: { name: string } | null }[];
};

const STATUSES = [
  { value: "A_FAZER", label: "A fazer", variant: "outline" as const },
  { value: "EM_ANDAMENTO", label: "Em andamento", variant: "warning" as const },
  { value: "CONCLUIDA", label: "Concluída", variant: "success" as const },
  { value: "NAO_DEU_CERTO", label: "Não deu certo", variant: "destructive" as const },
  { value: "CANCELADA", label: "Cancelada", variant: "ghost" as const },
];

export function TaskCard({ task }: { task: Task }) {
  const [showComments, setShowComments] = useState(false);
  const [pending, start] = useTransition();

  const setStatus = (status: string) => {
    const fd = new FormData();
    fd.set("taskId", task.id);
    fd.set("status", status);
    start(() => updateTaskStatusAction(fd));
  };

  return (
    <Card>
      <CardContent className="pt-5 space-y-3">
        <div className="flex items-start justify-between gap-3">
          <div className="min-w-0">
            <h3 className="text-lg font-semibold leading-tight">{task.title}</h3>
            <p className="text-sm text-muted-foreground">
              {TASK_TYPE_LABEL[task.type] ?? task.type}
              {task.patient ? (
                <>
                  {" • "}
                  <Link href={`/pacientes/${task.patient.id}`} className="underline">
                    {task.patient.name}
                  </Link>
                </>
              ) : null}
              {task.dueDate ? ` • Para ${fmtDate(task.dueDate)}` : ""}
            </p>
            {task.description && (
              <p className="mt-2 whitespace-pre-wrap text-base">{task.description}</p>
            )}
          </div>
          <TaskStatusBadge status={task.status} />
        </div>

        <div className="flex flex-wrap gap-2">
          {STATUSES.map((s) => (
            <Button
              key={s.value}
              size="sm"
              variant={task.status === s.value ? "default" : "outline"}
              onClick={() => setStatus(s.value)}
              disabled={pending || task.status === s.value}
            >
              {s.label}
            </Button>
          ))}
        </div>

        <div className="border-t pt-3">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setShowComments((v) => !v)}
            type="button"
          >
            {showComments ? "Ocultar" : "Mostrar"} comentários ({task.comments.length})
          </Button>

          {showComments && (
            <div className="mt-3 space-y-3">
              <ul className="space-y-2">
                {task.comments.map((c) => (
                  <li key={c.id} className="rounded-lg bg-muted p-3">
                    <p className="text-sm text-muted-foreground">
                      {c.author?.name ?? "—"} • {fmtDateTime(c.createdAt)}
                    </p>
                    <p className="whitespace-pre-wrap text-base">{c.content}</p>
                  </li>
                ))}
                {task.comments.length === 0 && (
                  <p className="text-sm text-muted-foreground">Sem comentários ainda.</p>
                )}
              </ul>
              <form action={addTaskCommentAction} className="space-y-2">
                <input type="hidden" name="taskId" value={task.id} />
                <Textarea
                  name="content"
                  rows={2}
                  placeholder="Escreva um comentário sobre o andamento..."
                  required
                />
                <div className="flex justify-end">
                  <Button size="sm" type="submit">
                    Adicionar comentário
                  </Button>
                </div>
              </form>
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

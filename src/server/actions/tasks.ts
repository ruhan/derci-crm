"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  TaskSchema,
  TaskStatusSchema,
  TaskCommentSchema,
  WeeklyCommentSchema,
} from "@/lib/validations";
import { getWeekStart } from "@/lib/week";
import { logTimelineEvent } from "@/server/timeline";

function fdToObj(fd: FormData) {
  const obj: Record<string, any> = {};
  fd.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function createTaskAction(formData: FormData) {
  const user = await requireUser();
  const parsed = TaskSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/tarefas?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const data = parsed.data;
  const t = await prisma.task.create({
    data: {
      title: data.title.trim(),
      type: data.type,
      description: data.description ?? null,
      patientId: data.patientId || null,
      weekStart: getWeekStart(data.weekStart),
      dueDate: data.dueDate ? new Date(data.dueDate) : null,
      status: "A_FAZER",
      assigneeId: data.assigneeId || user.id,
      createdById: user.id,
    },
  });
  if (data.patientId) {
    await logTimelineEvent({
      patientId: data.patientId,
      type: "TAREFA_CRIADA",
      title: data.title,
      refId: t.id,
      authorId: user.id,
    });
  }
  revalidatePath("/tarefas");
  if (data.patientId) revalidatePath(`/pacientes/${data.patientId}`);
  redirect(`/tarefas?week=${data.weekStart}&ok=${encodeURIComponent("Tarefa criada")}`);
}

export async function updateTaskStatusAction(formData: FormData) {
  const user = await requireUser();
  const parsed = TaskStatusSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(`/tarefas?err=${encodeURIComponent("Status inválido")}`);
  }
  const { taskId, status } = parsed.data;
  const t = await prisma.task.findUnique({ where: { id: taskId } });
  if (!t) return;
  await prisma.task.update({
    where: { id: taskId },
    data: {
      status,
      completedAt: status === "CONCLUIDA" ? new Date() : t.completedAt,
    },
  });
  if (t.patientId && status === "CONCLUIDA") {
    await logTimelineEvent({
      patientId: t.patientId,
      type: "TAREFA_CONCLUIDA",
      title: `Tarefa concluída: ${t.title}`,
      refId: t.id,
      authorId: user.id,
    });
  }
  revalidatePath("/tarefas");
  if (t.patientId) revalidatePath(`/pacientes/${t.patientId}`);
}

export async function addTaskCommentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = TaskCommentSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(`/tarefas?err=${encodeURIComponent("Comentário inválido")}`);
  }
  await prisma.taskComment.create({
    data: {
      taskId: parsed.data.taskId,
      content: parsed.data.content.trim(),
      authorId: user.id,
    },
  });
  revalidatePath("/tarefas");
}

export async function upsertWeeklyCommentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = WeeklyCommentSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(`/tarefas?err=${encodeURIComponent("Comentário inválido")}`);
  }
  const wkStart = getWeekStart(parsed.data.weekStart);
  await prisma.weeklyComment.upsert({
    where: { weekStart: wkStart },
    update: { content: parsed.data.content.trim(), authorId: user.id },
    create: {
      weekStart: wkStart,
      content: parsed.data.content.trim(),
      authorId: user.id,
    },
  });
  revalidatePath("/tarefas");
}

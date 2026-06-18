"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  PatientSchema,
  ClosePatientSchema,
  ReopenPatientSchema,
} from "@/lib/validations";
import { logTimelineEvent } from "@/server/timeline";
import { getWeekStart } from "@/lib/week";

function fdToObj(fd: FormData): Record<string, any> {
  const obj: Record<string, any> = {};
  fd.forEach((value, key) => {
    obj[key] = typeof value === "string" ? value : value;
  });
  return obj;
}

export async function createPatientAction(formData: FormData) {
  const user = await requireUser();
  const parsed = PatientSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/pacientes/novo?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const data = parsed.data;
  const patient = await prisma.patient.create({
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      origin: data.origin,
      referrerName: data.origin === "INDICACAO" ? data.referrerName?.trim() || null : null,
      referrerNote: data.origin === "INDICACAO" ? data.referrerNote?.trim() || null : null,
      entryDate: new Date(data.entryDate),
      status: data.status,
      generalHistory: data.generalHistory?.trim() || null,
      internalNotes: data.internalNotes?.trim() || null,
      createdById: user.id,
      updatedById: user.id,
    },
  });

  await logTimelineEvent({
    patientId: patient.id,
    type: "ENTRADA",
    title: "Paciente cadastrado",
    description: `Status inicial: ${data.status.replaceAll("_", " ").toLowerCase()}`,
    authorId: user.id,
  });

  // Regra automática: se status for "Em negociação", criar tarefa
  // de "Entrar em contato para fechar plano" para a semana corrente.
  if (data.status === "EM_NEGOCIACAO") {
    await prisma.task.create({
      data: {
        title: `Fechar plano com ${patient.name}`,
        type: "CONTATO_FECHAR_PLANO",
        description: `Novo contato em negociação. Telefone: ${patient.phone}.`,
        patientId: patient.id,
        weekStart: getWeekStart(),
        status: "A_FAZER",
        createdById: user.id,
        assigneeId: user.id,
      },
    });
    await logTimelineEvent({
      patientId: patient.id,
      type: "TAREFA_CRIADA",
      title: "Tarefa de contato criada",
      authorId: user.id,
    });
  }

  revalidatePath("/pacientes");
  revalidatePath("/tarefas");
  revalidatePath("/");
  redirect(`/pacientes/${patient.id}?ok=${encodeURIComponent("Paciente salvo com sucesso")}`);
}

export async function updatePatientAction(id: string, formData: FormData) {
  const user = await requireUser();
  const parsed = PatientSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/pacientes/${id}/editar?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const data = parsed.data;

  const existing = await prisma.patient.findUnique({ where: { id } });
  if (!existing) redirect("/pacientes?err=Paciente%20n%C3%A3o%20encontrado");

  await prisma.patient.update({
    where: { id },
    data: {
      name: data.name.trim(),
      phone: data.phone.trim(),
      origin: data.origin,
      referrerName: data.origin === "INDICACAO" ? data.referrerName?.trim() || null : null,
      referrerNote: data.origin === "INDICACAO" ? data.referrerNote?.trim() || null : null,
      entryDate: new Date(data.entryDate),
      status: data.status,
      generalHistory: data.generalHistory?.trim() || null,
      internalNotes: data.internalNotes?.trim() || null,
      updatedById: user.id,
    },
  });

  if (existing!.status !== data.status) {
    await logTimelineEvent({
      patientId: id,
      type: "STATUS_ALTERADO",
      title: "Status alterado",
      description: `De "${existing!.status}" para "${data.status}"`,
      authorId: user.id,
    });
  }

  revalidatePath("/pacientes");
  revalidatePath(`/pacientes/${id}`);
  revalidatePath("/");
  redirect(`/pacientes/${id}?ok=${encodeURIComponent("Paciente atualizado")}`);
}

export async function closePatientAction(formData: FormData) {
  const user = await requireUser();
  const parsed = ClosePatientSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/pacientes?err=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Dados inválidos")}`
    );
  }
  const { patientId, reason, closedAt } = parsed.data;
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      status: "FECHADO",
      closedAt: new Date(closedAt),
      closedReason: reason,
      updatedById: user.id,
    },
  });
  await logTimelineEvent({
    patientId,
    type: "PRONTUARIO_FECHADO",
    title: "Prontuário fechado",
    description: reason,
    authorId: user.id,
  });
  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/pacientes");
  redirect(`/pacientes/${patientId}?ok=${encodeURIComponent("Prontuário fechado")}`);
}

export async function reopenPatientAction(formData: FormData) {
  const user = await requireUser();
  const parsed = ReopenPatientSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/pacientes?err=${encodeURIComponent(parsed.error.issues[0]?.message ?? "Dados inválidos")}`
    );
  }
  const { patientId, reason, newStatus } = parsed.data;
  await prisma.patient.update({
    where: { id: patientId },
    data: {
      status: newStatus,
      reopenedAt: new Date(),
      reopenedReason: reason,
      closedAt: null,
      closedReason: null,
      updatedById: user.id,
    },
  });
  await logTimelineEvent({
    patientId,
    type: "PRONTUARIO_REABERTO",
    title: "Prontuário reaberto",
    description: reason,
    authorId: user.id,
  });
  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/pacientes");
  redirect(`/pacientes/${patientId}?ok=${encodeURIComponent("Paciente reaberto")}`);
}

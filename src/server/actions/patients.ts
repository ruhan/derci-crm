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
  // Telefone normalizado para apenas dígitos (sem máscara). A formatação
  // de exibição é responsabilidade da UI (fmtPhone).
  const phoneDigits = data.phone.replace(/\D/g, "");
  const patient = await prisma.patient.create({
    data: {
      name: data.name.trim(),
      phone: phoneDigits,
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

  revalidatePath("/pacientes");
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

  const phoneDigits = data.phone.replace(/\D/g, "");
  await prisma.patient.update({
    where: { id },
    data: {
      name: data.name.trim(),
      phone: phoneDigits,
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

export async function deletePatientAction(formData: FormData) {
  await requireUser();
  const patientId = String(formData.get("patientId") ?? "").trim();
  if (!patientId) {
    redirect("/pacientes?err=Paciente%20n%C3%A3o%20informado");
  }

  const patient = await prisma.patient.findUnique({
    where: { id: patientId },
    select: { id: true, name: true },
  });
  if (!patient) {
    redirect("/pacientes?err=Paciente%20n%C3%A3o%20encontrado");
  }

  await prisma.$transaction(async (tx) => {
    const plans = await tx.treatmentPlan.findMany({
      where: { patientId },
      select: { id: true },
    });
    const planIds = plans.map((pl) => pl.id);

    const payments = await tx.payment.findMany({
      where: {
        OR: [{ patientId }, ...(planIds.length ? [{ planId: { in: planIds } }] : [])],
      },
      select: { id: true },
    });
    const paymentIds = payments.map((pay) => pay.id);

    if (paymentIds.length > 0) {
      await tx.financialTransaction.deleteMany({
        where: { paymentId: { in: paymentIds } },
      });
      await tx.payment.deleteMany({ where: { id: { in: paymentIds } } });
    }

    await tx.financialTransaction.deleteMany({ where: { patientId } });
    await tx.task.deleteMany({ where: { patientId } });
    await tx.financeMessage.deleteMany({ where: { patientId } });
    await tx.patient.delete({ where: { id: patientId } });
  });

  revalidatePath("/pacientes");
  revalidatePath("/");
  revalidatePath("/financeiro");
  revalidatePath("/tarefas");
  revalidatePath("/agenda");
  redirect(`/pacientes?ok=${encodeURIComponent(`Paciente "${patient.name}" excluído`)}`);
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { AppointmentSchema, AppointmentStatusSchema } from "@/lib/validations";
import { consumeSessionFromActivePlan } from "@/server/actions/plans";
import { logTimelineEvent } from "@/server/timeline";

function fdToObj(fd: FormData) {
  const obj: Record<string, any> = {};
  fd.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function createAppointmentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = AppointmentSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/agenda?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const data = parsed.data;

  // Tenta vincular ao plano aberto do paciente
  const plan = await prisma.treatmentPlan.findFirst({
    where: { patientId: data.patientId, status: "ABERTO" },
    orderBy: { startDate: "asc" },
  });

  await prisma.appointment.create({
    data: {
      patientId: data.patientId,
      planId: plan?.id ?? null,
      scheduledAt: new Date(data.scheduledAt),
      durationMin: data.durationMin,
      status: "AGENDADO",
      notes: data.notes ?? null,
      createdById: user.id,
    },
  });

  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${data.patientId}`);
  redirect(`/agenda?ok=${encodeURIComponent("Atendimento agendado")}`);
}

export async function updateAppointmentStatusAction(formData: FormData) {
  const user = await requireUser();
  const parsed = AppointmentStatusSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/agenda?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const { appointmentId, status, summary, notes } = parsed.data;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { session: true },
  });
  if (!appt) {
    redirect(`/agenda?err=${encodeURIComponent("Atendimento não encontrado")}`);
  }

  // ===== Realizado =====
  if (status === "REALIZADO") {
    if (appt!.status === "REALIZADO") {
      redirect(
        `/agenda?err=${encodeURIComponent("Este atendimento já foi marcado como realizado")}`
      );
    }
    if (!summary || summary.trim().length < 2) {
      redirect(
        `/agenda?err=${encodeURIComponent("Descreva brevemente o atendimento")}`
      );
    }
    try {
      const plan = await consumeSessionFromActivePlan({
        patientId: appt!.patientId,
        authorId: user.id,
      });
      await prisma.$transaction(async (tx) => {
        await tx.appointment.update({
          where: { id: appointmentId },
          data: { status: "REALIZADO", planId: plan.id, notes: notes ?? appt!.notes },
        });
        if (appt!.session) {
          await tx.session.update({
            where: { id: appt!.session.id },
            data: { summary: summary!.trim(), planId: plan.id },
          });
        } else {
          await tx.session.create({
            data: {
              patientId: appt!.patientId,
              planId: plan.id,
              appointmentId: appointmentId,
              occurredAt: appt!.scheduledAt,
              durationMin: appt!.durationMin,
              summary: summary!.trim(),
              createdById: user.id,
            },
          });
        }
      });
      await logTimelineEvent({
        patientId: appt!.patientId,
        type: "SESSAO_REALIZADA",
        title: "Sessão realizada",
        description: summary!.trim().slice(0, 240),
        refId: appointmentId,
        authorId: user.id,
      });
    } catch (e: any) {
      redirect(
        `/agenda?err=${encodeURIComponent(
          e?.message ?? "Não foi possível registrar a sessão"
        )}`
      );
    }
    revalidatePath("/agenda");
    revalidatePath(`/pacientes/${appt!.patientId}`);
    revalidatePath("/");
    redirect(`/agenda?ok=${encodeURIComponent("Sessão registrada")}`);
  }

  // ===== Outros status =====
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      status,
      cancelReason:
        status === "CANCELADO" || status === "FALTOU" || status === "REMARCADO"
          ? notes ?? null
          : null,
      notes: notes ?? appt!.notes,
    },
  });
  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${appt!.patientId}`);
  redirect(`/agenda?ok=${encodeURIComponent("Atendimento atualizado")}`);
}

export async function deleteAppointmentAction(appointmentId: string) {
  await requireUser();
  const appt = await prisma.appointment.findUnique({ where: { id: appointmentId } });
  if (!appt) return;
  await prisma.appointment.delete({ where: { id: appointmentId } });
  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${appt.patientId}`);
}

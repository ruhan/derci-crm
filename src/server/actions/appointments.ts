"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import {
  AppointmentSchema,
  AppointmentStatusSchema,
  RescheduleAppointmentSchema,
} from "@/lib/validations";
import { consumeSessionFromActivePlan } from "@/server/actions/plans";
import { logTimelineEvent } from "@/server/timeline";
import { redirectWithFlash, parseReturnTo } from "@/lib/url";

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
    const summaryText = summary?.trim() ?? "";
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
            data: { summary: summaryText, planId: plan.id },
          });
        } else {
          await tx.session.create({
            data: {
              patientId: appt!.patientId,
              planId: plan.id,
              appointmentId: appointmentId,
              occurredAt: appt!.scheduledAt,
              durationMin: appt!.durationMin,
              summary: summaryText,
              createdById: user.id,
            },
          });
        }
      });
      await logTimelineEvent({
        patientId: appt!.patientId,
        type: "SESSAO_REALIZADA",
        title: "Sessão realizada",
        description: summaryText ? summaryText.slice(0, 240) : null,
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

export async function rescheduleAppointmentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = RescheduleAppointmentSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/agenda?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const { appointmentId, scheduledAt, durationMin, reason } = parsed.data;

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
  });
  if (!appt) {
    redirect(`/agenda?err=${encodeURIComponent("Atendimento não encontrado")}`);
  }
  if (appt!.status === "REALIZADO") {
    redirect(
      `/agenda?err=${encodeURIComponent(
        "Sessões já realizadas não podem ser remarcadas"
      )}`
    );
  }

  const newDate = new Date(scheduledAt);
  await prisma.appointment.update({
    where: { id: appointmentId },
    data: {
      scheduledAt: newDate,
      durationMin,
      status: "AGENDADO",
      cancelReason: null,
    },
  });

  await logTimelineEvent({
    patientId: appt!.patientId,
    type: "STATUS_ALTERADO",
    title: "Atendimento remarcado",
    description: `De ${appt!.scheduledAt.toLocaleString("pt-BR")} para ${newDate.toLocaleString(
      "pt-BR"
    )}${reason ? ` — ${reason}` : ""}`,
    refId: appointmentId,
    authorId: user.id,
  });

  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${appt!.patientId}`);
  redirect(`/agenda?ok=${encodeURIComponent("Atendimento remarcado")}`);
}

export async function deleteAppointmentAction(appointmentId: string) {
  await requireUser();
  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { session: true },
  });
  if (!appt) return;
  await prisma.appointment.delete({ where: { id: appointmentId } });
  revalidatePath("/agenda");
  revalidatePath(`/pacientes/${appt.patientId}`);
}

export async function deleteSessionAction(formData: FormData) {
  const user = await requireUser();
  const sessionId = String(formData.get("sessionId") ?? "").trim();
  const appointmentId = String(formData.get("appointmentId") ?? "").trim();
  const patientId = String(formData.get("patientId") ?? "").trim();
  const returnToRaw = String(formData.get("returnTo") ?? "").trim();
  const returnTo = parseReturnTo(returnToRaw, `/pacientes/${patientId}`);

  if (!patientId) {
    redirectWithFlash("/agenda", "err", "Paciente inválido");
  }

  let session =
    sessionId
      ? await prisma.session.findUnique({
          where: { id: sessionId },
          include: { appointment: true },
        })
      : null;

  if (!session && appointmentId) {
    session = await prisma.session.findUnique({
      where: { appointmentId },
      include: { appointment: true },
    });
  }

  if (session) {
    if (session.patientId !== patientId) {
      redirectWithFlash(returnTo, "err", "Sessão não encontrada");
    }

    await prisma.$transaction(async (tx) => {
      if (session!.planId) {
        await restorePlanSession(tx, session!.planId, patientId);
      }

      if (session!.appointmentId) {
        await tx.appointment.update({
          where: { id: session!.appointmentId },
          data: {
            status: "AGENDADO",
            planId: session!.planId ?? session!.appointment?.planId ?? null,
          },
        });
      }

      await tx.session.delete({ where: { id: session!.id } });
    });

    await logTimelineEvent({
      patientId,
      type: "STATUS_ALTERADO",
      title: "Sessão apagada",
      description: "Registro de sessão removido. Saldo do plano restaurado.",
      refId: session.appointmentId ?? session.id,
      authorId: user.id,
    });

    revalidatePath(`/pacientes/${patientId}`);
    revalidatePath("/agenda");
    revalidatePath("/");
    redirectWithFlash(returnTo, "ok", "Sessão apagada");
  }

  if (!appointmentId) {
    redirectWithFlash(returnTo, "err", "Sessão não encontrada");
  }

  const appt = await prisma.appointment.findUnique({
    where: { id: appointmentId },
    include: { session: true },
  });
  if (!appt || appt.patientId !== patientId) {
    redirectWithFlash(returnTo, "err", "Atendimento não encontrado");
  }

  if (appt.status === "REALIZADO") {
    await prisma.$transaction(async (tx) => {
      if (appt.planId) {
        await restorePlanSession(tx, appt.planId, patientId);
      }
      await tx.appointment.update({
        where: { id: appointmentId },
        data: { status: "AGENDADO" },
      });
    });

    await logTimelineEvent({
      patientId,
      type: "STATUS_ALTERADO",
      title: "Sessão apagada",
      description: "Atendimento desfeito. Saldo do plano restaurado.",
      refId: appointmentId,
      authorId: user.id,
    });
  } else {
    await prisma.appointment.delete({ where: { id: appointmentId } });

    await logTimelineEvent({
      patientId,
      type: "STATUS_ALTERADO",
      title: "Atendimento removido",
      description: "Atendimento removido da agenda.",
      refId: appointmentId,
      authorId: user.id,
    });
  }

  revalidatePath(`/pacientes/${patientId}`);
  revalidatePath("/agenda");
  revalidatePath("/");
  redirectWithFlash(returnTo, "ok", "Sessão apagada");
}

async function restorePlanSession(
  tx: Parameters<Parameters<typeof prisma.$transaction>[0]>[0],
  planId: string,
  patientId: string
) {
  const plan = await tx.treatmentPlan.findUnique({ where: { id: planId } });
  if (!plan || plan.patientId !== patientId) return;
  const newUsed = Math.max(0, plan.usedSessions - 1);
  const shouldReopen = newUsed < plan.totalSessions && plan.status === "FINALIZADO";
  await tx.treatmentPlan.update({
    where: { id: plan.id },
    data: {
      usedSessions: newUsed,
      ...(shouldReopen ? { status: "ABERTO", endDate: null } : {}),
    },
  });
}

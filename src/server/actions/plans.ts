"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PlanSchema } from "@/lib/validations";
import { logTimelineEvent } from "@/server/timeline";
import { getWeekStart } from "@/lib/week";

function fdToObj(fd: FormData) {
  const obj: Record<string, any> = {};
  fd.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function createPlanAction(formData: FormData) {
  const user = await requireUser();
  const parsed = PlanSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    const patientId = String(formData.get("patientId") ?? "");
    redirect(
      `/pacientes/${patientId}?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const data = parsed.data;

  // O plano agora é independente de pagamento. Já nasce ABERTO; o
  // pagamento (TERAPIA) será associado depois pelo financeiro.
  const plan = await prisma.treatmentPlan.create({
    data: {
      patientId: data.patientId,
      totalSessions: data.totalSessions,
      usedSessions: 0,
      startDate: new Date(data.startDate),
      endDate: data.endDate ? new Date(data.endDate) : null,
      status: "ABERTO",
      notes: data.notes ?? null,
      createdById: user.id,
    },
  });

  await logTimelineEvent({
    patientId: data.patientId,
    type: "PLANO_CRIADO",
    title: `Plano de ${data.totalSessions} sessões`,
    refId: plan.id,
    authorId: user.id,
  });

  revalidatePath(`/pacientes/${data.patientId}`);
  redirect(
    `/pacientes/${data.patientId}?ok=${encodeURIComponent("Plano criado com sucesso")}`
  );
}

export async function cancelPlanAction(planId: string) {
  const user = await requireUser();
  const plan = await prisma.treatmentPlan.findUnique({ where: { id: planId } });
  if (!plan) return;
  await prisma.treatmentPlan.update({
    where: { id: planId },
    data: { status: "CANCELADO" },
  });
  await logTimelineEvent({
    patientId: plan.patientId,
    type: "PLANO_CANCELADO",
    title: "Plano cancelado",
    refId: plan.id,
    authorId: user.id,
  });
  revalidatePath(`/pacientes/${plan.patientId}`);
}

/**
 * Marca o plano como pago/aberto manualmente. Use quando o pagamento for
 * registrado fora do fluxo de pagamento associado.
 */
export async function markPlanOpenAction(planId: string) {
  const user = await requireUser();
  const plan = await prisma.treatmentPlan.findUnique({ where: { id: planId } });
  if (!plan) return;
  await prisma.treatmentPlan.update({
    where: { id: planId },
    data: { status: "ABERTO" },
  });
  await logTimelineEvent({
    patientId: plan.patientId,
    type: "PLANO_CRIADO",
    title: "Plano marcado como pago",
    refId: plan.id,
    authorId: user.id,
  });
  revalidatePath(`/pacientes/${plan.patientId}`);
}

/**
 * Decrementa uma sessão do plano ativo do paciente, finalizando-o se zerar.
 * Retorna o plano usado (ou lança erro caso não exista plano disponível).
 */
export async function consumeSessionFromActivePlan(args: {
  patientId: string;
  authorId: string | null;
}) {
  const plan = await prisma.treatmentPlan.findFirst({
    where: { patientId: args.patientId, status: "ABERTO" },
    orderBy: { startDate: "asc" },
  });
  if (!plan) {
    throw new Error(
      "Este paciente não possui plano pago com sessões disponíveis."
    );
  }
  if (plan.usedSessions >= plan.totalSessions) {
    throw new Error(
      "Este paciente não possui plano pago com sessões disponíveis."
    );
  }
  const newUsed = plan.usedSessions + 1;
  const finalize = newUsed >= plan.totalSessions;

  await prisma.treatmentPlan.update({
    where: { id: plan.id },
    data: {
      usedSessions: newUsed,
      status: finalize ? "FINALIZADO" : "ABERTO",
      endDate: finalize ? new Date() : plan.endDate,
    },
  });

  if (finalize) {
    await logTimelineEvent({
      patientId: args.patientId,
      type: "PLANO_FINALIZADO",
      title: "Plano finalizado",
      description: `Todas as ${plan.totalSessions} sessões foram utilizadas.`,
      refId: plan.id,
      authorId: args.authorId,
    });

    // Tarefa automática de renovação para a semana atual.
    const patient = await prisma.patient.findUnique({ where: { id: args.patientId } });
    // Não criar renovação se o paciente estiver fechado.
    if (patient && patient.status !== "FECHADO") {
      await prisma.task.create({
        data: {
          title: `Renovação de plano - ${patient.name}`,
          type: "RENOVACAO",
          description: `Plano de ${plan.totalSessions} sessões finalizado. Verificar renovação.`,
          patientId: args.patientId,
          weekStart: getWeekStart(),
          status: "A_FAZER",
          createdById: args.authorId ?? undefined,
          assigneeId: args.authorId ?? undefined,
        },
      });
      await prisma.financeMessage.create({
        data: {
          patientId: args.patientId,
          type: "RENOVACAO",
          message: `Plano de ${plan.totalSessions} sessões finalizado. Avaliar renovação.`,
          createdById: args.authorId ?? undefined,
        },
      });
    }
  }
  return plan;
}

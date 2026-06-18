"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { PaymentSchema } from "@/lib/validations";
import { logTimelineEvent } from "@/server/timeline";

function fdToObj(fd: FormData) {
  const obj: Record<string, any> = {};
  fd.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function createPaymentAction(formData: FormData) {
  const user = await requireUser();
  const parsed = PaymentSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/financeiro/pagamentos?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const data = parsed.data;

  const payment = await prisma.payment.create({
    data: {
      patientId: data.patientId || null,
      planId: data.planId || null,
      paidAt: new Date(data.paidAt),
      amount: data.amount,
      method: data.method,
      category: data.category,
      status: data.status,
      notes: data.notes || null,
      createdById: user.id,
    },
  });

  // Se há plano relacionado e está aguardando pagamento + pagamento foi efetuado,
  // marcar plano como ABERTO automaticamente.
  if (data.planId && data.status === "PAGO") {
    const plan = await prisma.treatmentPlan.findUnique({ where: { id: data.planId } });
    if (plan && plan.status === "AGUARDANDO_PAGAMENTO") {
      await prisma.treatmentPlan.update({
        where: { id: plan.id },
        data: { status: "ABERTO" },
      });
    }
  }

  // Registrar transação financeira (entrada)
  if (data.status === "PAGO") {
    const fcat =
      data.category === "TERAPIA"
        ? "TERAPIA"
        : data.category === "LIVRO"
          ? "LIVRO"
          : data.category === "PALESTRA"
            ? "PALESTRA"
            : "OUTRO";
    await prisma.financialTransaction.create({
      data: {
        type: "ENTRADA",
        occurredAt: new Date(data.paidAt),
        amount: data.amount,
        category: fcat as any,
        method: data.method,
        description: data.notes || null,
        patientId: data.patientId || null,
        paymentId: payment.id,
        createdById: user.id,
      },
    });
  }

  if (data.patientId) {
    await logTimelineEvent({
      patientId: data.patientId,
      type: "PAGAMENTO_REGISTRADO",
      title: "Pagamento registrado",
      description: `R$ ${Number(data.amount).toFixed(2)} - ${data.method}`,
      refId: payment.id,
      authorId: user.id,
    });

    await prisma.financeMessage.create({
      data: {
        patientId: data.patientId,
        type: data.status === "PAGO" ? "PAGAMENTO_RECEBIDO" : "PAGAMENTO_ATRASADO",
        message: `Pagamento de R$ ${Number(data.amount).toFixed(2)} (${data.status}).`,
        createdById: user.id,
      },
    });

    // Se pagamento atrasado, gerar tarefa
    if (data.status === "ATRASADO") {
      const { getWeekStart } = await import("@/lib/week");
      const patient = await prisma.patient.findUnique({ where: { id: data.patientId } });
      await prisma.task.create({
        data: {
          title: `Pagamento em atraso - ${patient?.name ?? ""}`,
          type: "PAGAMENTO_ATRASADO",
          description: `R$ ${Number(data.amount).toFixed(2)}.`,
          patientId: data.patientId,
          weekStart: getWeekStart(),
          status: "A_FAZER",
          createdById: user.id,
          assigneeId: user.id,
        },
      });
    }
  }

  revalidatePath("/financeiro");
  revalidatePath("/financeiro/pagamentos");
  revalidatePath("/financeiro/mensagens");
  if (data.patientId) revalidatePath(`/pacientes/${data.patientId}`);
  revalidatePath("/");

  const back = data.patientId
    ? `/pacientes/${data.patientId}?ok=${encodeURIComponent("Pagamento registrado")}`
    : `/financeiro/pagamentos?ok=${encodeURIComponent("Pagamento registrado")}`;
  redirect(back);
}

export async function updatePaymentStatusAction(paymentId: string, status: "PAGO" | "PENDENTE" | "ATRASADO" | "CANCELADO") {
  await requireUser();
  const p = await prisma.payment.findUnique({ where: { id: paymentId } });
  if (!p) return;
  await prisma.payment.update({ where: { id: paymentId }, data: { status } });
  revalidatePath("/financeiro/pagamentos");
  revalidatePath("/");
}

"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser } from "@/lib/auth";
import { FinanceMessageSchema, TransactionSchema } from "@/lib/validations";

function fdToObj(fd: FormData) {
  const obj: Record<string, any> = {};
  fd.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function createFinanceMessageAction(formData: FormData) {
  const user = await requireUser();
  const parsed = FinanceMessageSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/financeiro/mensagens?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const d = parsed.data;
  await prisma.financeMessage.create({
    data: {
      patientId: d.patientId || null,
      type: d.type,
      message: d.message,
      createdById: user.id,
    },
  });
  revalidatePath("/financeiro/mensagens");
  redirect(`/financeiro/mensagens?ok=${encodeURIComponent("Mensagem enviada")}`);
}

export async function updateFinanceMessageStatusAction(
  id: string,
  status: "ABERTA" | "EM_ANALISE" | "RESOLVIDA"
) {
  const user = await requireUser();
  await prisma.financeMessage.update({
    where: { id },
    data: {
      status,
      assigneeId: user.id,
      resolvedAt: status === "RESOLVIDA" ? new Date() : null,
    },
  });
  revalidatePath("/financeiro/mensagens");
}

export async function createTransactionAction(formData: FormData) {
  const user = await requireUser();
  const parsed = TransactionSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/financeiro?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const d = parsed.data;
  const patientId = d.patientId && d.patientId.length > 0 ? d.patientId : null;
  // Quando há paciente associado, a "fonte" é ignorada (o paciente já é a fonte).
  const source = patientId
    ? null
    : d.source && d.source.trim().length > 0
      ? d.source.trim()
      : null;
  await prisma.financialTransaction.create({
    data: {
      type: d.type,
      occurredAt: new Date(d.occurredAt),
      amount: d.amount,
      category: d.category,
      method: d.method ?? null,
      description: d.description ?? null,
      patientId,
      source,
      createdById: user.id,
    },
  });
  revalidatePath("/financeiro");
  redirect(`/financeiro?ok=${encodeURIComponent("Lançamento registrado")}`);
}

export async function deleteTransactionAction(id: string) {
  await requireUser();
  await prisma.financialTransaction.delete({ where: { id } });
  revalidatePath("/financeiro");
}

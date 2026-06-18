"use server";

import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { requireUser, hashPassword } from "@/lib/auth";
import { UserSchema } from "@/lib/validations";

function fdToObj(fd: FormData) {
  const obj: Record<string, any> = {};
  fd.forEach((v, k) => (obj[k] = v));
  return obj;
}

export async function createUserAction(formData: FormData) {
  await requireUser();
  const parsed = UserSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/configuracoes/usuarios?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const d = parsed.data;
  if (!d.password) {
    redirect(`/configuracoes/usuarios?err=${encodeURIComponent("Informe a senha")}`);
  }
  const exists = await prisma.user.findUnique({ where: { email: d.email.toLowerCase() } });
  if (exists) {
    redirect(`/configuracoes/usuarios?err=${encodeURIComponent("E-mail já cadastrado")}`);
  }
  await prisma.user.create({
    data: {
      name: d.name.trim(),
      email: d.email.toLowerCase().trim(),
      passwordHash: await hashPassword(d.password!),
      role: d.role,
      active: d.active,
    },
  });
  revalidatePath("/configuracoes/usuarios");
  redirect(`/configuracoes/usuarios?ok=${encodeURIComponent("Usuário criado")}`);
}

export async function updateUserAction(id: string, formData: FormData) {
  await requireUser();
  const parsed = UserSchema.safeParse(fdToObj(formData));
  if (!parsed.success) {
    redirect(
      `/configuracoes/usuarios?err=${encodeURIComponent(
        parsed.error.issues[0]?.message ?? "Dados inválidos"
      )}`
    );
  }
  const d = parsed.data;
  await prisma.user.update({
    where: { id },
    data: {
      name: d.name.trim(),
      email: d.email.toLowerCase().trim(),
      role: d.role,
      active: d.active,
      ...(d.password ? { passwordHash: await hashPassword(d.password) } : {}),
    },
  });
  revalidatePath("/configuracoes/usuarios");
  redirect(`/configuracoes/usuarios?ok=${encodeURIComponent("Usuário atualizado")}`);
}

export async function toggleUserActiveAction(id: string) {
  await requireUser();
  const u = await prisma.user.findUnique({ where: { id } });
  if (!u) return;
  await prisma.user.update({ where: { id }, data: { active: !u.active } });
  revalidatePath("/configuracoes/usuarios");
}

"use server";

import { z } from "zod";
import { authenticate, createSession } from "@/lib/auth";

const Schema = z.object({
  email: z.string().email("E-mail inválido"),
  password: z.string().min(1, "Informe a senha"),
});

export async function loginAction(formData: FormData): Promise<{ error?: string }> {
  const parsed = Schema.safeParse({
    email: formData.get("email"),
    password: formData.get("password"),
  });
  if (!parsed.success) {
    return { error: parsed.error.issues[0]?.message ?? "Dados inválidos" };
  }
  const user = await authenticate(parsed.data.email, parsed.data.password);
  if (!user) return { error: "E-mail ou senha incorretos" };
  await createSession(user);
  return {};
}

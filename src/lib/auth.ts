import "server-only";
import bcrypt from "bcryptjs";
import { SignJWT, jwtVerify } from "jose";
import { cookies, headers } from "next/headers";
import { redirect } from "next/navigation";
import { prisma } from "@/lib/prisma";

const COOKIE_NAME = "derci_session";
const ALG = "HS256";
const MAX_AGE_S = 60 * 60 * 24 * 7; // 7 dias

function getSecretKey(): Uint8Array {
  const secret = process.env.AUTH_SECRET;
  if (!secret || secret.length < 16) {
    throw new Error(
      "AUTH_SECRET não configurado. Defina uma chave de pelo menos 16 caracteres."
    );
  }
  return new TextEncoder().encode(secret);
}

export type SessionUser = {
  id: string;
  name: string;
  email: string;
  role: "ADMIN" | "ATENDIMENTO" | "FINANCEIRO";
};

export async function hashPassword(plain: string): Promise<string> {
  return bcrypt.hash(plain, 10);
}

export async function verifyPassword(plain: string, hash: string): Promise<boolean> {
  return bcrypt.compare(plain, hash);
}

/**
 * Detecta se a requisição atual está em HTTPS de fato. Confiamos primeiro
 * no header `x-forwarded-proto` que o Heroku/Cloudflare/etc adicionam.
 * Se ele disser "https", marcamos o cookie como `secure`. Em HTTP puro
 * (Docker local sem proxy, p.ex.) o cookie precisa ser não-secure para
 * o browser efetivamente enviá-lo.
 */
function isRequestHttps(): boolean {
  try {
    const h = headers();
    const fwd = h.get("x-forwarded-proto");
    if (fwd) return fwd.toLowerCase().includes("https");
    // Sem proxy, não há como ter certeza — assume HTTPS apenas em produção.
    return process.env.NODE_ENV === "production";
  } catch {
    return process.env.NODE_ENV === "production";
  }
}

export async function createSession(user: SessionUser): Promise<void> {
  const token = await new SignJWT({
    sub: user.id,
    name: user.name,
    email: user.email,
    role: user.role,
  })
    .setProtectedHeader({ alg: ALG })
    .setIssuedAt()
    .setExpirationTime(`${MAX_AGE_S}s`)
    .sign(getSecretKey());

  cookies().set({
    name: COOKIE_NAME,
    value: token,
    httpOnly: true,
    secure: isRequestHttps(),
    sameSite: "lax",
    path: "/",
    maxAge: MAX_AGE_S,
  });
}

export async function destroySession(): Promise<void> {
  cookies().delete(COOKIE_NAME);
}

export async function getSession(): Promise<SessionUser | null> {
  const token = cookies().get(COOKIE_NAME)?.value;
  if (!token) return null;
  try {
    const { payload } = await jwtVerify(token, getSecretKey());
    return {
      id: String(payload.sub ?? ""),
      name: String(payload.name ?? ""),
      email: String(payload.email ?? ""),
      role: (payload.role as SessionUser["role"]) ?? "ATENDIMENTO",
    };
  } catch {
    return null;
  }
}

/**
 * Lê a sessão e garante que o usuário ainda existe e está ativo no banco.
 * Use em Server Components/Actions de rotas autenticadas.
 *
 * NOTA: não chamamos `destroySession()` aqui — o Next.js 14 proíbe
 * modificar cookies dentro de Server Components, e isso explodia toda
 * vez que o cookie apontava para um user que não existe mais (ex.: seed
 * recriado com IDs novos). Apenas redirecionamos para /login; o cookie
 * obsoleto é sobrescrito no próximo login bem-sucedido.
 */
export async function requireUser(): Promise<SessionUser> {
  const sess = await getSession();
  if (!sess?.id) redirect("/login");
  const u = await prisma.user.findUnique({ where: { id: sess.id } });
  if (!u || !u.active) {
    redirect("/login");
  }
  return {
    id: u!.id,
    name: u!.name,
    email: u!.email,
    role: u!.role,
  };
}

export async function authenticate(email: string, password: string): Promise<SessionUser | null> {
  const user = await prisma.user.findUnique({ where: { email: email.toLowerCase().trim() } });
  if (!user || !user.active) return null;
  const ok = await verifyPassword(password, user.passwordHash);
  if (!ok) return null;
  return { id: user.id, name: user.name, email: user.email, role: user.role };
}

export const SESSION_COOKIE_NAME = COOKIE_NAME;

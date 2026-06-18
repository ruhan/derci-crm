import { PrismaClient } from "@prisma/client";

const globalForPrisma = globalThis as unknown as {
  prisma: PrismaClient | undefined;
};

/**
 * Em produção (Heroku Postgres) precisamos:
 *  - SSL obrigatório (sslmode=require)
 *  - Timeout de conexão maior (Heroku Postgres pode levar tempo para
 *    aceitar a primeira conexão após inatividade — default de 5s
 *    estoura com frequência).
 *  - Pool de conexões reduzido (essential-0 = 20 conexões totais e
 *    múltiplas instâncias do dyno compartilham a cota).
 *
 * Em dev/local mantemos a URL como está (Postgres local em 127.0.0.1
 * sem SSL).
 */
const LOCAL_HOSTS = new Set(["localhost", "127.0.0.1", "::1", "db", "postgres"]);

function buildDatabaseUrl(): string | undefined {
  const raw = process.env.DATABASE_URL;
  if (!raw) return undefined;
  try {
    const u = new URL(raw);
    // Em hosts locais (postgres em docker compose ou localhost) não mexer
    if (LOCAL_HOSTS.has(u.hostname)) return raw;
    if (!u.searchParams.has("sslmode")) u.searchParams.set("sslmode", "require");
    if (!u.searchParams.has("connect_timeout")) u.searchParams.set("connect_timeout", "30");
    if (!u.searchParams.has("pool_timeout")) u.searchParams.set("pool_timeout", "20");
    if (!u.searchParams.has("connection_limit")) u.searchParams.set("connection_limit", "5");
    return u.toString();
  } catch {
    return raw;
  }
}

function makeClient(): PrismaClient {
  const url = buildDatabaseUrl();
  return new PrismaClient({
    log: process.env.NODE_ENV === "development" ? ["error", "warn"] : ["error"],
    ...(url ? { datasources: { db: { url } } } : {}),
  });
}

export const prisma = globalForPrisma.prisma ?? makeClient();

if (process.env.NODE_ENV !== "production") globalForPrisma.prisma = prisma;

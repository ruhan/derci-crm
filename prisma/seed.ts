import { PrismaClient, Prisma } from "@prisma/client";
import bcrypt from "bcryptjs";
import { addDays, addWeeks, format, startOfWeek } from "date-fns";

const prisma = new PrismaClient();

async function hash(p: string) {
  return bcrypt.hash(p, 10);
}

function getMonday(d: Date) {
  const x = startOfWeek(d, { weekStartsOn: 1 });
  x.setHours(0, 0, 0, 0);
  return x;
}

async function main() {
  console.log("> Seeding fictitious data...");

  const adminEmail = (process.env.SEED_ADMIN_EMAIL || "admin@derci.local").toLowerCase();
  const adminPass = process.env.SEED_ADMIN_PASSWORD || "admin123";
  const adminName = process.env.SEED_ADMIN_NAME || "Administradora";

  const admin = await prisma.user.upsert({
    where: { email: adminEmail },
    update: { name: adminName },
    create: {
      name: adminName,
      email: adminEmail,
      passwordHash: await hash(adminPass),
      role: "ADMIN",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "atendimento@derci.local" },
    update: {},
    create: {
      name: "Atendimento Demo",
      email: "atendimento@derci.local",
      passwordHash: await hash("atendimento123"),
      role: "ATENDIMENTO",
      active: true,
    },
  });

  await prisma.user.upsert({
    where: { email: "financeiro@derci.local" },
    update: {},
    create: {
      name: "Juliana Financeiro",
      email: "financeiro@derci.local",
      passwordHash: await hash("financeiro123"),
      role: "FINANCEIRO",
      active: true,
    },
  });

  // Seed só popula dados demo na primeira execução (se NÃO houver pacientes ainda).
  // Para reseedar manualmente: `npm run db:reset && npm run db:seed`
  // Ou: defina FORCE_SEED=true para apagar tudo e recriar.
  const existing = await prisma.patient.count();
  const force = process.env.FORCE_SEED === "true";
  if (existing > 0 && !force) {
    console.log(`> Já existem ${existing} pacientes. Mantendo dados (FORCE_SEED=true para sobrescrever).`);
    return;
  }
  if (existing > 0 && force) {
    console.log(`> FORCE_SEED=true: removendo ${existing} pacientes...`);
    await prisma.taskComment.deleteMany({});
    await prisma.task.deleteMany({});
    await prisma.financialTransaction.deleteMany({});
    await prisma.payment.deleteMany({});
    await prisma.financeMessage.deleteMany({});
    await prisma.weeklyComment.deleteMany({});
    await prisma.patient.deleteMany({});
  }

  const today = new Date();
  const monday = getMonday(today);

  const seedPatients: Array<{
    name: string;
    phone: string;
    origin:
      | "INDICACAO"
      | "GOOGLE_ADS"
      | "INSTAGRAM"
      | "OUTRO";
    status:
      | "FEZ_PRIMEIRA_SESSAO"
      | "EM_CONVERSACAO"
      | "NAO_FECHOU_FINANCEIRO"
      | "PAROU_DE_RESPONDER"
      | "ATIVO"
      | "FECHADO";
    referrerName?: string;
    plan?: { sessions: 2 | 4 | 6; value: number; used: number };
    daysAgo: number;
  }> = [
    {
      name: "Ana Pereira",
      phone: "11987654321",
      origin: "INDICACAO",
      referrerName: "Dra. Marta Silva",
      status: "ATIVO",
      plan: { sessions: 4, value: 800, used: 2 },
      daysAgo: 28,
    },
    {
      name: "Bruno Costa",
      phone: "11912345678",
      origin: "INSTAGRAM",
      status: "ATIVO",
      plan: { sessions: 6, value: 1200, used: 1 },
      daysAgo: 14,
    },
    {
      name: "Camila Souza",
      phone: "11955554444",
      origin: "GOOGLE_ADS",
      status: "EM_CONVERSACAO",
      daysAgo: 3,
    },
    {
      name: "Daniel Lima",
      phone: "11944443333",
      origin: "INSTAGRAM",
      status: "FEZ_PRIMEIRA_SESSAO",
      daysAgo: 1,
    },
    {
      name: "Elaine Ribeiro",
      phone: "11933332222",
      origin: "INDICACAO",
      status: "ATIVO",
      plan: { sessions: 2, value: 400, used: 2 },
      daysAgo: 60,
    },
    {
      name: "Fernanda Alves",
      phone: "11922221111",
      origin: "INDICACAO",
      referrerName: "Carolina (paciente)",
      status: "PAROU_DE_RESPONDER",
      plan: { sessions: 4, value: 800, used: 3 },
      daysAgo: 45,
    },
    {
      name: "Gabriel Martins",
      phone: "11911110000",
      origin: "OUTRO",
      status: "FECHADO",
      daysAgo: 120,
    },
  ];

  for (const sp of seedPatients) {
    const entryDate = addDays(today, -sp.daysAgo);
    const patient = await prisma.patient.create({
      data: {
        name: sp.name,
        phone: sp.phone,
        origin: sp.origin,
        referrerName: sp.referrerName ?? null,
        entryDate,
        status: sp.status,
        createdById: admin.id,
        updatedById: admin.id,
        timeline: {
          create: {
            type: "ENTRADA",
            title: "Paciente cadastrado",
            authorId: admin.id,
            occurredAt: entryDate,
          },
        },
      },
    });

    if (sp.plan) {
      const plan = await prisma.treatmentPlan.create({
        data: {
          patientId: patient.id,
          totalSessions: sp.plan.sessions,
          usedSessions: sp.plan.used,
          totalValue: new Prisma.Decimal(sp.plan.value),
          startDate: entryDate,
          status:
            sp.plan.used >= sp.plan.sessions ? "FINALIZADO" : "ABERTO",
          createdById: admin.id,
        },
      });

      await prisma.payment.create({
        data: {
          patientId: patient.id,
          planId: plan.id,
          paidAt: entryDate,
          amount: new Prisma.Decimal(sp.plan.value),
          method: "PIX",
          category: "TERAPIA",
          status: "PAGO",
          createdById: admin.id,
        },
      });

      await prisma.financialTransaction.create({
        data: {
          type: "ENTRADA",
          occurredAt: entryDate,
          amount: new Prisma.Decimal(sp.plan.value),
          category: "TERAPIA",
          method: "PIX",
          description: `Plano de ${sp.plan.sessions} sessões - ${patient.name}`,
          patientId: patient.id,
          createdById: admin.id,
        },
      });

      // Algumas sessões realizadas
      for (let i = 0; i < sp.plan.used; i++) {
        const occurredAt = addDays(entryDate, i * 7 + 2);
        await prisma.session.create({
          data: {
            patientId: patient.id,
            planId: plan.id,
            occurredAt,
            durationMin: 90,
            summary: "Sessão realizada conforme planejado.",
            createdById: admin.id,
          },
        });
        await prisma.appointment.create({
          data: {
            patientId: patient.id,
            planId: plan.id,
            scheduledAt: occurredAt,
            durationMin: 90,
            status: "REALIZADO",
            createdById: admin.id,
          },
        });
      }
    }

    // Próximo atendimento agendado para pacientes ativos
    if (sp.status === "ATIVO") {
      await prisma.appointment.create({
        data: {
          patientId: patient.id,
          scheduledAt: addDays(monday, Math.floor(Math.random() * 5) + 1),
          durationMin: 90,
          status: "AGENDADO",
          createdById: admin.id,
        },
      });
    }

    if (sp.status === "EM_CONVERSACAO") {
      await prisma.task.create({
        data: {
          title: `Fechar plano com ${sp.name}`,
          type: "CONTATO_FECHAR_PLANO",
          patientId: patient.id,
          weekStart: monday,
          status: "A_FAZER",
          assigneeId: admin.id,
          createdById: admin.id,
        },
      });
    }
  }

  // Saídas do mês (exemplos)
  const start = new Date(today.getFullYear(), today.getMonth(), 5);
  await prisma.financialTransaction.createMany({
    data: [
      {
        type: "SAIDA",
        occurredAt: start,
        amount: new Prisma.Decimal(2200),
        category: "ALUGUEL",
        method: "TRANSFERENCIA",
        description: "Aluguel do consultório",
        createdById: admin.id,
      },
      {
        type: "SAIDA",
        occurredAt: addDays(start, 5),
        amount: new Prisma.Decimal(180),
        category: "PLATAFORMA",
        method: "CARTAO_CREDITO",
        description: "Plataforma de teleatendimento",
        createdById: admin.id,
      },
      {
        type: "SAIDA",
        occurredAt: addDays(start, 8),
        amount: new Prisma.Decimal(350),
        category: "MARKETING",
        method: "PIX",
        description: "Anúncios Instagram",
        createdById: admin.id,
      },
    ],
  });

  // Comentário semanal
  await prisma.weeklyComment.upsert({
    where: { weekStart: monday },
    update: { content: "Semana corrida: 2 renovações pendentes." },
    create: {
      weekStart: monday,
      content: "Semana corrida: 2 renovações pendentes.",
      authorId: admin.id,
    },
  });

  // Mensagem para financeiro de exemplo
  await prisma.financeMessage.create({
    data: {
      type: "DUVIDA_FINANCEIRA",
      message: "Verificar se o pagamento da Camila foi confirmado pelo PIX.",
      status: "ABERTA",
      createdById: admin.id,
    },
  });

  console.log("> Seed concluído.");
  console.log(`> Login: ${adminEmail} / ${adminPass}`);
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });

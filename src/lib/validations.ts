import { z } from "zod";

export const PATIENT_STATUSES = [
  "FEZ_PRIMEIRA_SESSAO",
  "EM_CONVERSACAO",
  "NAO_FECHOU_FINANCEIRO",
  "PAROU_DE_RESPONDER",
  "ATIVO",
  "FECHADO",
] as const;
export type PatientStatusValue = (typeof PATIENT_STATUSES)[number];

export const PATIENT_ORIGINS = [
  "INDICACAO",
  "GOOGLE_ADS",
  "INSTAGRAM",
  "OUTRO",
] as const;
export type PatientOriginValue = (typeof PATIENT_ORIGINS)[number];

export const PatientSchema = z.object({
  name: z.string().min(2, "Nome obrigatório"),
  phone: z.string().min(8, "Telefone obrigatório"),
  origin: z.enum(PATIENT_ORIGINS),
  referrerName: z.string().optional().nullable(),
  referrerNote: z.string().optional().nullable(),
  entryDate: z.string().min(1, "Data de entrada obrigatória"),
  status: z.enum(PATIENT_STATUSES),
  generalHistory: z.string().optional().nullable(),
  internalNotes: z.string().optional().nullable(),
});
export type PatientInput = z.infer<typeof PatientSchema>;

export const PlanSchema = z.object({
  patientId: z.string().min(1),
  totalSessions: z.coerce.number().int().refine((n) => [1, 2, 4, 6].includes(n), {
    message: "Plano deve ser de 1 (avulsa), 2, 4 ou 6 sessões",
  }),
  startDate: z.string().min(1, "Data de início obrigatória"),
  endDate: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const AppointmentSchema = z.object({
  patientId: z.string().min(1, "Selecione um paciente"),
  scheduledAt: z.string().min(1, "Data e hora obrigatórias"),
  durationMin: z.coerce.number().int().min(10).default(90),
  notes: z.string().optional().nullable(),
});

export const RescheduleAppointmentSchema = z.object({
  appointmentId: z.string().min(1),
  scheduledAt: z.string().min(1, "Data e hora obrigatórias"),
  durationMin: z.coerce.number().int().min(10).default(90),
  reason: z.string().optional().nullable(),
});

export const AppointmentStatusSchema = z.object({
  appointmentId: z.string().min(1),
  status: z.enum(["AGENDADO", "REALIZADO", "CANCELADO", "FALTOU", "REMARCADO"]),
  summary: z.string().optional().nullable(),
  notes: z.string().optional().nullable(),
});

export const PaymentSchema = z.object({
  patientId: z.string().optional().nullable(),
  planId: z.string().optional().nullable(),
  paidAt: z.string().min(1, "Data obrigatória"),
  amount: z.coerce.number().positive("Valor deve ser maior que zero"),
  method: z.enum([
    "ESPECIE",
    "PIX",
    "CARTAO_CREDITO",
    "CARTAO_DEBITO",
    "TRANSFERENCIA",
    "OUTRO",
  ]),
  category: z.enum(["TERAPIA", "LIVRO", "PALESTRA", "OUTRO"]),
  status: z
    .enum(["PAGO", "PENDENTE", "ATRASADO", "CANCELADO"])
    .default("PAGO"),
  notes: z.string().optional().nullable(),
});

export const TaskSchema = z.object({
  patientId: z.string().optional().nullable(),
  title: z.string().min(2, "Título obrigatório"),
  type: z
    .enum(["RENOVACAO", "CONTATO_FECHAR_PLANO", "PAGAMENTO_ATRASADO", "MENSAGEM_FINANCEIRO", "OUTRO"])
    .default("OUTRO"),
  description: z.string().optional().nullable(),
  weekStart: z.string().min(1),
  dueDate: z.string().optional().nullable(),
  assigneeId: z.string().optional().nullable(),
});

export const TaskStatusSchema = z.object({
  taskId: z.string().min(1),
  status: z.enum(["A_FAZER", "EM_ANDAMENTO", "CONCLUIDA", "NAO_DEU_CERTO", "CANCELADA"]),
});

export const TaskCommentSchema = z.object({
  taskId: z.string().min(1),
  content: z.string().min(1, "Comentário não pode ser vazio"),
});

export const WeeklyCommentSchema = z.object({
  weekStart: z.string().min(1),
  content: z.string().min(1, "Comentário não pode ser vazio"),
});

export const FinanceMessageSchema = z.object({
  patientId: z.string().optional().nullable(),
  type: z.enum([
    "NOVO_PLANO",
    "RENOVACAO",
    "PAGAMENTO_RECEBIDO",
    "PAGAMENTO_ATRASADO",
    "DUVIDA_FINANCEIRA",
    "OUTRO",
  ]),
  message: z.string().min(2, "Mensagem obrigatória"),
});

export const TransactionSchema = z
  .object({
    type: z.enum(["ENTRADA", "SAIDA"]),
    occurredAt: z.string().min(1),
    amount: z.coerce.number().positive(),
    category: z.enum([
      "TERAPIA",
      "LIVRO",
      "PALESTRA",
      "ALUGUEL",
      "IMPOSTOS",
      "PLATAFORMA",
      "MARKETING",
      "MATERIAL",
      "OUTRO",
    ]),
    method: z
      .enum(["ESPECIE", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "OUTRO"])
      .optional()
      .nullable(),
    description: z.string().optional().nullable(),
    patientId: z.string().optional().nullable(),
    source: z.string().optional().nullable(),
  })
  .superRefine((data, ctx) => {
    const hasPatient = !!(data.patientId && data.patientId.length > 0);
    const hasSource = !!(data.source && data.source.trim().length > 0);
    if (!hasPatient && !hasSource) {
      ctx.addIssue({
        code: z.ZodIssueCode.custom,
        path: ["source"],
        message: "Informe a fonte do lançamento ou selecione um paciente.",
      });
    }
  });

export const UserSchema = z.object({
  name: z.string().min(2),
  email: z.string().email(),
  password: z.string().min(6, "Senha deve ter pelo menos 6 caracteres").optional(),
  role: z.enum(["ADMIN", "ATENDIMENTO", "FINANCEIRO"]).default("ATENDIMENTO"),
  active: z.coerce.boolean().default(true),
});

export const ClosePatientSchema = z.object({
  patientId: z.string().min(1),
  reason: z.string().min(2, "Informe o motivo"),
  closedAt: z.string().min(1),
});

export const ReopenPatientSchema = z.object({
  patientId: z.string().min(1),
  reason: z.string().min(2, "Informe o motivo"),
  newStatus: z.enum([
    "FEZ_PRIMEIRA_SESSAO",
    "EM_CONVERSACAO",
    "NAO_FECHOU_FINANCEIRO",
    "PAROU_DE_RESPONDER",
    "ATIVO",
  ]),
});

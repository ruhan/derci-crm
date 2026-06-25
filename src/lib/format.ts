import { format, formatDistanceToNow } from "date-fns";
import { ptBR } from "date-fns/locale";
import { toValidDate } from "@/lib/dates";

export function formatBRL(value: number | string | null | undefined): string {
  if (value === null || value === undefined || value === "") return "R$ 0,00";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "R$ 0,00";
  return n.toLocaleString("pt-BR", {
    style: "currency",
    currency: "BRL",
    minimumFractionDigits: 2,
  });
}

export function fmtDate(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return "";
  return format(d, "dd/MM/yyyy", { locale: ptBR });
}

export function fmtDateTime(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return "";
  return format(d, "dd/MM/yyyy 'às' HH:mm", { locale: ptBR });
}

export function fmtTime(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return "";
  return format(d, "HH:mm", { locale: ptBR });
}

export function fmtRelative(value: Date | string | null | undefined): string {
  const d = toValidDate(value);
  if (!d) return "";
  return formatDistanceToNow(d, { locale: ptBR, addSuffix: true });
}

export function fmtPhone(raw: string): string {
  const d = (raw ?? "").replace(/\D/g, "");
  if (d.length === 11) return `(${d.slice(0, 2)}) ${d.slice(2, 7)}-${d.slice(7)}`;
  if (d.length === 10) return `(${d.slice(0, 2)}) ${d.slice(2, 6)}-${d.slice(6)}`;
  return raw;
}

export function onlyDigits(s: string | null | undefined): string {
  return (s ?? "").replace(/\D/g, "");
}

/**
 * Constrói um link wa.me para abrir conversa direta no WhatsApp com o telefone.
 * - Aceita o telefone em qualquer formato; usa só os dígitos.
 * - Se já tiver 12+ dígitos (com DDI), usa como está; senão prefixa "55" (Brasil).
 * - Aceita uma mensagem opcional (será URL-encoded).
 */
export function whatsappLink(rawPhone: string, message?: string): string {
  const digits = onlyDigits(rawPhone);
  const withCountry = digits.length >= 12 ? digits : `55${digits}`;
  const base = `https://wa.me/${withCountry}`;
  return message ? `${base}?text=${encodeURIComponent(message)}` : base;
}

// Mapeamentos de enums para rótulos amigáveis em pt-BR
export const PATIENT_STATUS_LABEL: Record<string, string> = {
  FEZ_PRIMEIRA_SESSAO: "Fez primeira sessão",
  EM_CONVERSACAO: "Em conversação",
  NAO_FECHOU_FINANCEIRO: "Não fechou por questão financeira",
  PAROU_DE_RESPONDER: "Parou de responder",
  ATIVO: "Ativo",
  FECHADO: "Fechado",
};

export const PATIENT_ORIGIN_LABEL: Record<string, string> = {
  INDICACAO: "Indicação",
  GOOGLE_ADS: "Google Ads",
  INSTAGRAM: "Instagram",
  OUTRO: "Outro",
};

export const PLAN_STATUS_LABEL: Record<string, string> = {
  AGUARDANDO_PAGAMENTO: "Aguardando pagamento",
  ABERTO: "Aberto",
  FINALIZADO: "Finalizado",
  CANCELADO: "Cancelado",
};

export const APPOINTMENT_STATUS_LABEL: Record<string, string> = {
  AGENDADO: "Agendado",
  REALIZADO: "Realizado",
  CANCELADO: "Cancelado",
  FALTOU: "Faltou",
  REMARCADO: "Remarcado",
};

export const TASK_TYPE_LABEL: Record<string, string> = {
  RENOVACAO: "Renovação com pagamento",
  CONTATO_FECHAR_PLANO: "Entrar em contato para fechar plano",
  PAGAMENTO_ATRASADO: "Pagamento em atraso",
  MENSAGEM_FINANCEIRO: "Mensagem para o financeiro",
  OUTRO: "Outro",
};

// Tipos disponíveis para o usuário escolher (filtros e formulário de nova tarefa).
// "MENSAGEM_FINANCEIRO" é mantido apenas para exibir tarefas legadas;
// não deve mais aparecer como opção selecionável.
export const SELECTABLE_TASK_TYPES: Array<{ value: string; label: string }> = [
  { value: "RENOVACAO", label: "Renovação com pagamento" },
  { value: "CONTATO_FECHAR_PLANO", label: "Entrar em contato para fechar plano" },
  { value: "PAGAMENTO_ATRASADO", label: "Pagamento em atraso" },
  { value: "OUTRO", label: "Outro" },
];

export const TASK_STATUS_LABEL: Record<string, string> = {
  A_FAZER: "A fazer",
  EM_ANDAMENTO: "Em andamento",
  CONCLUIDA: "Concluída",
  NAO_DEU_CERTO: "Não deu certo",
  CANCELADA: "Cancelada",
};

export const PAYMENT_METHOD_LABEL: Record<string, string> = {
  ESPECIE: "Espécie",
  PIX: "Pix",
  CARTAO_CREDITO: "Cartão de crédito",
  CARTAO_DEBITO: "Cartão de débito",
  TRANSFERENCIA: "Transferência",
  OUTRO: "Outro",
};

export const PAYMENT_CATEGORY_LABEL: Record<string, string> = {
  TERAPIA: "Terapia",
  LIVRO: "Livro",
  PALESTRA: "Palestra",
  OUTRO: "Outro",
};

export const PAYMENT_STATUS_LABEL: Record<string, string> = {
  PAGO: "Pago",
  PENDENTE: "Pendente",
  ATRASADO: "Atrasado",
  CANCELADO: "Cancelado",
};

export const FINANCIAL_TYPE_LABEL: Record<string, string> = {
  ENTRADA: "Entrada",
  SAIDA: "Saída",
};

export const FINANCIAL_CATEGORY_LABEL: Record<string, string> = {
  TERAPIA: "Terapia",
  LIVRO: "Livro",
  PALESTRA: "Palestra",
  ALUGUEL: "Aluguel",
  IMPOSTOS: "Impostos",
  PLATAFORMA: "Plataforma",
  MARKETING: "Marketing",
  MATERIAL: "Material",
  OUTRO: "Outro",
};

export const FINANCE_MESSAGE_TYPE_LABEL: Record<string, string> = {
  NOVO_PLANO: "Novo plano",
  RENOVACAO: "Renovação",
  PAGAMENTO_RECEBIDO: "Pagamento recebido",
  PAGAMENTO_ATRASADO: "Pagamento em atraso",
  DUVIDA_FINANCEIRA: "Dúvida financeira",
  OUTRO: "Outro",
};

export const FINANCE_MESSAGE_STATUS_LABEL: Record<string, string> = {
  ABERTA: "Aberta",
  EM_ANALISE: "Em análise",
  RESOLVIDA: "Resolvida",
};

export const TIMELINE_EVENT_LABEL: Record<string, string> = {
  ENTRADA: "Entrada do paciente",
  STATUS_ALTERADO: "Status alterado",
  PLANO_CRIADO: "Plano criado",
  PLANO_FINALIZADO: "Plano finalizado",
  PLANO_CANCELADO: "Plano cancelado",
  SESSAO_REALIZADA: "Sessão realizada",
  PAGAMENTO_REGISTRADO: "Pagamento registrado",
  TAREFA_CRIADA: "Tarefa criada",
  TAREFA_CONCLUIDA: "Tarefa concluída",
  COMENTARIO: "Comentário",
  PRONTUARIO_FECHADO: "Prontuário fechado",
  PRONTUARIO_REABERTO: "Prontuário reaberto",
};

export const USER_ROLE_LABEL: Record<string, string> = {
  ADMIN: "Administradora",
  ATENDIMENTO: "Atendimento",
  FINANCEIRO: "Financeiro",
};

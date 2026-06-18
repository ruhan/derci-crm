import { Badge } from "@/components/ui/badge";
import {
  PATIENT_STATUS_LABEL,
  PLAN_STATUS_LABEL,
  APPOINTMENT_STATUS_LABEL,
  TASK_STATUS_LABEL,
  PAYMENT_STATUS_LABEL,
  FINANCE_MESSAGE_STATUS_LABEL,
} from "@/lib/format";

type Variant =
  | "default"
  | "secondary"
  | "destructive"
  | "success"
  | "warning"
  | "info"
  | "muted"
  | "outline";

const PATIENT_VARIANT: Record<string, Variant> = {
  NOVO_CONTATO: "info",
  EM_NEGOCIACAO: "warning",
  ATIVO: "success",
  PAUSADO: "secondary",
  FECHADO: "muted",
  INATIVO: "muted",
};

const PLAN_VARIANT: Record<string, Variant> = {
  ABERTO: "success",
  AGUARDANDO_PAGAMENTO: "warning",
  FINALIZADO: "muted",
  CANCELADO: "destructive",
};

const APPT_VARIANT: Record<string, Variant> = {
  AGENDADO: "info",
  REALIZADO: "success",
  CANCELADO: "destructive",
  FALTOU: "warning",
  REMARCADO: "secondary",
};

const TASK_VARIANT: Record<string, Variant> = {
  A_FAZER: "info",
  EM_ANDAMENTO: "warning",
  CONCLUIDA: "success",
  NAO_DEU_CERTO: "destructive",
  CANCELADA: "muted",
};

const PAYMENT_VARIANT: Record<string, Variant> = {
  PAGO: "success",
  PENDENTE: "warning",
  ATRASADO: "destructive",
  CANCELADO: "muted",
};

const FINMSG_VARIANT: Record<string, Variant> = {
  ABERTA: "info",
  EM_ANALISE: "warning",
  RESOLVIDA: "success",
};

export function PatientStatusBadge({ status }: { status: string }) {
  return <Badge variant={PATIENT_VARIANT[status] ?? "default"}>{PATIENT_STATUS_LABEL[status] ?? status}</Badge>;
}
export function PlanStatusBadge({ status }: { status: string }) {
  return <Badge variant={PLAN_VARIANT[status] ?? "default"}>{PLAN_STATUS_LABEL[status] ?? status}</Badge>;
}
export function AppointmentStatusBadge({ status }: { status: string }) {
  return <Badge variant={APPT_VARIANT[status] ?? "default"}>{APPOINTMENT_STATUS_LABEL[status] ?? status}</Badge>;
}
export function TaskStatusBadge({ status }: { status: string }) {
  return <Badge variant={TASK_VARIANT[status] ?? "default"}>{TASK_STATUS_LABEL[status] ?? status}</Badge>;
}
export function PaymentStatusBadge({ status }: { status: string }) {
  return <Badge variant={PAYMENT_VARIANT[status] ?? "default"}>{PAYMENT_STATUS_LABEL[status] ?? status}</Badge>;
}
export function FinanceMessageStatusBadge({ status }: { status: string }) {
  return <Badge variant={FINMSG_VARIANT[status] ?? "default"}>{FINANCE_MESSAGE_STATUS_LABEL[status] ?? status}</Badge>;
}

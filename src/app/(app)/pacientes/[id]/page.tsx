import Link from "next/link";
import { headers } from "next/headers";
import { notFound } from "next/navigation";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  PatientStatusBadge,
  PlanStatusBadge,
  AppointmentStatusBadge,
  PaymentStatusBadge,
  TaskStatusBadge,
} from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import {
  fmtDate,
  fmtDateTime,
  fmtPhone,
  formatBRL,
  whatsappLink,
  PATIENT_ORIGIN_LABEL,
  PAYMENT_METHOD_LABEL,
  TIMELINE_EVENT_LABEL,
  TASK_TYPE_LABEL,
} from "@/lib/format";
import { Pencil, MessageCircle, Share2 } from "lucide-react";
import { NewPlanDialog } from "@/components/plan/new-plan-dialog";
import { RemovePlanButton } from "@/components/plan/remove-plan-button";
import { NewPaymentForm } from "@/components/payment/new-payment-form";
import { ClosePatientButton } from "@/components/patient/close-patient-button";
import { ReopenPatientButton } from "@/components/patient/reopen-patient-button";
import { DeletePatientButton } from "@/components/patient/delete-patient-button";
import { ScheduleAppointmentDialog } from "@/components/appointment/schedule-dialog";
import { DeleteSessionButton } from "@/components/session/delete-session-button";

export const dynamic = "force-dynamic";

export default async function PatientPage({ params }: { params: { id: string } }) {
  const p = await prisma.patient.findUnique({
    where: { id: params.id },
    include: {
      plans: { orderBy: { startDate: "desc" } },
      appointments: {
        orderBy: { scheduledAt: "desc" },
        take: 30,
        include: { session: true },
      },
      payments: { orderBy: { paidAt: "desc" }, take: 30 },
      tasks: { orderBy: { weekStart: "desc" }, take: 30 },
      timeline: { orderBy: { occurredAt: "desc" }, take: 50, include: { author: true } },
      sessions: { orderBy: { occurredAt: "desc" } },
    },
  });
  if (!p) notFound();

  const activePlan = p.plans.find((pl) => pl.status === "ABERTO") ?? null;
  const remaining = activePlan ? activePlan.totalSessions - activePlan.usedSessions : 0;
  const isClosed = p.status === "FECHADO";

  const h = headers();
  const proto = h.get("x-forwarded-proto") ?? "http";
  const host = h.get("x-forwarded-host") ?? h.get("host") ?? "localhost:3000";
  const baseUrl = process.env.NEXT_PUBLIC_APP_URL || `${proto}://${host}`;
  const shareLink = `${baseUrl}/pacientes/${p.id}`;
  const waShareHref = `https://wa.me/?text=${encodeURIComponent(
    `Olá, segue o link do paciente ${p.name}: ${shareLink}`
  )}`;
  const waDirectHref = whatsappLink(p.phone);

  return (
    <div className="space-y-5">
      <PageHeader
        title={p.name}
        description={fmtPhone(p.phone)}
        action={
          <div className="flex flex-wrap gap-2">
            <Button asChild variant="outline">
              <Link href={`/pacientes/${p.id}/editar`}>
                <Pencil className="h-5 w-5" /> Editar
              </Link>
            </Button>
            <Button asChild variant="success">
              <a href={waDirectHref} target="_blank" rel="noreferrer">
                <MessageCircle className="h-5 w-5" /> Mandar WhatsApp
              </a>
            </Button>
            <Button asChild variant="outline">
              <a href={waShareHref} target="_blank" rel="noreferrer">
                <Share2 className="h-5 w-5" /> Compartilhar
              </a>
            </Button>
          </div>
        }
      />

      {/* Cabeçalho com dados principais */}
      <Card>
        <CardContent className="pt-6 grid gap-4 sm:grid-cols-2">
          <Info label="Status" value={<PatientStatusBadge status={p.status} />} />
          <Info label="Origem" value={PATIENT_ORIGIN_LABEL[p.origin]} />
          {p.origin === "INDICACAO" && (
            <>
              <Info label="Indicado por" value={p.referrerName ?? "—"} />
              <Info label="Observação da indicação" value={p.referrerNote ?? "—"} />
            </>
          )}
          <Info label="Data de entrada" value={fmtDate(p.entryDate)} />
          <Info label="Telefone" value={
            <a
              href={waDirectHref}
              target="_blank"
              rel="noreferrer"
              className="inline-flex items-center gap-1 text-primary underline"
            >
              <MessageCircle className="h-4 w-4" /> {fmtPhone(p.phone)}
            </a>
          } />
          {p.closedAt && <Info label="Fechado em" value={`${fmtDate(p.closedAt)} - ${p.closedReason ?? ""}`} />}
          {p.reopenedAt && <Info label="Reaberto em" value={`${fmtDate(p.reopenedAt)} - ${p.reopenedReason ?? ""}`} />}
          {p.generalHistory && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-muted-foreground">Histórico geral</p>
              <p className="whitespace-pre-wrap text-base">{p.generalHistory}</p>
            </div>
          )}
          {p.internalNotes && (
            <div className="sm:col-span-2">
              <p className="text-sm font-semibold text-muted-foreground">Observações internas</p>
              <p className="whitespace-pre-wrap text-base">{p.internalNotes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Plano atual */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Plano atual</CardTitle>
          {!isClosed && (
            <NewPlanDialog patientId={p.id} hasActivePlan={!!activePlan} />
          )}
        </CardHeader>
        <CardContent>
          {activePlan ? (
            <div className="space-y-4">
              <div className="space-y-2">
                <div className="flex flex-wrap items-center gap-3">
                  <PlanStatusBadge status={activePlan.status} />
                  <span className="text-lg font-semibold">{activePlan.totalSessions} sessões</span>
                  <span className="text-base text-muted-foreground">
                    Iniciado em {fmtDate(activePlan.startDate)}
                  </span>
                </div>
                <p className="text-base">
                  Faltam <strong>{remaining}</strong> de <strong>{activePlan.totalSessions}</strong> sessões disponíveis.
                </p>
              </div>
              {!isClosed && (
                <RemovePlanButton
                  planId={activePlan.id}
                  patientId={p.id}
                  usedSessions={activePlan.usedSessions}
                  totalSessions={activePlan.totalSessions}
                />
              )}
            </div>
          ) : (
            <EmptyState
              title="Sem plano ativo"
              description="Crie um plano (avulso, 2, 4 ou 6 sessões) para liberar atendimentos."
            />
          )}
        </CardContent>
      </Card>

      {/* Histórico de planos */}
      {p.plans.length > 1 && (
        <Card>
          <CardHeader>
            <CardTitle>Planos anteriores</CardTitle>
          </CardHeader>
          <CardContent className="space-y-2">
            {p.plans.map((pl) => (
              <div key={pl.id} className="flex items-center justify-between gap-3 border-b last:border-0 py-2">
                <div>
                  <p className="font-semibold">{pl.totalSessions} sessões</p>
                  <p className="text-sm text-muted-foreground">
                    {fmtDate(pl.startDate)} — usadas {pl.usedSessions}/{pl.totalSessions}
                  </p>
                </div>
                <PlanStatusBadge status={pl.status} />
              </div>
            ))}
          </CardContent>
        </Card>
      )}

      {/* Atendimentos */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between gap-3">
          <CardTitle>Atendimentos</CardTitle>
          {!isClosed && (
            <ScheduleAppointmentDialog
              patients={[{ id: p.id, name: p.name }]}
              defaultPatientId={p.id}
            />
          )}
        </CardHeader>
        <CardContent>
          {p.appointments.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum atendimento registrado.</p>
          ) : (
            <ul className="divide-y">
              {p.appointments.map((a) => (
                <li key={a.id} className="py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
                  <div>
                    <p className="font-medium">{fmtDateTime(a.scheduledAt)} ({a.durationMin} min)</p>
                    {a.notes && (
                      <p className="text-sm text-muted-foreground">{a.notes}</p>
                    )}
                    {a.session?.summary && (
                      <p className="text-sm text-muted-foreground mt-1">{a.session.summary}</p>
                    )}
                  </div>
                  <div className="flex flex-wrap items-center gap-2">
                    <AppointmentStatusBadge status={a.status} />
                    {a.status === "REALIZADO" && (
                      <DeleteSessionButton
                        sessionId={a.session?.id}
                        appointmentId={a.id}
                        patientId={p.id}
                        occurredAtLabel={fmtDateTime(a.scheduledAt)}
                        returnTo={`/pacientes/${p.id}`}
                      />
                    )}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Sessões realizadas */}
      <Card>
        <CardHeader>
          <CardTitle>Sessões realizadas</CardTitle>
        </CardHeader>
        <CardContent>
          {p.sessions.length === 0 ? (
            <p className="text-base text-muted-foreground">Ainda não há sessões registradas.</p>
          ) : (
            <ul className="space-y-3">
              {p.sessions.map((s) => (
                <li key={s.id} className="border-l-4 border-success pl-3 flex flex-col sm:flex-row sm:items-start sm:justify-between gap-3">
                  <div>
                    <p className="text-sm text-muted-foreground">{fmtDateTime(s.occurredAt)}</p>
                    {s.summary ? (
                      <p className="whitespace-pre-wrap text-base">{s.summary}</p>
                    ) : (
                      <p className="text-base text-muted-foreground italic">Sem descrição</p>
                    )}
                  </div>
                  <DeleteSessionButton
                    sessionId={s.id}
                    appointmentId={s.appointmentId}
                    patientId={p.id}
                    occurredAtLabel={fmtDateTime(s.occurredAt)}
                    returnTo={`/pacientes/${p.id}`}
                  />
                </li>
              ))}
            </ul>
          )}
          <p className="mt-4 text-xs text-muted-foreground">
            Aviso: a descrição deve ser breve e objetiva. Evite registrar dados clínicos sensíveis no MVP.
          </p>
        </CardContent>
      </Card>

      {/* Pagamentos */}
      <Card>
        <CardHeader>
          <CardTitle>Pagamentos</CardTitle>
        </CardHeader>
        <CardContent className="space-y-4">
          {p.payments.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum pagamento registrado.</p>
          ) : (
            <ul className="divide-y">
              {p.payments.map((pay) => (
                <li key={pay.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{formatBRL(pay.amount.toString())}</p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(pay.paidAt)} — {PAYMENT_METHOD_LABEL[pay.method]}
                    </p>
                  </div>
                  <PaymentStatusBadge status={pay.status} />
                </li>
              ))}
            </ul>
          )}
          {!isClosed && (
            <div className="border-t pt-4">
              <h3 className="text-base font-semibold mb-3">Registrar pagamento</h3>
              <NewPaymentForm
                patientId={p.id}
                plans={p.plans
                  .filter((pl) => pl.status !== "CANCELADO")
                  .map((pl) => ({
                    id: pl.id,
                    label: `${pl.totalSessions} sessões - ${pl.status} - ${fmtDate(pl.startDate)}`,
                  }))}
              />
            </div>
          )}
        </CardContent>
      </Card>

      {/* Tarefas relacionadas */}
      <Card>
        <CardHeader>
          <CardTitle>Tarefas relacionadas</CardTitle>
        </CardHeader>
        <CardContent>
          {p.tasks.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhuma tarefa.</p>
          ) : (
            <ul className="divide-y">
              {p.tasks.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-medium">{t.title}</p>
                    <p className="text-sm text-muted-foreground">
                      {TASK_TYPE_LABEL[t.type]} — Semana de {fmtDate(t.weekStart)}
                    </p>
                  </div>
                  <TaskStatusBadge status={t.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>

      {/* Histórico (timeline) */}
      <Card>
        <CardHeader>
          <CardTitle>Histórico do paciente</CardTitle>
        </CardHeader>
        <CardContent>
          {p.timeline.length === 0 ? (
            <p className="text-base text-muted-foreground">Sem eventos ainda.</p>
          ) : (
            <ol className="relative border-l-2 border-muted pl-5 space-y-4">
              {p.timeline.map((ev) => (
                <li key={ev.id} className="relative">
                  <span className="absolute -left-[27px] top-1 h-3 w-3 rounded-full bg-primary" />
                  <p className="text-sm text-muted-foreground">{fmtDateTime(ev.occurredAt)}</p>
                  <p className="font-semibold">
                    {TIMELINE_EVENT_LABEL[ev.type] ?? ev.type}: {ev.title}
                  </p>
                  {ev.description && (
                    <p className="text-base whitespace-pre-wrap">{ev.description}</p>
                  )}
                  {ev.author?.name && (
                    <p className="text-xs text-muted-foreground">por {ev.author.name}</p>
                  )}
                </li>
              ))}
            </ol>
          )}
        </CardContent>
      </Card>

      {/* Fechar / reabrir / excluir */}
      <Card>
        <CardHeader>
          <CardTitle>Ações do prontuário</CardTitle>
        </CardHeader>
        <CardContent className="flex flex-col gap-4 sm:flex-row sm:flex-wrap sm:items-center">
          {isClosed ? <ReopenPatientButton patientId={p.id} /> : <ClosePatientButton patientId={p.id} />}
          <DeletePatientButton patientId={p.id} patientName={p.name} />
        </CardContent>
      </Card>
    </div>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <p className="text-sm font-semibold text-muted-foreground">{label}</p>
      <p className="text-base">{value}</p>
    </div>
  );
}

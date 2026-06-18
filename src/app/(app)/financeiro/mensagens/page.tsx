import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { fmtDateTime, FINANCE_MESSAGE_TYPE_LABEL } from "@/lib/format";
import { FinanceMessageStatusBadge } from "@/components/ui/status-badge";
import { createFinanceMessageAction, updateFinanceMessageStatusAction } from "@/server/actions/finance";
import { FinMsgStatusButton } from "@/components/finance/finmsg-status-button";

export const dynamic = "force-dynamic";

export default async function FinMsgPage({ searchParams }: { searchParams: { status?: string } }) {
  const where: any = {};
  if (searchParams.status) where.status = searchParams.status;

  const [msgs, patients] = await Promise.all([
    prisma.financeMessage.findMany({
      where,
      include: { patient: { select: { name: true, id: true } }, createdBy: { select: { name: true } } },
      orderBy: [{ status: "asc" }, { createdAt: "desc" }],
    }),
    prisma.patient.findMany({
      where: { status: { notIn: ["INATIVO"] } },
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Mensagens para o financeiro"
        description="Mensagens internas sobre planos, pagamentos e dúvidas financeiras."
      />

      <Card>
        <CardHeader>
          <CardTitle>Nova mensagem</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createFinanceMessageAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="type">Tipo</Label>
              <select
                id="type"
                name="type"
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
                defaultValue="DUVIDA_FINANCEIRA"
              >
                {Object.entries(FINANCE_MESSAGE_TYPE_LABEL).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="patientId">Paciente (opcional)</Label>
              <select
                id="patientId"
                name="patientId"
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
                defaultValue=""
              >
                <option value="">— Sem paciente —</option>
                {patients.map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2 sm:col-span-2">
              <Label htmlFor="message">Mensagem</Label>
              <Textarea id="message" name="message" rows={3} required />
            </div>
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" size="lg">
                Enviar
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <form className="flex items-center gap-2" method="get">
        <select
          name="status"
          defaultValue={searchParams.status ?? ""}
          className="h-12 rounded-lg border-2 border-input bg-background px-4 text-base"
        >
          <option value="">Todas</option>
          <option value="ABERTA">Abertas</option>
          <option value="EM_ANALISE">Em análise</option>
          <option value="RESOLVIDA">Resolvidas</option>
        </select>
        <Button variant="secondary" type="submit">
          Filtrar
        </Button>
      </form>

      <ul className="space-y-3">
        {msgs.map((m) => (
          <li key={m.id}>
            <Card>
              <CardContent className="pt-5 space-y-3">
                <div className="flex items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      {FINANCE_MESSAGE_TYPE_LABEL[m.type]}
                      {m.patient && (
                        <>
                          {" — "}
                          <Link href={`/pacientes/${m.patient.id}`} className="underline">
                            {m.patient.name}
                          </Link>
                        </>
                      )}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDateTime(m.createdAt)}
                      {m.createdBy?.name ? ` • ${m.createdBy.name}` : ""}
                    </p>
                    <p className="mt-2 whitespace-pre-wrap text-base">{m.message}</p>
                  </div>
                  <FinanceMessageStatusBadge status={m.status} />
                </div>
                <div className="flex flex-wrap gap-2 border-t pt-3">
                  <FinMsgStatusButton id={m.id} target="ABERTA" disabled={m.status === "ABERTA"}>
                    Abrir
                  </FinMsgStatusButton>
                  <FinMsgStatusButton id={m.id} target="EM_ANALISE" disabled={m.status === "EM_ANALISE"}>
                    Em análise
                  </FinMsgStatusButton>
                  <FinMsgStatusButton id={m.id} target="RESOLVIDA" disabled={m.status === "RESOLVIDA"}>
                    Resolver
                  </FinMsgStatusButton>
                </div>
              </CardContent>
            </Card>
          </li>
        ))}
        {msgs.length === 0 && <p className="text-muted-foreground">Sem mensagens.</p>}
      </ul>
    </div>
  );
}

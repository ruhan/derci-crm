import Link from "next/link";
import { startOfMonth, endOfMonth, parseISO, format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import {
  formatBRL,
  fmtDate,
  FINANCIAL_CATEGORY_LABEL,
  FINANCIAL_TYPE_LABEL,
  PAYMENT_METHOD_LABEL,
} from "@/lib/format";
import { NewTransactionDialog } from "@/components/finance/new-transaction-dialog";
import { DeleteTransactionButton } from "@/components/finance/delete-transaction-button";
import { Badge } from "@/components/ui/badge";

export const dynamic = "force-dynamic";

export default async function FinancePage({
  searchParams,
}: {
  searchParams: { month?: string; type?: string; category?: string };
}) {
  const now = new Date();
  const monthDate = searchParams.month
    ? parseISO(`${searchParams.month}-01`)
    : startOfMonth(now);
  const from = startOfMonth(monthDate);
  const to = endOfMonth(monthDate);
  const monthStr = format(monthDate, "yyyy-MM");

  const where: any = { occurredAt: { gte: from, lte: to } };
  if (searchParams.type === "ENTRADA" || searchParams.type === "SAIDA") where.type = searchParams.type;
  if (searchParams.category) where.category = searchParams.category;

  const [txs, allTxs, patients] = await Promise.all([
    prisma.financialTransaction.findMany({
      where,
      include: { patient: { select: { name: true, id: true } } },
      orderBy: { occurredAt: "desc" },
    }),
    prisma.financialTransaction.findMany({
      where: { occurredAt: { gte: from, lte: to } },
    }),
    prisma.patient.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const totalIn = allTxs
    .filter((t) => t.type === "ENTRADA")
    .reduce((s, t) => s + Number(t.amount), 0);
  const totalOut = allTxs
    .filter((t) => t.type === "SAIDA")
    .reduce((s, t) => s + Number(t.amount), 0);
  const balance = totalIn - totalOut;

  const prev = format(addMonths(monthDate, -1), "yyyy-MM");
  const next = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Financeiro"
        description={format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
        action={<NewTransactionDialog patients={patients} />}
      />

      <div className="flex flex-col gap-3 sm:flex-row sm:items-center">
        <div className="flex items-center gap-2">
          <Button variant="outline" size="icon" asChild>
            <Link href={`/financeiro?month=${prev}`} aria-label="Mês anterior">
              <ChevronLeft className="h-5 w-5" />
            </Link>
          </Button>
          <Button variant="outline" asChild>
            <Link href="/financeiro">Este mês</Link>
          </Button>
          <Button variant="outline" size="icon" asChild>
            <Link href={`/financeiro?month=${next}`} aria-label="Próximo mês">
              <ChevronRight className="h-5 w-5" />
            </Link>
          </Button>
        </div>
        <div className="flex flex-wrap gap-2 sm:ml-auto">
          <Button asChild variant="secondary">
            <Link href={`/financeiro/pagamentos?month=${monthStr}`}>Pagamentos</Link>
          </Button>
          <Button asChild variant="secondary">
            <Link href="/financeiro/mensagens">Mensagens para o financeiro</Link>
          </Button>
        </div>
      </div>

      <div className="grid gap-3 sm:grid-cols-3">
        <SummaryCard label="Entradas" value={totalIn} accent="success" />
        <SummaryCard label="Saídas" value={totalOut} accent="destructive" />
        <SummaryCard label="Saldo" value={balance} accent={balance >= 0 ? "success" : "destructive"} />
      </div>

      <form className="flex flex-wrap items-end gap-3" method="get">
        <input type="hidden" name="month" value={monthStr} />
        <div className="space-y-1">
          <label className="text-sm font-semibold">Tipo</label>
          <select
            name="type"
            defaultValue={searchParams.type ?? ""}
            className="h-12 rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">Todos</option>
            <option value="ENTRADA">Entradas</option>
            <option value="SAIDA">Saídas</option>
          </select>
        </div>
        <div className="space-y-1">
          <label className="text-sm font-semibold">Categoria</label>
          <select
            name="category"
            defaultValue={searchParams.category ?? ""}
            className="h-12 rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">Todas</option>
            {Object.entries(FINANCIAL_CATEGORY_LABEL).map(([k, v]) => (
              <option key={k} value={k}>
                {v}
              </option>
            ))}
          </select>
        </div>
        <Button variant="secondary" type="submit" size="lg">
          Filtrar
        </Button>
      </form>

      <Card>
        <CardHeader>
          <CardTitle>Movimentações do mês</CardTitle>
        </CardHeader>
        <CardContent>
          {txs.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum lançamento neste mês.</p>
          ) : (
            <ul className="divide-y">
              {txs.map((t) => (
                <li key={t.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">
                      <Badge variant={t.type === "ENTRADA" ? "success" : "destructive"} className="mr-2">
                        {FINANCIAL_TYPE_LABEL[t.type]}
                      </Badge>
                      {formatBRL(t.amount.toString())}
                    </p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(t.occurredAt)} — {FINANCIAL_CATEGORY_LABEL[t.category]}
                      {t.method ? ` — ${PAYMENT_METHOD_LABEL[t.method]}` : ""}
                      {t.patient
                        ? ` — ${t.patient.name}`
                        : t.source
                          ? ` — Outro — ${t.source}`
                          : " — Outro"}
                    </p>
                    {t.description && <p className="text-sm">{t.description}</p>}
                  </div>
                  <DeleteTransactionButton id={t.id} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function SummaryCard({
  label,
  value,
  accent,
}: {
  label: string;
  value: number;
  accent: "success" | "destructive";
}) {
  const color = accent === "success" ? "text-success" : "text-destructive";
  return (
    <Card>
      <CardContent className="pt-5 pb-5">
        <p className="text-sm font-semibold text-muted-foreground">{label}</p>
        <p className={`mt-1 text-3xl font-bold ${color}`}>{formatBRL(value)}</p>
      </CardContent>
    </Card>
  );
}

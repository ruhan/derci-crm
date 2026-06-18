import Link from "next/link";
import { startOfMonth, endOfMonth, parseISO, format, addMonths } from "date-fns";
import { ptBR } from "date-fns/locale";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { PaymentStatusBadge } from "@/components/ui/status-badge";
import { fmtDate, formatBRL, PAYMENT_METHOD_LABEL, PAYMENT_CATEGORY_LABEL } from "@/lib/format";
import { NewPaymentForm } from "@/components/payment/new-payment-form";

export const dynamic = "force-dynamic";

export default async function PaymentsPage({
  searchParams,
}: {
  searchParams: { month?: string; status?: string };
}) {
  const monthDate = searchParams.month
    ? parseISO(`${searchParams.month}-01`)
    : startOfMonth(new Date());
  const from = startOfMonth(monthDate);
  const to = endOfMonth(monthDate);
  const monthStr = format(monthDate, "yyyy-MM");

  const where: any = { paidAt: { gte: from, lte: to } };
  if (searchParams.status) where.status = searchParams.status;

  const [payments, patients] = await Promise.all([
    prisma.payment.findMany({
      where,
      include: { patient: { select: { name: true, id: true } } },
      orderBy: { paidAt: "desc" },
    }),
    prisma.patient.findMany({
      orderBy: { name: "asc" },
      select: { id: true, name: true },
    }),
  ]);

  const prev = format(addMonths(monthDate, -1), "yyyy-MM");
  const next = format(addMonths(monthDate, 1), "yyyy-MM");

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pagamentos"
        description={format(monthDate, "MMMM 'de' yyyy", { locale: ptBR })}
      />

      <div className="flex items-center gap-2">
        <Button variant="outline" size="icon" asChild>
          <Link href={`/financeiro/pagamentos?month=${prev}`} aria-label="Mês anterior">
            <ChevronLeft className="h-5 w-5" />
          </Link>
        </Button>
        <Button variant="outline" asChild>
          <Link href="/financeiro/pagamentos">Este mês</Link>
        </Button>
        <Button variant="outline" size="icon" asChild>
          <Link href={`/financeiro/pagamentos?month=${next}`} aria-label="Próximo mês">
            <ChevronRight className="h-5 w-5" />
          </Link>
        </Button>
        <form className="ml-auto flex items-center gap-2" method="get">
          <input type="hidden" name="month" value={monthStr} />
          <select
            name="status"
            defaultValue={searchParams.status ?? ""}
            className="h-12 rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">Todos os status</option>
            <option value="PAGO">Pago</option>
            <option value="PENDENTE">Pendente</option>
            <option value="ATRASADO">Atrasado</option>
            <option value="CANCELADO">Cancelado</option>
          </select>
          <Button variant="secondary" type="submit">
            Filtrar
          </Button>
        </form>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Registrar pagamento</CardTitle>
        </CardHeader>
        <CardContent>
          <NewPaymentForm showPatientSelect patients={patients} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Pagamentos do mês</CardTitle>
        </CardHeader>
        <CardContent>
          {payments.length === 0 ? (
            <p className="text-base text-muted-foreground">Nenhum pagamento neste mês.</p>
          ) : (
            <ul className="divide-y">
              {payments.map((p) => (
                <li key={p.id} className="py-3 flex items-center justify-between gap-3">
                  <div>
                    <p className="font-semibold">{formatBRL(p.amount.toString())}</p>
                    <p className="text-sm text-muted-foreground">
                      {fmtDate(p.paidAt)} — {PAYMENT_METHOD_LABEL[p.method]} —{" "}
                      {PAYMENT_CATEGORY_LABEL[p.category]}
                    </p>
                    {p.patient && (
                      <Link
                        href={`/pacientes/${p.patient.id}`}
                        className="text-sm text-primary underline"
                      >
                        {p.patient.name}
                      </Link>
                    )}
                  </div>
                  <PaymentStatusBadge status={p.status} />
                </li>
              ))}
            </ul>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

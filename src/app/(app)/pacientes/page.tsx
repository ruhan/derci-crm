import Link from "next/link";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { PatientStatusBadge } from "@/components/ui/status-badge";
import { EmptyState } from "@/components/ui/empty-state";
import { fmtPhone, PATIENT_STATUS_LABEL } from "@/lib/format";
import { PATIENT_STATUSES } from "@/lib/validations";
import { matchesAccentInsensitive } from "@/lib/utils";
import { Plus, Search, Users } from "lucide-react";

export const dynamic = "force-dynamic";

const ALL_STATUS = PATIENT_STATUSES;

export default async function PatientsPage({
  searchParams,
}: {
  searchParams: { q?: string; status?: string };
}) {
  const q = (searchParams.q ?? "").trim();
  const status = (searchParams.status ?? "").trim();

  const where: any = {};
  if (status && (ALL_STATUS as readonly string[]).includes(status)) where.status = status;

  const digits = q.replace(/\D/g, "");

  let patients = await prisma.patient.findMany({
    where,
    orderBy: [{ status: "asc" }, { name: "asc" }],
    include: {
      plans: { where: { status: "ABERTO" }, take: 1 },
    },
  });

  if (q) {
    patients = patients.filter(
      (p) =>
        matchesAccentInsensitive(p.name, q) ||
        (digits.length > 0 && p.phone.includes(digits))
    );
  }

  patients = patients.slice(0, 200);

  return (
    <div className="space-y-5">
      <PageHeader
        title="Pacientes"
        description="Cadastre e acompanhe contatos e pacientes."
        action={
          <Button asChild size="lg">
            <Link href="/pacientes/novo">
              <Plus className="h-5 w-5" /> Novo paciente
            </Link>
          </Button>
        }
      />

      <form className="flex flex-col gap-3 sm:flex-row" method="get">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 h-5 w-5 -translate-y-1/2 text-muted-foreground" />
          <Input
            name="q"
            defaultValue={q}
            placeholder="Buscar por nome ou telefone"
            className="pl-10"
          />
        </div>
        <select
          name="status"
          defaultValue={status}
          className="h-12 rounded-lg border-2 border-input bg-background px-4 text-base"
        >
          <option value="">Todos os status</option>
          {ALL_STATUS.map((s) => (
            <option key={s} value={s}>
              {PATIENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
        <Button type="submit" variant="secondary" size="lg">
          Filtrar
        </Button>
      </form>

      {patients.length === 0 ? (
        <EmptyState
          icon={<Users className="h-10 w-10" />}
          title="Nenhum paciente encontrado"
          description={q || status ? "Tente alterar os filtros." : "Comece cadastrando um novo paciente."}
          action={
            <Button asChild size="lg">
              <Link href="/pacientes/novo">
                <Plus className="h-5 w-5" /> Novo paciente
              </Link>
            </Button>
          }
        />
      ) : (
        <ul className="grid gap-3">
          {patients.map((p) => (
            <li key={p.id}>
              <Card className="p-0">
                <Link
                  href={`/pacientes/${p.id}`}
                  className="flex items-center justify-between gap-4 p-4 hover:bg-accent/50 rounded-2xl transition-colors"
                >
                  <div className="min-w-0">
                    <p className="text-lg font-semibold truncate">{p.name}</p>
                    <p className="text-base text-muted-foreground">{fmtPhone(p.phone)}</p>
                    {p.plans[0] && (
                      <p className="text-sm text-muted-foreground mt-1">
                        Plano aberto: {p.plans[0].totalSessions - p.plans[0].usedSessions} de{" "}
                        {p.plans[0].totalSessions} sessões disponíveis
                      </p>
                    )}
                  </div>
                  <PatientStatusBadge status={p.status} />
                </Link>
              </Card>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
}

import { notFound } from "next/navigation";
import { format } from "date-fns";
import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { PatientForm } from "@/components/patient/patient-form";
import { updatePatientAction } from "@/server/actions/patients";

export const dynamic = "force-dynamic";

export default async function EditPatientPage({
  params,
  searchParams,
}: {
  params: { id: string };
  searchParams: { err?: string };
}) {
  const p = await prisma.patient.findUnique({ where: { id: params.id } });
  if (!p) notFound();

  const action = updatePatientAction.bind(null, p.id);

  return (
    <div className="space-y-5">
      <PageHeader title={`Editar: ${p.name}`} description="Atualize os dados do paciente." />
      {searchParams.err && (
        <div className="rounded-lg bg-destructive/10 p-4 text-base font-medium text-destructive">
          {searchParams.err}
        </div>
      )}
      <PatientForm
        action={action}
        cancelHref={`/pacientes/${p.id}`}
        submitLabel="Salvar alterações"
        initial={{
          name: p.name,
          phone: p.phone,
          origin: p.origin as any,
          referrerName: p.referrerName,
          referrerNote: p.referrerNote,
          entryDate: format(p.entryDate, "yyyy-MM-dd"),
          status: p.status as any,
          generalHistory: p.generalHistory,
          internalNotes: p.internalNotes,
        }}
      />
    </div>
  );
}

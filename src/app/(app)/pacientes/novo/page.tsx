import { PageHeader } from "@/components/ui/page-header";
import { PatientForm } from "@/components/patient/patient-form";
import { format } from "date-fns";
import { createPatientAction } from "@/server/actions/patients";

export const metadata = { title: "Novo paciente - Derci CRM" };

export default function NewPatientPage({ searchParams }: { searchParams: { err?: string } }) {
  return (
    <div className="space-y-5">
      <PageHeader title="Novo paciente" description="Cadastre um novo contato ou paciente." />
      {searchParams.err && (
        <div className="rounded-lg bg-destructive/10 p-4 text-base font-medium text-destructive">
          {searchParams.err}
        </div>
      )}
      <PatientForm
        action={createPatientAction}
        initial={{
          status: "NOVO_CONTATO",
          origin: "INDICACAO",
          entryDate: format(new Date(), "yyyy-MM-dd"),
        }}
        submitLabel="Salvar paciente"
      />
    </div>
  );
}

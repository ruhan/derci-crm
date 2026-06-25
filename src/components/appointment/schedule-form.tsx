"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PatientCombobox } from "@/components/patient/patient-combobox";

export function ScheduleAppointmentForm({
  patients,
  defaultPatientId,
  defaultDate,
  action,
  pending = false,
  // compact é mantido por compatibilidade; hoje o layout é igual nos dois casos.
  compact: _compact,
}: {
  patients: { id: string; name: string }[];
  defaultPatientId?: string;
  defaultDate?: string;
  action: (formData: FormData) => void;
  pending?: boolean;
  compact?: boolean;
}) {
  // Quando há apenas um paciente possível (ex.: detalhe do paciente), mostra
  // só o nome dele; senão usa o combobox com busca.
  const fixedSingle = !!defaultPatientId && patients.length === 1;
  const fixedName = fixedSingle ? patients[0].name : null;

  return (
    <form action={action} className="grid gap-4 sm:grid-cols-2">
      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="patient-combobox">Paciente</Label>
        {fixedSingle ? (
          <>
            <input type="hidden" name="patientId" value={defaultPatientId} />
            <div className="h-12 w-full rounded-lg border-2 border-input bg-muted px-4 text-base flex items-center">
              {fixedName}
            </div>
          </>
        ) : (
          <PatientCombobox
            patients={patients}
            defaultPatientId={defaultPatientId}
            required
          />
        )}
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Data e hora</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={defaultDate ?? format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          required
          disabled={pending}
        />
      </div>
      <div className="space-y-2">
        <Label htmlFor="durationMin">Duração (min)</Label>
        <Input
          id="durationMin"
          name="durationMin"
          type="number"
          min="10"
          step="5"
          defaultValue={90}
          required
          disabled={pending}
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea id="notes" name="notes" rows={2} disabled={pending} />
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <Button size="lg" type="submit" disabled={pending}>
          {pending ? "Agendando..." : "Agendar atendimento"}
        </Button>
      </div>
    </form>
  );
}

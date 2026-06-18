"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createAppointmentAction } from "@/server/actions/appointments";

export function ScheduleAppointmentForm({
  patients,
  defaultPatientId,
  defaultDate,
  compact = false,
}: {
  patients: { id: string; name: string }[];
  defaultPatientId?: string;
  defaultDate?: string;
  compact?: boolean;
}) {
  return (
    <form action={createAppointmentAction} className="grid gap-4 sm:grid-cols-2">
      <div className={compact ? "space-y-2 sm:col-span-2" : "space-y-2 sm:col-span-2"}>
        <Label htmlFor="patientId">Paciente</Label>
        <select
          id="patientId"
          name="patientId"
          required
          defaultValue={defaultPatientId ?? ""}
          className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
        >
          <option value="" disabled>
            Selecione um paciente
          </option>
          {patients.map((p) => (
            <option key={p.id} value={p.id}>
              {p.name}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="scheduledAt">Data e hora</Label>
        <Input
          id="scheduledAt"
          name="scheduledAt"
          type="datetime-local"
          defaultValue={defaultDate ?? format(new Date(), "yyyy-MM-dd'T'HH:mm")}
          required
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
          defaultValue={50}
          required
        />
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <Button size="lg" type="submit">
          Agendar atendimento
        </Button>
      </div>
    </form>
  );
}

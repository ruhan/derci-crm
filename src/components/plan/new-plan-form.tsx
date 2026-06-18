"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlanAction } from "@/server/actions/plans";

const PLAN_OPTIONS = [
  { value: 2, label: "Plano de 2 sessões" },
  { value: 4, label: "Plano de 4 sessões" },
  { value: 6, label: "Plano de 6 sessões" },
];

export function NewPlanForm({ patientId }: { patientId: string }) {
  return (
    <form action={createPlanAction} className="grid gap-4 sm:grid-cols-2">
      <input type="hidden" name="patientId" value={patientId} />

      <div className="space-y-2">
        <Label htmlFor="totalSessions">Plano</Label>
        <select
          id="totalSessions"
          name="totalSessions"
          defaultValue={4}
          className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          required
        >
          {PLAN_OPTIONS.map((p) => (
            <option key={p.value} value={p.value}>
              {p.label}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="totalValue">Valor total (R$)</Label>
        <Input
          id="totalValue"
          name="totalValue"
          type="number"
          step="0.01"
          min="0"
          required
          placeholder="0,00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="startDate">Data de início</Label>
        <Input
          id="startDate"
          name="startDate"
          type="date"
          defaultValue={format(new Date(), "yyyy-MM-dd")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status do plano</Label>
        <select
          id="status"
          name="status"
          defaultValue="AGUARDANDO_PAGAMENTO"
          className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
        >
          <option value="AGUARDANDO_PAGAMENTO">Aguardando pagamento</option>
          <option value="ABERTO">Aberto (já pago)</option>
        </select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observações (opcional)</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <Button size="lg" type="submit">
          Criar plano
        </Button>
      </div>
    </form>
  );
}

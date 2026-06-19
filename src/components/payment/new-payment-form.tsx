"use client";

import { format } from "date-fns";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PatientCombobox } from "@/components/patient/patient-combobox";
import {
  PAYMENT_METHOD_LABEL,
  PAYMENT_CATEGORY_LABEL,
  PAYMENT_STATUS_LABEL,
} from "@/lib/format";
import { createPaymentAction } from "@/server/actions/payments";

const METHODS = ["ESPECIE", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "OUTRO"];
const CATEGORIES = ["TERAPIA", "LIVRO", "PALESTRA", "OUTRO"];
const STATUSES = ["PAGO", "PENDENTE", "ATRASADO"];

export function NewPaymentForm({
  patientId,
  plans = [],
  showPatientSelect = false,
  patients = [],
}: {
  patientId?: string;
  plans?: { id: string; label: string }[];
  showPatientSelect?: boolean;
  patients?: { id: string; name: string }[];
}) {
  return (
    <form action={createPaymentAction} className="grid gap-4 sm:grid-cols-2">
      {patientId && <input type="hidden" name="patientId" value={patientId} />}
      {showPatientSelect && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="patient-payment-combobox">
            Paciente (deixe vazio para livro/palestra/outro)
          </Label>
          <PatientCombobox
            patients={patients}
            id="patient-payment-combobox"
            placeholder="Buscar paciente pelo nome..."
          />
        </div>
      )}

      {plans.length > 0 && (
        <div className="space-y-2 sm:col-span-2">
          <Label htmlFor="planId">Plano relacionado (opcional)</Label>
          <select
            id="planId"
            name="planId"
            defaultValue=""
            className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          >
            <option value="">— Sem plano —</option>
            {plans.map((p) => (
              <option key={p.id} value={p.id}>
                {p.label}
              </option>
            ))}
          </select>
        </div>
      )}

      <div className="space-y-2">
        <Label htmlFor="amount">Valor (R$)</Label>
        <Input
          id="amount"
          name="amount"
          type="number"
          min="0.01"
          step="0.01"
          required
          placeholder="0,00"
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="paidAt">Data</Label>
        <Input
          id="paidAt"
          name="paidAt"
          type="date"
          defaultValue={format(new Date(), "yyyy-MM-dd")}
          required
        />
      </div>

      <div className="space-y-2">
        <Label htmlFor="method">Forma de pagamento</Label>
        <select
          id="method"
          name="method"
          className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          defaultValue="PIX"
        >
          {METHODS.map((m) => (
            <option key={m} value={m}>
              {PAYMENT_METHOD_LABEL[m]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="category">Categoria</Label>
        <select
          id="category"
          name="category"
          className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          defaultValue="TERAPIA"
        >
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {PAYMENT_CATEGORY_LABEL[c]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2">
        <Label htmlFor="status">Status</Label>
        <select
          id="status"
          name="status"
          className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
          defaultValue="PAGO"
        >
          {STATUSES.map((s) => (
            <option key={s} value={s}>
              {PAYMENT_STATUS_LABEL[s]}
            </option>
          ))}
        </select>
      </div>

      <div className="space-y-2 sm:col-span-2">
        <Label htmlFor="notes">Observação</Label>
        <Textarea id="notes" name="notes" rows={2} />
      </div>

      <div className="sm:col-span-2 flex justify-end">
        <Button size="lg" type="submit">
          Registrar pagamento
        </Button>
      </div>
    </form>
  );
}

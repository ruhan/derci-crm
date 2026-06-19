"use client";

import { useState } from "react";
import Link from "next/link";
import { Card, CardContent } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  PATIENT_ORIGIN_LABEL,
  PATIENT_STATUS_LABEL,
} from "@/lib/format";
import { PATIENT_ORIGINS, PATIENT_STATUSES } from "@/lib/validations";

const ORIGINS = PATIENT_ORIGINS;
const STATUSES = PATIENT_STATUSES;

type Initial = {
  name?: string;
  phone?: string;
  origin?: (typeof ORIGINS)[number];
  referrerName?: string | null;
  referrerNote?: string | null;
  entryDate?: string;
  status?: (typeof STATUSES)[number];
  generalHistory?: string | null;
  internalNotes?: string | null;
};

export function PatientForm({
  action,
  initial = {},
  submitLabel,
  cancelHref = "/pacientes",
}: {
  action: (formData: FormData) => any;
  initial?: Initial;
  submitLabel: string;
  cancelHref?: string;
}) {
  const [origin, setOrigin] = useState<string>(initial.origin ?? "INDICACAO");

  return (
    <form action={action}>
      <Card>
        <CardContent className="pt-6 space-y-5">
          <div className="space-y-2">
            <Label htmlFor="name">Nome do paciente</Label>
            <Input id="name" name="name" defaultValue={initial.name ?? ""} required autoFocus />
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="phone">Telefone (com DDD)</Label>
              <Input
                id="phone"
                name="phone"
                inputMode="tel"
                placeholder="(11) 99999-9999"
                defaultValue={initial.phone ?? ""}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="entryDate">Data de entrada</Label>
              <Input
                id="entryDate"
                name="entryDate"
                type="date"
                defaultValue={initial.entryDate ?? ""}
                required
              />
            </div>
          </div>

          <div className="grid sm:grid-cols-2 gap-5">
            <div className="space-y-2">
              <Label htmlFor="origin">Origem</Label>
              <select
                id="origin"
                name="origin"
                value={origin}
                onChange={(e) => setOrigin(e.target.value)}
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
                required
              >
                {ORIGINS.map((o) => (
                  <option key={o} value={o}>
                    {PATIENT_ORIGIN_LABEL[o]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="status">Status</Label>
              <select
                id="status"
                name="status"
                defaultValue={initial.status ?? "EM_CONVERSACAO"}
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
                required
              >
                {STATUSES.map((s) => (
                  <option key={s} value={s}>
                    {PATIENT_STATUS_LABEL[s]}
                  </option>
                ))}
              </select>
            </div>
          </div>

          {origin === "INDICACAO" && (
            <div className="grid sm:grid-cols-2 gap-5 rounded-lg border-2 border-dashed border-muted p-4">
              <div className="space-y-2">
                <Label htmlFor="referrerName">Nome de quem indicou</Label>
                <Input
                  id="referrerName"
                  name="referrerName"
                  defaultValue={initial.referrerName ?? ""}
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="referrerNote">Observação da indicação</Label>
                <Input
                  id="referrerNote"
                  name="referrerNote"
                  defaultValue={initial.referrerNote ?? ""}
                />
              </div>
            </div>
          )}

          <div className="space-y-2">
            <Label htmlFor="generalHistory">Histórico geral do paciente</Label>
            <Textarea
              id="generalHistory"
              name="generalHistory"
              rows={3}
              defaultValue={initial.generalHistory ?? ""}
              placeholder="Informações gerais e contexto. Evite registrar dados clínicos sensíveis."
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="internalNotes">Observações internas</Label>
            <Textarea
              id="internalNotes"
              name="internalNotes"
              rows={3}
              defaultValue={initial.internalNotes ?? ""}
              placeholder="Anotações internas para a equipe."
            />
          </div>

          <div className="flex flex-col-reverse sm:flex-row sm:justify-end gap-3 pt-2">
            <Button asChild variant="ghost" size="lg">
              <Link href={cancelHref}>Cancelar</Link>
            </Button>
            <Button type="submit" size="lg">
              {submitLabel}
            </Button>
          </div>
        </CardContent>
      </Card>
    </form>
  );
}

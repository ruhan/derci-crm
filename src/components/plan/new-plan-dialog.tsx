"use client";

import { useState } from "react";
import { format } from "date-fns";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { createPlanAction } from "@/server/actions/plans";

const PLAN_OPTIONS = [
  { value: 1, label: "Sessão avulsa (1 sessão)" },
  { value: 2, label: "Plano de 2 sessões" },
  { value: 4, label: "Plano de 4 sessões" },
  { value: 6, label: "Plano de 6 sessões" },
];

export function NewPlanDialog({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-5 w-5" /> Criar plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo plano</DialogTitle>
          <DialogDescription>
            Selecione apenas o número de sessões. Pagamentos são registrados
            separadamente em Financeiro.
          </DialogDescription>
        </DialogHeader>
        <form action={createPlanAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />

          <div className="space-y-2">
            <Label htmlFor="totalSessions">Número de sessões</Label>
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
            <Label htmlFor="notes">Observações (opcional)</Label>
            <Textarea id="notes" name="notes" rows={2} />
          </div>

          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg">
              Criar plano
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

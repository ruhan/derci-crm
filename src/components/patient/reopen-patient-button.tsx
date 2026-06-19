"use client";

import { useState } from "react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { reopenPatientAction } from "@/server/actions/patients";

export function ReopenPatientButton({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="success" size="lg">
          Reabrir paciente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Reabrir paciente</DialogTitle>
        </DialogHeader>
        <form action={reopenPatientAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />
          <div className="space-y-2">
            <Label htmlFor="newStatus">Novo status</Label>
            <select
              id="newStatus"
              name="newStatus"
              defaultValue="ATIVO"
              className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
            >
              <option value="ATIVO">Ativo</option>
              <option value="EM_CONVERSACAO">Em conversação</option>
              <option value="FEZ_PRIMEIRA_SESSAO">Fez primeira sessão</option>
              <option value="NAO_FECHOU_FINANCEIRO">Não fechou por questão financeira</option>
              <option value="PAROU_DE_RESPONDER">Parou de responder</option>
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo da reabertura</Label>
            <Textarea id="reason" name="reason" rows={3} required />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="success" size="lg">
              Confirmar reabertura
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

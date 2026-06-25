"use client";

import { useState } from "react";
import { Trash2 } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogDescription,
  DialogTrigger,
  DialogClose,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { deletePatientAction } from "@/server/actions/patients";

export function DeletePatientButton({
  patientId,
  patientName,
}: {
  patientId: string;
  patientName: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg">
          <Trash2 className="h-5 w-5" /> Excluir paciente
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Excluir paciente</DialogTitle>
          <DialogDescription>
            Tem certeza que deseja excluir <strong>{patientName}</strong>? Esta ação
            é permanente e não pode ser desfeita.
          </DialogDescription>
        </DialogHeader>
        <p className="text-sm text-muted-foreground">
          Serão removidos também planos, atendimentos, sessões, tarefas, pagamentos
          e histórico vinculados a este paciente.
        </p>
        <form action={deletePatientAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="lg">
              Sim, excluir paciente
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

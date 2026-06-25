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
import { removePlanAction } from "@/server/actions/plans";

export function RemovePlanButton({
  planId,
  patientId,
  usedSessions,
  totalSessions,
}: {
  planId: string;
  patientId: string;
  usedSessions: number;
  totalSessions: number;
}) {
  const [open, setOpen] = useState(false);
  const hasUsedSessions = usedSessions > 0;

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="lg" className="text-destructive border-destructive/40">
          <Trash2 className="h-5 w-5" /> Remover plano
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remover plano</DialogTitle>
          <DialogDescription>
            {hasUsedSessions ? (
              <>
                Este plano de <strong>{totalSessions} sessões</strong> já teve{" "}
                <strong>{usedSessions}</strong> sessão(ões) utilizada(s). Ele será{" "}
                <strong>cancelado</strong> e permanecerá no histórico como cancelado.
              </>
            ) : (
              <>
                Remover o plano de <strong>{totalSessions} sessões</strong>? Nenhuma sessão
                foi utilizada — o plano será excluído permanentemente.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form action={removePlanAction} className="space-y-4">
          <input type="hidden" name="planId" value={planId} />
          <input type="hidden" name="patientId" value={patientId} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Voltar
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="lg">
              {hasUsedSessions ? "Cancelar plano" : "Sim, remover plano"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useState, useTransition } from "react";
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
import { deleteSessionAction } from "@/server/actions/appointments";

export function DeleteSessionButton({
  patientId,
  occurredAtLabel,
  sessionId,
  appointmentId,
  returnTo,
  size = "sm",
  fromAgenda = false,
}: {
  patientId: string;
  occurredAtLabel: string;
  sessionId?: string | null;
  appointmentId?: string | null;
  returnTo?: string;
  size?: "sm" | "lg" | "default";
  /** Texto do diálogo na agenda (apaga qualquer atendimento). */
  fromAgenda?: boolean;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  if (!sessionId && !appointmentId) return null;

  function handleSubmit(formData: FormData) {
    setOpen(false);
    startTransition(() => {
      deleteSessionAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size={size} className="text-destructive border-destructive/40">
          <Trash2 className="h-4 w-4" /> Apagar sessão
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Apagar sessão</DialogTitle>
          <DialogDescription>
            {fromAgenda ? (
              <>
                Remover o atendimento de <strong>{occurredAtLabel}</strong>? Se já foi
                realizado, volta para <strong>Agendado</strong> e a sessão retorna ao plano.
                Caso contrário, some da agenda.
              </>
            ) : (
              <>
                Apagar a sessão de <strong>{occurredAtLabel}</strong>? O atendimento deixa de
                contar como realizado e a sessão volta para o saldo do plano.
              </>
            )}
          </DialogDescription>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          {sessionId && <input type="hidden" name="sessionId" value={sessionId} />}
          {appointmentId && (
            <input type="hidden" name="appointmentId" value={appointmentId} />
          )}
          <input type="hidden" name="patientId" value={patientId} />
          {returnTo && (
            <input type="hidden" name="returnTo" value={encodeURIComponent(returnTo)} />
          )}
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg" disabled={pending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="lg" disabled={pending}>
              {pending ? "Apagando..." : "Apagar sessão"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

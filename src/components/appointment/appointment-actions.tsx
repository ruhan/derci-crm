"use client";

import Link from "next/link";
import { useState } from "react";
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
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CheckCircle, X } from "lucide-react";
import { updateAppointmentStatusAction } from "@/server/actions/appointments";

export function AppointmentActions({
  appointmentId,
  status,
  patientId,
}: {
  appointmentId: string;
  status: string;
  patientId: string;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "REALIZADO" && <CompleteButton appointmentId={appointmentId} />}
      {status === "AGENDADO" && (
        <ChangeStatusButton appointmentId={appointmentId} target="CANCELADO" label="Cancelar" />
      )}
      {status === "AGENDADO" && (
        <ChangeStatusButton appointmentId={appointmentId} target="FALTOU" label="Faltou" />
      )}
      {status === "AGENDADO" && (
        <ChangeStatusButton appointmentId={appointmentId} target="REMARCADO" label="Remarcado" />
      )}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/pacientes/${patientId}`}>Ver paciente</Link>
      </Button>
    </div>
  );
}

function CompleteButton({ appointmentId }: { appointmentId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="success" size="sm">
          <CheckCircle className="h-4 w-4" /> Marcar como realizado
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Sessão realizada</DialogTitle>
          <DialogDescription>
            Escreva uma descrição breve do atendimento. Evite registrar dados clínicos sensíveis.
          </DialogDescription>
        </DialogHeader>
        <form action={updateAppointmentStatusAction} className="space-y-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="status" value="REALIZADO" />
          <div className="space-y-2">
            <Label htmlFor={`summary-${appointmentId}`}>Descrição breve</Label>
            <Textarea id={`summary-${appointmentId}`} name="summary" rows={4} required />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="success" size="lg">
              Salvar sessão
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

function ChangeStatusButton({
  appointmentId,
  target,
  label,
}: {
  appointmentId: string;
  target: "CANCELADO" | "FALTOU" | "REMARCADO";
  label: string;
}) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <X className="h-4 w-4" /> {label}
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{label}</DialogTitle>
          <DialogDescription>Você pode adicionar uma observação opcional.</DialogDescription>
        </DialogHeader>
        <form action={updateAppointmentStatusAction} className="space-y-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <input type="hidden" name="status" value={target} />
          <div className="space-y-2">
            <Label htmlFor={`notes-${appointmentId}-${target}`}>Observação</Label>
            <Textarea id={`notes-${appointmentId}-${target}`} name="notes" rows={3} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Voltar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg">
              Confirmar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

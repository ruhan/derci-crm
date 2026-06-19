"use client";

import Link from "next/link";
import { format } from "date-fns";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { CalendarClock, CheckCircle, X } from "lucide-react";
import {
  rescheduleAppointmentAction,
  updateAppointmentStatusAction,
} from "@/server/actions/appointments";

export function AppointmentActions({
  appointmentId,
  status,
  patientId,
  scheduledAt,
  durationMin,
}: {
  appointmentId: string;
  status: string;
  patientId: string;
  scheduledAt: Date | string;
  durationMin: number;
}) {
  return (
    <div className="flex flex-wrap items-center gap-2">
      {status !== "REALIZADO" && <CompleteButton appointmentId={appointmentId} />}
      {status === "AGENDADO" && (
        <RescheduleButton
          appointmentId={appointmentId}
          scheduledAt={scheduledAt}
          durationMin={durationMin}
        />
      )}
      {status === "AGENDADO" && (
        <ChangeStatusButton appointmentId={appointmentId} target="CANCELADO" label="Cancelar" />
      )}
      {status === "AGENDADO" && (
        <ChangeStatusButton appointmentId={appointmentId} target="FALTOU" label="Faltou" />
      )}
      <Button asChild variant="ghost" size="sm">
        <Link href={`/pacientes/${patientId}`}>Ver paciente</Link>
      </Button>
    </div>
  );
}

function RescheduleButton({
  appointmentId,
  scheduledAt,
  durationMin,
}: {
  appointmentId: string;
  scheduledAt: Date | string;
  durationMin: number;
}) {
  const [open, setOpen] = useState(false);
  const initialDate = format(new Date(scheduledAt), "yyyy-MM-dd'T'HH:mm");
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <CalendarClock className="h-4 w-4" /> Remarcar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Remarcar atendimento</DialogTitle>
          <DialogDescription>
            Escolha a nova data e horário. O atendimento permanecerá agendado.
          </DialogDescription>
        </DialogHeader>
        <form action={rescheduleAppointmentAction} className="space-y-4">
          <input type="hidden" name="appointmentId" value={appointmentId} />
          <div className="space-y-2">
            <Label htmlFor={`scheduledAt-${appointmentId}`}>Nova data e hora</Label>
            <Input
              id={`scheduledAt-${appointmentId}`}
              name="scheduledAt"
              type="datetime-local"
              defaultValue={initialDate}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`durationMin-${appointmentId}`}>Duração (min)</Label>
            <Input
              id={`durationMin-${appointmentId}`}
              name="durationMin"
              type="number"
              min="10"
              step="5"
              defaultValue={durationMin}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor={`reason-${appointmentId}`}>Motivo (opcional)</Label>
            <Textarea id={`reason-${appointmentId}`} name="reason" rows={2} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Voltar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg">
              Confirmar remarcação
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
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
  target: "CANCELADO" | "FALTOU";
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

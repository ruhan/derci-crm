"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { ScheduleAppointmentForm } from "@/components/appointment/schedule-form";
import { createAppointmentAction } from "@/server/actions/appointments";

export function ScheduleAppointmentDialog({
  patients,
  defaultPatientId,
  defaultDate,
  triggerLabel = "Agendar atendimento",
  triggerSize = "lg",
}: {
  patients: { id: string; name: string }[];
  defaultPatientId?: string;
  defaultDate?: string;
  triggerLabel?: string;
  triggerSize?: "sm" | "lg" | "default" | "icon";
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setOpen(false);
    startTransition(() => {
      createAppointmentAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size={triggerSize}>
          <Plus className="h-5 w-5" /> {triggerLabel}
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Agendar atendimento</DialogTitle>
          <DialogDescription>
            Escolha o paciente, a data e a duração do atendimento.
          </DialogDescription>
        </DialogHeader>
        <ScheduleAppointmentForm
          patients={patients}
          defaultPatientId={defaultPatientId}
          defaultDate={defaultDate}
          action={handleSubmit}
          pending={pending}
        />
      </DialogContent>
    </Dialog>
  );
}

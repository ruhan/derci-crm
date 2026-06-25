"use client";

import { useState, useTransition } from "react";
import { Plus } from "lucide-react";
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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { PatientCombobox } from "@/components/patient/patient-combobox";
import { SELECTABLE_TASK_TYPES } from "@/lib/format";
import { createTaskAction } from "@/server/actions/tasks";

export function NewTaskDialog({
  patients,
  weekStart,
}: {
  patients: { id: string; name: string }[];
  weekStart: string;
}) {
  const [open, setOpen] = useState(false);
  const [pending, startTransition] = useTransition();

  function handleSubmit(formData: FormData) {
    setOpen(false);
    startTransition(() => {
      createTaskAction(formData);
    });
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-5 w-5" /> Nova tarefa
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Nova tarefa</DialogTitle>
        </DialogHeader>
        <form action={handleSubmit} className="space-y-4">
          <input type="hidden" name="weekStart" value={weekStart} />
          <div className="space-y-2">
            <Label htmlFor="title">Título</Label>
            <Input id="title" name="title" required autoFocus disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              defaultValue="OUTRO"
              className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
              disabled={pending}
            >
              {SELECTABLE_TASK_TYPES.map((t) => (
                <option key={t.value} value={t.value}>
                  {t.label}
                </option>
              ))}
            </select>
          </div>
          <div className="space-y-2">
            <Label htmlFor="patient-task-combobox">Paciente (opcional)</Label>
            <PatientCombobox
              patients={patients}
              id="patient-task-combobox"
              placeholder="Buscar paciente pelo nome..."
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="dueDate">Data prevista</Label>
            <Input id="dueDate" name="dueDate" type="date" disabled={pending} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={3} disabled={pending} />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg" disabled={pending}>
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg" disabled={pending}>
              {pending ? "Criando..." : "Criar tarefa"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

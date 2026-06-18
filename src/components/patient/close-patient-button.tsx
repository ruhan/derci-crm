"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import { closePatientAction } from "@/server/actions/patients";

export function ClosePatientButton({ patientId }: { patientId: string }) {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="destructive" size="lg">
          Fechar prontuário
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Fechar prontuário</DialogTitle>
          <DialogDescription>
            Esta ação encerra o acompanhamento. Você pode reabrir depois se precisar.
          </DialogDescription>
        </DialogHeader>
        <form action={closePatientAction} className="space-y-4">
          <input type="hidden" name="patientId" value={patientId} />
          <div className="space-y-2">
            <Label htmlFor="closedAt">Data de fechamento</Label>
            <Input
              id="closedAt"
              name="closedAt"
              type="date"
              defaultValue={format(new Date(), "yyyy-MM-dd")}
              required
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="reason">Motivo do fechamento</Label>
            <Textarea id="reason" name="reason" rows={3} required />
          </div>
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" variant="destructive" size="lg">
              Confirmar fechamento
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

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
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { updateUserAction } from "@/server/actions/users";

export function EditUserDialog({
  user,
}: {
  user: { id: string; name: string; email: string; role: string; active: boolean };
}) {
  const [open, setOpen] = useState(false);
  const action = updateUserAction.bind(null, user.id);

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          Editar
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Editar usuário</DialogTitle>
        </DialogHeader>
        <form action={action} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="name">Nome</Label>
            <Input id="name" name="name" defaultValue={user.name} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="email">E-mail</Label>
            <Input id="email" name="email" type="email" defaultValue={user.email} required />
          </div>
          <div className="space-y-2">
            <Label htmlFor="password">Nova senha (opcional)</Label>
            <Input id="password" name="password" type="password" minLength={6} />
          </div>
          <div className="space-y-2">
            <Label htmlFor="role">Perfil</Label>
            <select
              id="role"
              name="role"
              defaultValue={user.role}
              className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
            >
              <option value="ADMIN">Administradora</option>
              <option value="ATENDIMENTO">Atendimento</option>
              <option value="FINANCEIRO">Financeiro</option>
            </select>
          </div>
          <input type="hidden" name="active" value={user.active ? "true" : "false"} />
          <DialogFooter>
            <DialogClose asChild>
              <Button type="button" variant="ghost" size="lg">
                Cancelar
              </Button>
            </DialogClose>
            <Button type="submit" size="lg">
              Salvar
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { toggleUserActiveAction } from "@/server/actions/users";

export function ToggleUserActiveButton({ id, active }: { id: string; active: boolean }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant={active ? "destructive" : "success"}
      size="sm"
      disabled={pending}
      onClick={() => {
        if (
          confirm(
            active ? "Desativar este usuário? Ele não poderá mais entrar." : "Reativar este usuário?"
          )
        ) {
          start(() => toggleUserActiveAction(id));
        }
      }}
    >
      {active ? "Desativar" : "Ativar"}
    </Button>
  );
}

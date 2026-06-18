"use client";

import { useTransition } from "react";
import { Trash2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { deleteTransactionAction } from "@/server/actions/finance";

export function DeleteTransactionButton({ id }: { id: string }) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="ghost"
      size="icon"
      aria-label="Excluir lançamento"
      onClick={() => {
        if (confirm("Excluir este lançamento? Esta ação não pode ser desfeita.")) {
          start(() => deleteTransactionAction(id));
        }
      }}
      disabled={pending}
    >
      <Trash2 className="h-5 w-5 text-destructive" />
    </Button>
  );
}

"use client";

import { useTransition } from "react";
import { Button } from "@/components/ui/button";
import { updateFinanceMessageStatusAction } from "@/server/actions/finance";

export function FinMsgStatusButton({
  id,
  target,
  disabled,
  children,
}: {
  id: string;
  target: "ABERTA" | "EM_ANALISE" | "RESOLVIDA";
  disabled?: boolean;
  children: React.ReactNode;
}) {
  const [pending, start] = useTransition();
  return (
    <Button
      variant="outline"
      size="sm"
      disabled={disabled || pending}
      onClick={() => start(() => updateFinanceMessageStatusAction(id, target))}
    >
      {children}
    </Button>
  );
}

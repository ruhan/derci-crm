"use client";

import { useState } from "react";
import { format } from "date-fns";
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
import {
  FINANCIAL_CATEGORY_LABEL,
  PAYMENT_METHOD_LABEL,
} from "@/lib/format";
import { createTransactionAction } from "@/server/actions/finance";

const METHODS = ["ESPECIE", "PIX", "CARTAO_CREDITO", "CARTAO_DEBITO", "TRANSFERENCIA", "OUTRO"];
const CATEGORIES = Object.keys(FINANCIAL_CATEGORY_LABEL);

export function NewTransactionDialog() {
  const [open, setOpen] = useState(false);
  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button size="lg">
          <Plus className="h-5 w-5" /> Novo lançamento
        </Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>Novo lançamento financeiro</DialogTitle>
        </DialogHeader>
        <form action={createTransactionAction} className="space-y-4">
          <div className="space-y-2">
            <Label htmlFor="type">Tipo</Label>
            <select
              id="type"
              name="type"
              className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
              defaultValue="ENTRADA"
            >
              <option value="ENTRADA">Entrada</option>
              <option value="SAIDA">Saída</option>
            </select>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="amount">Valor (R$)</Label>
              <Input id="amount" name="amount" type="number" min="0.01" step="0.01" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="occurredAt">Data</Label>
              <Input
                id="occurredAt"
                name="occurredAt"
                type="date"
                defaultValue={format(new Date(), "yyyy-MM-dd")}
                required
              />
            </div>
          </div>
          <div className="grid gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="category">Categoria</Label>
              <select
                id="category"
                name="category"
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
                defaultValue="TERAPIA"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>
                    {FINANCIAL_CATEGORY_LABEL[c]}
                  </option>
                ))}
              </select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="method">Forma de pagamento</Label>
              <select
                id="method"
                name="method"
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
                defaultValue=""
              >
                <option value="">—</option>
                {METHODS.map((m) => (
                  <option key={m} value={m}>
                    {PAYMENT_METHOD_LABEL[m]}
                  </option>
                ))}
              </select>
            </div>
          </div>
          <div className="space-y-2">
            <Label htmlFor="description">Descrição</Label>
            <Textarea id="description" name="description" rows={2} />
          </div>
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

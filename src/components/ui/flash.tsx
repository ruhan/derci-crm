"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Flash messages simples baseadas em query params:
 *  ?ok=Mensagem%20de%20sucesso
 *  ?err=Mensagem%20de%20erro
 * Aparecem por ~2,5s e somem (e a URL é limpa logo após).
 *
 * Importante: o timer fica em um useEffect separado que depende
 * APENAS de `msg`. Antes ele estava no mesmo effect que escutava
 * `sp` (searchParams). Quando o `router.replace` limpava a URL,
 * o `sp` mudava, o effect rodava o cleanup e matava o timer
 * antes dele disparar — toast ficava grudado para sempre.
 */

const TOAST_TIMEOUT_MS = 2500;

export function FlashMessages() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(
    null,
  );

  // 1) Lê ok/err da URL, dispara a mensagem e limpa a URL.
  useEffect(() => {
    const ok = sp.get("ok");
    const err = sp.get("err");
    if (!ok && !err) return;
    setMsg({ kind: ok ? "ok" : "err", text: (ok ?? err)! });
    const params = new URLSearchParams(sp.toString());
    params.delete("ok");
    params.delete("err");
    const qs = params.toString();
    router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
  }, [sp, pathname, router]);

  // 2) Sempre que houver `msg`, agenda o desaparecimento. Isolado para
  //    não ser cancelado por mudanças em `sp`/pathname/router.
  useEffect(() => {
    if (!msg) return;
    const t = setTimeout(() => setMsg(null), TOAST_TIMEOUT_MS);
    return () => clearTimeout(t);
  }, [msg]);

  if (!msg) return null;
  return (
    <div
      role="status"
      onClick={() => setMsg(null)}
      className={cn(
        "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 max-w-[92vw] rounded-2xl border px-5 py-4 shadow-xl flex items-center gap-3 text-base font-medium cursor-pointer",
        msg.kind === "ok"
          ? "bg-success text-success-foreground border-success"
          : "bg-destructive text-destructive-foreground border-destructive",
      )}
    >
      {msg.kind === "ok" ? (
        <CheckCircle2 className="h-6 w-6" />
      ) : (
        <AlertTriangle className="h-6 w-6" />
      )}
      <span>{msg.text}</span>
    </div>
  );
}

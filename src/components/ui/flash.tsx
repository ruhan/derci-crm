"use client";
import { useEffect, useState } from "react";
import { useSearchParams, useRouter, usePathname } from "next/navigation";
import { CheckCircle2, AlertTriangle } from "lucide-react";
import { cn } from "@/lib/utils";

/**
 * Flash messages simples baseadas em query params:
 *  ?ok=Mensagem%20de%20sucesso
 *  ?err=Mensagem%20de%20erro
 * Aparecem por 4s e somem (e a URL é limpa).
 */
export function FlashMessages() {
  const sp = useSearchParams();
  const router = useRouter();
  const pathname = usePathname();
  const [msg, setMsg] = useState<{ kind: "ok" | "err"; text: string } | null>(null);

  useEffect(() => {
    const ok = sp.get("ok");
    const err = sp.get("err");
    if (ok) setMsg({ kind: "ok", text: ok });
    else if (err) setMsg({ kind: "err", text: err });
    if (ok || err) {
      const params = new URLSearchParams(sp.toString());
      params.delete("ok");
      params.delete("err");
      const qs = params.toString();
      router.replace(qs ? `${pathname}?${qs}` : pathname, { scroll: false });
      const t = setTimeout(() => setMsg(null), 4000);
      return () => clearTimeout(t);
    }
  }, [sp, pathname, router]);

  if (!msg) return null;
  return (
    <div
      role="status"
      className={cn(
        "fixed bottom-24 left-1/2 z-50 -translate-x-1/2 max-w-[92vw] rounded-2xl border px-5 py-4 shadow-xl flex items-center gap-3 text-base font-medium",
        msg.kind === "ok"
          ? "bg-success text-success-foreground border-success"
          : "bg-destructive text-destructive-foreground border-destructive"
      )}
    >
      {msg.kind === "ok" ? <CheckCircle2 className="h-6 w-6" /> : <AlertTriangle className="h-6 w-6" />}
      <span>{msg.text}</span>
    </div>
  );
}

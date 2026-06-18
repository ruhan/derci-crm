import Link from "next/link";
import { Button } from "@/components/ui/button";

export default function NotFound() {
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-background">
      <div className="max-w-md text-center space-y-4">
        <h1 className="text-3xl font-bold">Página não encontrada</h1>
        <p className="text-base text-muted-foreground">
          O endereço acessado não existe ou foi movido.
        </p>
        <Button asChild size="lg">
          <Link href="/">Voltar ao início</Link>
        </Button>
      </div>
    </div>
  );
}

import { redirect } from "next/navigation";
import { getSession } from "@/lib/auth";
import { LoginForm } from "./login-form";

export const metadata = { title: "Entrar - Derci CRM" };

export default async function LoginPage({
  searchParams,
}: {
  searchParams: { callbackUrl?: string; err?: string };
}) {
  const sess = await getSession();
  if (sess) redirect(searchParams.callbackUrl || "/");
  return (
    <div className="min-h-screen flex items-center justify-center px-4 bg-gradient-to-b from-secondary to-background">
      <div className="w-full max-w-md">
        <div className="mb-8 text-center">
          <h1 className="text-3xl font-bold text-primary">Derci CRM</h1>
          <p className="mt-2 text-base text-muted-foreground">
            Bem-vinda. Faça login para continuar.
          </p>
        </div>
        <LoginForm callbackUrl={searchParams.callbackUrl} initialError={searchParams.err} />
      </div>
    </div>
  );
}

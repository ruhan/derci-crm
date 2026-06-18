import { prisma } from "@/lib/prisma";
import { PageHeader } from "@/components/ui/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { fmtDate, USER_ROLE_LABEL } from "@/lib/format";
import { Badge } from "@/components/ui/badge";
import { createUserAction } from "@/server/actions/users";
import { ToggleUserActiveButton } from "@/components/users/toggle-user-active-button";
import { EditUserDialog } from "@/components/users/edit-user-dialog";

export const dynamic = "force-dynamic";

export default async function UsersPage({
  searchParams,
}: {
  searchParams: { err?: string };
}) {
  const users = await prisma.user.findMany({ orderBy: { name: "asc" } });

  return (
    <div className="space-y-5">
      <PageHeader
        title="Usuários"
        description="Gerencie quem pode acessar o sistema."
      />
      {searchParams.err && (
        <div className="rounded-lg bg-destructive/10 p-4 text-base font-medium text-destructive">
          {searchParams.err}
        </div>
      )}
      <Card>
        <CardHeader>
          <CardTitle>Cadastrar novo usuário</CardTitle>
        </CardHeader>
        <CardContent>
          <form action={createUserAction} className="grid gap-4 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="name">Nome</Label>
              <Input id="name" name="name" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="email">E-mail</Label>
              <Input id="email" name="email" type="email" required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="password">Senha</Label>
              <Input id="password" name="password" type="password" minLength={6} required />
            </div>
            <div className="space-y-2">
              <Label htmlFor="role">Perfil</Label>
              <select
                id="role"
                name="role"
                defaultValue="ATENDIMENTO"
                className="h-12 w-full rounded-lg border-2 border-input bg-background px-4 text-base"
              >
                <option value="ADMIN">Administradora</option>
                <option value="ATENDIMENTO">Atendimento</option>
                <option value="FINANCEIRO">Financeiro</option>
              </select>
            </div>
            <input type="hidden" name="active" value="true" />
            <div className="sm:col-span-2 flex justify-end">
              <Button type="submit" size="lg">
                Cadastrar usuário
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>

      <Card>
        <CardHeader>
          <CardTitle>Usuários cadastrados</CardTitle>
        </CardHeader>
        <CardContent>
          <ul className="divide-y">
            {users.map((u) => (
              <li key={u.id} className="py-3 flex items-center justify-between gap-3">
                <div>
                  <p className="font-semibold">{u.name}</p>
                  <p className="text-sm text-muted-foreground">{u.email}</p>
                  <p className="text-sm">
                    <Badge variant={u.active ? "success" : "muted"} className="mr-2">
                      {u.active ? "Ativo" : "Inativo"}
                    </Badge>
                    {USER_ROLE_LABEL[u.role]} • cadastro em {fmtDate(u.createdAt)}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  <EditUserDialog
                    user={{
                      id: u.id,
                      name: u.name,
                      email: u.email,
                      role: u.role,
                      active: u.active,
                    }}
                  />
                  <ToggleUserActiveButton id={u.id} active={u.active} />
                </div>
              </li>
            ))}
          </ul>
        </CardContent>
      </Card>
    </div>
  );
}

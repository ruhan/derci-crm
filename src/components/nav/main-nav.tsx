"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import {
  Home,
  Users,
  Calendar,
  ClipboardList,
  DollarSign,
  BarChart3,
  Settings,
} from "lucide-react";
import { cn } from "@/lib/utils";

export type NavItem = {
  href: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
};

export const NAV_ITEMS: NavItem[] = [
  { href: "/", label: "Início", icon: Home },
  { href: "/pacientes", label: "Pacientes", icon: Users },
  { href: "/agenda", label: "Agenda", icon: Calendar },
  { href: "/tarefas", label: "Tarefas", icon: ClipboardList },
  { href: "/financeiro", label: "Financeiro", icon: DollarSign },
  { href: "/relatorios", label: "Relatórios", icon: BarChart3 },
  { href: "/configuracoes/usuarios", label: "Configurações", icon: Settings },
];

function isActive(pathname: string, href: string) {
  if (href === "/") return pathname === "/";
  return pathname === href || pathname.startsWith(href + "/");
}

export function MobileBottomNav() {
  const pathname = usePathname();
  // Em mobile mostramos os principais 5 itens; o resto fica no menu lateral em desktop.
  const items = NAV_ITEMS.slice(0, 5);
  return (
    <nav
      aria-label="Navegação principal"
      className="fixed bottom-0 left-0 right-0 z-40 border-t bg-background/95 backdrop-blur safe-bottom md:hidden"
    >
      <ul className="grid grid-cols-5">
        {items.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <li key={item.href}>
              <Link
                href={item.href}
                className={cn(
                  "flex flex-col items-center justify-center gap-1 py-3 text-[12px] font-medium",
                  active ? "text-primary" : "text-muted-foreground"
                )}
              >
                <Icon className={cn("h-6 w-6", active && "stroke-[2.5]")} />
                <span>{item.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

export function DesktopSideNav({ user }: { user: { name: string; email: string } }) {
  const pathname = usePathname();
  return (
    <aside className="hidden md:flex md:w-64 md:flex-col md:border-r md:bg-card">
      <div className="px-6 py-6">
        <Link href="/" className="block">
          <h2 className="text-2xl font-bold tracking-tight text-primary">Derci CRM</h2>
          <p className="text-sm text-muted-foreground">Clínica de Psicologia</p>
        </Link>
      </div>
      <nav className="flex-1 px-3 space-y-1">
        {NAV_ITEMS.map((item) => {
          const active = isActive(pathname, item.href);
          const Icon = item.icon;
          return (
            <Link
              key={item.href}
              href={item.href}
              className={cn(
                "flex items-center gap-3 rounded-lg px-4 py-3 text-base font-medium transition-colors",
                active
                  ? "bg-primary text-primary-foreground"
                  : "text-foreground hover:bg-accent"
              )}
            >
              <Icon className="h-5 w-5" />
              <span>{item.label}</span>
            </Link>
          );
        })}
      </nav>
      <div className="px-4 py-5 border-t mt-auto">
        <div className="text-sm">
          <p className="font-semibold">{user.name}</p>
          <p className="text-muted-foreground truncate">{user.email}</p>
        </div>
        <form action="/api/auth/logout" method="post" className="mt-3">
          <button className="text-sm font-semibold text-destructive hover:underline">
            Sair
          </button>
        </form>
      </div>
    </aside>
  );
}

export function MobileTopBar({ user }: { user: { name: string } }) {
  const pathname = usePathname();
  const item = NAV_ITEMS.find((i) => isActive(pathname, i.href));
  return (
    <header className="md:hidden sticky top-0 z-30 flex items-center justify-between border-b bg-background/95 px-4 py-3 backdrop-blur">
      <div>
        <h1 className="text-lg font-bold text-primary leading-tight">Derci CRM</h1>
        <p className="text-xs text-muted-foreground">{item?.label ?? "Painel"}</p>
      </div>
      <form action="/api/auth/logout" method="post">
        <button
          type="submit"
          className="text-sm font-semibold text-muted-foreground hover:text-destructive"
          aria-label={`Sair (${user.name})`}
        >
          Sair
        </button>
      </form>
    </header>
  );
}

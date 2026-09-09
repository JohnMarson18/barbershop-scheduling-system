"use client";

import { useAuth } from "@/hooks/useAuth";
import { AdminLogin } from "./AdminLogin";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Calendar, Scissors, Users, Clock, LogOut, ExternalLink, ShieldAlert, UserCheck } from "lucide-react";
import { usePathname, useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { siteConfig } from "@/config/site";

export function AdminLayout({ children }: { children: React.ReactNode }) {
  const { profile, role, isAuthenticated, isAdmin, isBarber, loading, logout } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-primary"></div>
      </div>
    );
  }

  // Se não estiver logado ou se for cliente comum tentando acessar a área de funcionários
  if (!isAuthenticated || (!isAdmin && !isBarber)) {
    return <AdminLogin />;
  }

  // Menu adaptativo baseado no papel (RBAC)
  const navItems = [
    {
      href: "/admin/dashboard",
      icon: Calendar,
      label: isAdmin ? "Agenda Geral" : "Minha Agenda",
    },
    ...(isAdmin
      ? [
          { href: "/admin/services", icon: Scissors, label: "Gerenciar Serviços" },
          { href: "/admin/barbers", icon: Users, label: "Gerenciar Barbeiros" },
        ]
      : []),
    {
      href: "/admin/blocked-slots",
      icon: Clock,
      label: isAdmin ? "Bloqueios Gerais" : "Meus Bloqueios / Almoço",
    },
    ...(isAdmin
      ? [
          { href: "/admin/team", icon: UserCheck, label: "Equipe & Logins" },
        ]
      : []),
  ];

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* HEADER DO ADMIN */}
      <header className="bg-white border-b sticky top-0 z-30 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center gap-3">
              <div className="w-9 h-9 rounded-lg bg-gray-900 text-white flex items-center justify-center font-bold text-sm shadow">
                <Scissors className="h-4 w-4 text-amber-400" />
              </div>
              <div>
                <h1 className="text-base font-bold text-gray-900 leading-tight">{siteConfig.name}</h1>
                <p className="text-xs text-gray-500">
                  {isAdmin ? "Painel da Gerência" : "Espaço do Barbeiro"}
                </p>
              </div>
            </div>

            <div className="flex items-center gap-3">
              {/* Badge com identificação e papel do usuário */}
              <div className="hidden sm:flex items-center gap-2 bg-gray-100 py-1.5 px-3 rounded-full text-xs">
                <span className="font-semibold text-gray-700">{profile?.name}</span>
                <Badge
                  variant={isAdmin ? "default" : "secondary"}
                  className="text-[10px] uppercase font-bold py-0 h-4"
                >
                  {isAdmin ? "Gerente" : "Barbeiro"}
                </Badge>
              </div>

              <Button
                variant="outline"
                size="sm"
                onClick={() => window.open("/", "_blank")}
                className="hidden sm:flex items-center gap-1.5 text-xs"
              >
                <ExternalLink className="h-3.5 w-3.5" />
                Ver Site Público
              </Button>

              <Button
                variant="ghost"
                size="sm"
                onClick={logout}
                className="text-destructive hover:bg-destructive/10 text-xs"
              >
                <LogOut className="h-3.5 w-3.5 mr-1" />
                Sair
              </Button>
            </div>
          </div>
        </div>
      </header>

      {/* CORPO DO ADMIN COM SIDEBAR */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full">
        <div className="flex flex-col md:flex-row gap-6">
          <aside className="w-full md:w-64 shrink-0">
            <nav className="bg-white rounded-xl border p-3 shadow-sm space-y-1">
              <div className="px-3 py-2 text-xs font-bold uppercase tracking-wider text-gray-400">
                Menu de Gestão
              </div>
              {navItems.map((item) => {
                const Icon = item.icon;
                const isActive = pathname === item.href;
                return (
                  <button
                    key={item.href}
                    onClick={() => router.push(item.href)}
                    className={cn(
                      "w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium transition-colors text-left",
                      isActive
                        ? "bg-gray-900 text-white shadow-sm"
                        : "text-gray-600 hover:bg-gray-100 hover:text-gray-900"
                    )}
                  >
                    <Icon className="h-4 w-4 shrink-0" />
                    {item.label}
                  </button>
                );
              })}
            </nav>
          </aside>

          <main className="flex-1 bg-white rounded-xl border p-6 shadow-sm min-w-0">
            {children}
          </main>
        </div>
      </div>
    </div>
  );
}

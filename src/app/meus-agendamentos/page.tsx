"use client";

import { useState, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/hooks/useAuth";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Scissors,
  Calendar,
  Clock,
  User,
  ShieldCheck,
  LogOut,
  Plus,
  Trash2,
  AlertCircle,
  CheckCircle2,
  Loader2,
} from "lucide-react";
import { PrivacyPolicyModal } from "@/components/public/PrivacyPolicyModal";
import { siteConfig } from "@/config/site";

export default function ClientAppointmentsPage() {
  const router = useRouter();
  const { profile, isAuthenticated, loading: authLoading, logout } = useAuth();
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState<{ type: "success" | "error"; text: string } | null>(null);

  const fetchClientAppointments = useCallback(async () => {
    if (!profile) return;
    setLoading(true);
    try {
      // Busca todos os agendamentos e filtra pelos dados do cliente logado
      const response = await fetch("/api/appointments");
      const result = await response.json();
      if (result.success && result.data) {
        const clientList = result.data.filter(
          (apt: any) =>
            (apt.user_id && apt.user_id === profile.id) ||
            apt.client_name.toLowerCase().includes(profile.name.toLowerCase()) ||
            apt.client_name.toLowerCase() === profile.name.toLowerCase()
        );
        setAppointments(clientList);
      }
    } catch (err) {
      console.error("Erro ao carregar agendamentos do cliente:", err);
    } finally {
      setLoading(false);
    }
  }, [profile]);

  useEffect(() => {
    if (!authLoading) {
      if (!isAuthenticated) {
        router.push("/login");
      } else {
        fetchClientAppointments();
      }
    }
  }, [isAuthenticated, authLoading, router, fetchClientAppointments]);

  const handleCancel = async (id: string) => {
    if (!confirm("Deseja realmente cancelar este agendamento?")) return;

    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "cancelled" }),
      });
      const result = await response.json();
      if (result.success) {
        setMessage({ type: "success", text: "Agendamento cancelado com sucesso." });
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? { ...apt, status: "cancelled" } : apt))
        );
      } else {
        setMessage({ type: "error", text: result.error || "Erro ao cancelar agendamento." });
      }
    } catch (err) {
      setMessage({ type: "error", text: "Erro de rede ao cancelar agendamento." });
    }
  };

  const handleAnonymize = async () => {
    if (
      !confirm(
        "Atenção: Sob o Art. 18 da LGPD, seus dados de identificação (WhatsApp e Nome) serão desvinculados permanentemente do histórico. Deseja prosseguir?"
      )
    ) {
      return;
    }

    try {
      const response = await fetch("/api/lgpd/anonymize", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: profile?.id }),
      });
      const result = await response.json();
      if (result.success) {
        alert(result.message);
        logout();
        router.push("/");
      }
    } catch (err) {
      alert("Erro ao solicitar anonimização.");
    }
  };

  if (authLoading || !profile) {
    return (
      <div className="min-h-screen bg-neutral-950 flex items-center justify-center text-neutral-100">
        <Loader2 className="h-8 w-8 animate-spin text-amber-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-neutral-950 text-neutral-100 flex flex-col justify-between">
      {/* HEADER DO CLIENTE */}
      <header className="border-b border-neutral-800 bg-neutral-900/60 backdrop-blur sticky top-0 z-20">
        <div className="max-w-5xl mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-full bg-amber-500/10 border border-amber-500/30 flex items-center justify-center text-amber-500">
              <Scissors className="h-5 w-5" />
            </div>
            <div>
              <h1 className="text-lg font-bold tracking-tight">{siteConfig.name}</h1>
              <p className="text-xs text-neutral-400">Área do Cliente &bull; Meus Agendamentos</p>
            </div>
          </div>

          <div className="flex items-center gap-3">
            <Button
              onClick={() => router.push("/")}
              size="sm"
              className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold hidden sm:flex items-center gap-1.5"
            >
              <Plus className="h-4 w-4" />
              Novo Agendamento
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={logout}
              className="text-neutral-400 hover:text-neutral-200"
            >
              <LogOut className="h-4 w-4 mr-1.5" />
              Sair
            </Button>
          </div>
        </div>
      </header>

      {/* CONTEÚDO PRINCIPAL */}
      <main className="max-w-5xl mx-auto px-4 py-8 flex-1 w-full space-y-6">
        {/* BOAS VINDAS */}
        <div className="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-full bg-amber-500/15 text-amber-400 flex items-center justify-center font-bold text-lg">
              {profile.name.charAt(0).toUpperCase()}
            </div>
            <div>
              <h2 className="text-xl font-bold text-neutral-100">Olá, {profile.name}!</h2>
              <p className="text-xs text-neutral-400">{profile.email}</p>
            </div>
          </div>

          <Button
            onClick={() => router.push("/")}
            className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-bold sm:hidden w-full"
          >
            <Plus className="h-4 w-4 mr-1.5" />
            Novo Agendamento
          </Button>
        </div>

        {/* FEEDBACK DE AÇÃO */}
        {message && (
          <div
            className={`p-4 rounded-lg text-sm flex items-center gap-2 ${
              message.type === "success"
                ? "bg-emerald-500/10 border border-emerald-500/20 text-emerald-400"
                : "bg-destructive/10 border border-destructive/20 text-destructive"
            }`}
          >
            <CheckCircle2 className="h-4 w-4 shrink-0" />
            <span>{message.text}</span>
          </div>
        )}

        {/* TABELA DE AGENDAMENTOS DO CLIENTE */}
        <Card className="bg-neutral-900 border-neutral-800 text-neutral-100">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Calendar className="h-5 w-5 text-amber-400" />
              Histórico de Agendamentos
            </CardTitle>
            <CardDescription className="text-neutral-400">
              Acompanhe seus horários agendados e cancele com antecedência se necessário.
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-12 text-neutral-400">
                <Loader2 className="h-8 w-8 animate-spin" />
              </div>
            ) : appointments.length === 0 ? (
              <div className="text-center py-12 text-neutral-500 space-y-3">
                <Calendar className="mx-auto h-12 w-12 opacity-30" />
                <p className="font-medium text-neutral-300">Você ainda não possui agendamentos cadastrados.</p>
                <Button
                  onClick={() => router.push("/")}
                  className="bg-amber-500 hover:bg-amber-600 text-neutral-950 font-semibold"
                >
                  Agendar Meu Primeiro Corte
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader className="border-neutral-800">
                    <TableRow className="border-neutral-800 hover:bg-transparent">
                      <TableHead className="text-neutral-400">Data</TableHead>
                      <TableHead className="text-neutral-400">Horário</TableHead>
                      <TableHead className="text-neutral-400">Serviço</TableHead>
                      <TableHead className="text-neutral-400">Barbeiro</TableHead>
                      <TableHead className="text-neutral-400">Status</TableHead>
                      <TableHead className="text-right text-neutral-400">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {appointments.map((apt) => (
                      <TableRow key={apt.id} className="border-neutral-800 hover:bg-neutral-800/50">
                        <TableCell className="font-medium text-neutral-200">
                          {apt.appointment_date}
                        </TableCell>
                        <TableCell className="font-mono font-bold text-amber-400">
                          {apt.appointment_time}
                        </TableCell>
                        <TableCell>
                          <div className="font-semibold text-neutral-200">{apt.service?.name}</div>
                          {apt.service?.price && (
                            <div className="text-xs text-neutral-400">
                              R$ {Number(apt.service.price).toFixed(2).replace(".", ",")}
                            </div>
                          )}
                        </TableCell>
                        <TableCell className="text-neutral-300">
                          {apt.barber?.name}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={apt.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {apt.status === "scheduled" && (
                            <Button
                              size="sm"
                              variant="outline"
                              className="border-rose-900/50 text-rose-400 hover:bg-rose-950 hover:text-rose-300"
                              onClick={() => handleCancel(apt.id)}
                            >
                              Cancelar Horário
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>

        {/* PRIVACIDADE E DIREITOS LGPD */}
        <div className="bg-neutral-900/40 border border-neutral-800/70 rounded-xl p-4 flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3 text-xs text-neutral-400">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-emerald-500 shrink-0" />
            <span>
              Seus dados estão protegidos sob a LGPD (Lei Geral de Proteção de Dados).{" "}
              <PrivacyPolicyModal />
            </span>
          </div>
          <button
            onClick={handleAnonymize}
            className="text-neutral-500 hover:text-rose-400 transition-colors underline"
          >
            Direito ao esquecimento (Excluir meus dados)
          </button>
        </div>
      </main>

      {/* FOOTER */}
      <footer className="border-t border-neutral-800/80 py-6 text-center text-xs text-neutral-500">
        <p>{siteConfig.name} &bull; Área Segura do Cliente</p>
      </footer>
    </div>
  );
}

"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBarbers } from "@/hooks/useBarbers";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { StatusBadge } from "@/components/shared/StatusBadge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Loader2,
  CalendarDays,
  Clock,
  CheckCircle,
  XCircle,
  AlertCircle,
  RotateCcw,
  DollarSign,
  User,
} from "lucide-react";
import { Appointment } from "@/schemas";
import { ActionResponse } from "@/types/api";

export default function AdminDashboard() {
  const { profile, isAdmin, isBarber, getAuthHeaders } = useAuth();
  const { barbers } = useBarbers();

  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const [selectedDate, setSelectedDate] = useState<string>(getTodayStr());
  const [selectedBarberFilter, setSelectedBarberFilter] = useState<string>("all");
  const [appointments, setAppointments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [updatingId, setUpdatingId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  // Se for barbeiro individual, trava o filtro no seu próprio ID
  useEffect(() => {
    if (isBarber && profile?.barber_id) {
      setSelectedBarberFilter(profile.barber_id);
    }
  }, [isBarber, profile]);

  const fetchAppointments = useCallback(async (date: string) => {
    setLoading(true);
    setErrorMsg(null);
    try {
      const response = await fetch(`/api/appointments?date=${date}`, {
        headers: getAuthHeaders(),
      });
      const result: ActionResponse<any[]> = await response.json();
      if (result.success) {
        setAppointments(result.data || []);
      } else {
        setErrorMsg(result.error || "Erro ao carregar agendamentos.");
      }
    } catch (err) {
      setErrorMsg("Erro de rede ao conectar com o servidor.");
    } finally {
      setLoading(false);
    }
  }, [getAuthHeaders]);

  useEffect(() => {
    fetchAppointments(selectedDate);
  }, [selectedDate, fetchAppointments]);

  // Filtra agendamentos baseado no papel e no seletor
  const filteredAppointments = useMemo(() => {
    if (isBarber && profile?.barber_id) {
      return appointments.filter((apt) => apt.barber_id === profile.barber_id);
    }
    if (selectedBarberFilter !== "all") {
      return appointments.filter((apt) => apt.barber_id === selectedBarberFilter);
    }
    return appointments;
  }, [appointments, isBarber, profile, selectedBarberFilter]);

  const handleUpdateStatus = async (id: string, status: "attended" | "cancelled") => {
    setUpdatingId(id);
    try {
      const response = await fetch(`/api/appointments/${id}`, {
        method: "PATCH",
        headers: {
          "Content-Type": "application/json",
          ...getAuthHeaders(),
        },
        body: JSON.stringify({ status }),
      });
      const result: ActionResponse<Appointment> = await response.json();

      if (result.success) {
        setAppointments((prev) =>
          prev.map((apt) => (apt.id === id ? { ...apt, status } : apt))
        );
      } else {
        alert("Erro: " + (result.error || "Não foi possível atualizar o status."));
      }
    } catch (err) {
      alert("Erro de rede ao atualizar status.");
    } finally {
      setUpdatingId(null);
    }
  };

  const total = filteredAppointments.length;
  const attended = filteredAppointments.filter((apt) => apt.status === "attended").length;
  const pending = filteredAppointments.filter((apt) => apt.status === "scheduled").length;
  const cancelled = filteredAppointments.filter((apt) => apt.status === "cancelled").length;

  const totalRevenue = useMemo(() => {
    return filteredAppointments
      .filter((apt) => apt.status === "attended")
      .reduce((sum, apt) => sum + (Number(apt.service?.price) || 0), 0);
  }, [filteredAppointments]);

  return (
    <div className="space-y-6">
      {/* CABEÇALHO COM FILTRO DE DATA E PROFISSIONAL */}
      <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-4 pb-4 border-b">
        <div>
          <h1 className="text-2xl font-bold tracking-tight text-gray-900">
            {isBarber ? `Agenda de ${profile?.name}` : "Agenda de Atendimentos"}
          </h1>
          <p className="text-sm text-gray-500">
            {isBarber
              ? "Gerencie os seus atendimentos agendados para este dia."
              : "Visão geral da fila e controle de atendimentos da barbearia."}
          </p>
        </div>

        <div className="flex flex-wrap items-center gap-2">
          {/* Seletor de Barbeiro (Apenas para Administrador) */}
          {isAdmin && (
            <div className="w-48">
              <Select value={selectedBarberFilter} onValueChange={setSelectedBarberFilter}>
                <SelectTrigger className="h-9 text-xs">
                  <SelectValue placeholder="Filtrar Barbeiro" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Todos os Barbeiros</SelectItem>
                  {barbers.map((b) => (
                    <SelectItem key={b.id} value={b.id}>
                      {b.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          )}

          <Button
            variant="outline"
            size="sm"
            onClick={() => setSelectedDate(getTodayStr())}
            className="text-xs h-9"
          >
            Hoje
          </Button>

          <div className="flex items-center gap-1.5">
            <Input
              type="date"
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="w-auto h-9 text-xs"
            />
            <Button
              variant="ghost"
              size="icon"
              className="h-9 w-9"
              onClick={() => fetchAppointments(selectedDate)}
              title="Recarregar"
            >
              <RotateCcw className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </div>

      {/* CARDS DE MÉTRICAS */}
      <div className={`grid grid-cols-2 ${isAdmin ? "md:grid-cols-5" : "md:grid-cols-4"} gap-4`}>
        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-xs font-medium text-muted-foreground uppercase">Total no Dia</CardTitle>
            <CalendarDays className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{total}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-xs font-medium text-amber-600 uppercase">Pendentes</CardTitle>
            <Clock className="h-4 w-4 text-amber-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-amber-600">{pending}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-xs font-medium text-emerald-600 uppercase">Atendidos</CardTitle>
            <CheckCircle className="h-4 w-4 text-emerald-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-emerald-600">{attended}</div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between pb-1.5">
            <CardTitle className="text-xs font-medium text-rose-600 uppercase">Cancelados</CardTitle>
            <XCircle className="h-4 w-4 text-rose-500" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-rose-600">{cancelled}</div>
          </CardContent>
        </Card>

        {isAdmin && (
          <Card className="col-span-2 md:col-span-1 bg-emerald-50/50 border-emerald-200">
            <CardHeader className="flex flex-row items-center justify-between pb-1.5">
              <CardTitle className="text-xs font-bold text-emerald-800 uppercase">Faturamento</CardTitle>
              <DollarSign className="h-4 w-4 text-emerald-600" />
            </CardHeader>
            <CardContent>
              <div className="text-xl font-bold text-emerald-700">
                R$ {totalRevenue.toFixed(2).replace(".", ",")}
              </div>
            </CardContent>
          </Card>
        )}
      </div>

      {/* TABELA DE AGENDAMENTOS */}
      <Card>
        <CardHeader>
          <CardTitle className="text-base font-semibold flex items-center justify-between">
            <span>Atendimentos de {selectedDate}</span>
            {filteredAppointments.length > 0 && (
              <span className="text-xs font-normal text-muted-foreground">
                {filteredAppointments.length} agendamento(s) listado(s)
              </span>
            )}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex flex-col items-center justify-center py-12 text-muted-foreground">
              <Loader2 className="h-8 w-8 animate-spin mb-2" />
              <p className="text-sm">Atualizando agenda...</p>
            </div>
          ) : errorMsg ? (
            <div className="flex items-center gap-2 p-4 text-destructive bg-destructive/10 rounded-md text-sm">
              <AlertCircle className="h-5 w-5 shrink-0" />
              <span>{errorMsg}</span>
            </div>
          ) : filteredAppointments.length === 0 ? (
            <div className="text-center py-12 text-muted-foreground">
              <CalendarDays className="mx-auto h-12 w-12 mb-3 opacity-30" />
              <p className="font-medium text-foreground">Nenhum agendamento encontrado</p>
              <p className="text-sm mt-1">
                {isBarber
                  ? "Você não possui agendamentos para esta data."
                  : "Nenhum cliente agendou para a data ou filtro selecionado."}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead className="w-24">Horário</TableHead>
                    <TableHead>Cliente</TableHead>
                    <TableHead>WhatsApp</TableHead>
                    <TableHead>Serviço</TableHead>
                    {isAdmin && <TableHead>Barbeiro</TableHead>}
                    <TableHead>Status</TableHead>
                    <TableHead className="text-right">Ações</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredAppointments.map((apt) => {
                    const isUpdating = updatingId === apt.id;
                    return (
                      <TableRow key={apt.id}>
                        <TableCell className="font-bold text-base">
                          {apt.appointment_time}
                        </TableCell>
                        <TableCell className="font-medium">
                          {apt.client_name}
                        </TableCell>
                        <TableCell className="font-mono text-xs">
                          <a
                            href={`https://wa.me/55${apt.client_whatsapp.replace(/\D/g, "")}`}
                            target="_blank"
                            rel="noreferrer"
                            className="text-primary hover:underline font-semibold"
                          >
                            {apt.client_whatsapp}
                          </a>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm font-medium">{apt.service?.name}</div>
                          {apt.service?.price && (
                            <div className="text-xs text-muted-foreground">
                              R$ {Number(apt.service.price).toFixed(2).replace(".", ",")}
                            </div>
                          )}
                        </TableCell>
                        {isAdmin && (
                          <TableCell className="text-sm">
                            <span className="inline-flex items-center gap-1.5 font-medium">
                              <User className="h-3.5 w-3.5 text-muted-foreground" />
                              {apt.barber?.name}
                            </span>
                          </TableCell>
                        )}
                        <TableCell>
                          <StatusBadge status={apt.status} />
                        </TableCell>
                        <TableCell className="text-right">
                          {apt.status === "scheduled" ? (
                            <div className="flex items-center justify-end gap-1.5">
                              <Button
                                size="sm"
                                className="h-8 bg-emerald-600 hover:bg-emerald-700 text-white font-medium"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(apt.id, "attended")}
                              >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Atender"}
                              </Button>
                              <Button
                                size="sm"
                                variant="outline"
                                className="h-8 text-rose-600 border-rose-200 hover:bg-rose-50"
                                disabled={isUpdating}
                                onClick={() => handleUpdateStatus(apt.id, "cancelled")}
                              >
                                {isUpdating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : "Cancelar"}
                              </Button>
                            </div>
                          ) : (
                            <span className="text-xs text-muted-foreground italic">Finalizado</span>
                          )}
                        </TableCell>
                      </TableRow>
                    );
                  })}
                </TableBody>
              </Table>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

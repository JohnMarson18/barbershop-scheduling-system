"use client";

import { useState, useEffect } from "react";
import { useAuth } from "@/hooks/useAuth";
import { useBarbers } from "@/hooks/useBarbers";
import { useBlockedSlots } from "@/hooks/useBlockedSlots";
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Loader2, Plus, Trash2, Clock, AlertCircle } from "lucide-react";

export default function AdminBlockedSlotsPage() {
  const { profile, isAdmin, isBarber } = useAuth();
  const getTodayStr = () => {
    const now = new Date();
    return `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
  };

  const { barbers } = useBarbers();
  const { blockedSlots, loading, error, createBlockedSlot, deleteBlockedSlot } = useBlockedSlots();

  const [barberId, setBarberId] = useState("");
  const [blockDate, setBlockDate] = useState(getTodayStr());
  const [startTime, setStartTime] = useState("12:00");
  const [endTime, setEndTime] = useState("13:00");
  const [reason, setReason] = useState("Horário de Almoço");
  const [submitting, setSubmitting] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (isBarber && profile?.barber_id) {
      setBarberId(profile.barber_id);
    }
  }, [isBarber, profile]);

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    setFormError(null);

    if (!barberId) {
      setFormError("Selecione um barbeiro.");
      return;
    }

    if (!blockDate) {
      setFormError("Selecione a data do bloqueio.");
      return;
    }

    if (startTime >= endTime) {
      setFormError("O horário de início deve ser anterior ao horário de fim.");
      return;
    }

    setSubmitting(true);
    const ok = await createBlockedSlot({
      barber_id: barberId,
      block_date: blockDate,
      start_time: startTime,
      end_time: endTime,
      reason: reason.trim() || undefined,
    });

    if (ok) {
      setReason("Horário de Almoço");
    } else {
      setFormError(error || "Erro ao cadastrar bloqueio de horário.");
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string, info: string) => {
    if (confirm(`Deseja remover o bloqueio de ${info}?`)) {
      await deleteBlockedSlot(id);
    }
  };

  const displayedSlots = isBarber && profile?.barber_id
    ? blockedSlots.filter((s: any) => s.barber_id === profile.barber_id)
    : blockedSlots;

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold tracking-tight text-gray-900">
          {isBarber ? "Meus Bloqueios de Horário" : "Bloqueios de Horário"}
        </h1>
        <p className="text-sm text-gray-500">
          {isBarber
            ? "Bloqueie os seus horários para almoço, compromissos ou folgas."
            : "Bloqueie horários para intervalos de almoço, folgas ou compromissos externos."}
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 items-start">
        {/* FORMULÁRIO DE BLOQUEIO */}
        <Card className="lg:col-span-1">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Plus className="h-4 w-4 text-primary" />
              Novo Bloqueio
            </CardTitle>
            <CardDescription>Defina o intervalo a ser travado</CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleCreate} className="space-y-4">
              <div className="space-y-1.5">
                <Label>Barbeiro *</Label>
                <Select value={barberId} onValueChange={setBarberId} disabled={isBarber || submitting}>
                  <SelectTrigger>
                    <SelectValue placeholder="Selecione o barbeiro" />
                  </SelectTrigger>
                  <SelectContent>
                    {barbers.map((b) => (
                      <SelectItem key={b.id} value={b.id}>
                        {b.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="block_date">Data do Bloqueio *</Label>
                <Input
                  id="block_date"
                  type="date"
                  value={blockDate}
                  onChange={(e) => setBlockDate(e.target.value)}
                  disabled={submitting}
                  required
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-1.5">
                  <Label htmlFor="start_time">Início (HH:mm) *</Label>
                  <Input
                    id="start_time"
                    type="time"
                    value={startTime}
                    onChange={(e) => setStartTime(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>

                <div className="space-y-1.5">
                  <Label htmlFor="end_time">Fim (HH:mm) *</Label>
                  <Input
                    id="end_time"
                    type="time"
                    value={endTime}
                    onChange={(e) => setEndTime(e.target.value)}
                    disabled={submitting}
                    required
                  />
                </div>
              </div>

              <div className="space-y-1.5">
                <Label htmlFor="reason">Motivo (opcional)</Label>
                <Input
                  id="reason"
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  placeholder="Ex: Almoço, Folga, Médico"
                  disabled={submitting}
                />
              </div>

              {formError && (
                <div className="flex items-center gap-1.5 text-xs text-destructive bg-destructive/10 p-2.5 rounded">
                  <AlertCircle className="h-4 w-4 shrink-0" />
                  <span>{formError}</span>
                </div>
              )}

              <Button type="submit" className="w-full" disabled={submitting}>
                {submitting ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Salvando...
                  </>
                ) : (
                  "Bloquear Horário"
                )}
              </Button>
            </form>
          </CardContent>
        </Card>

        {/* TABELA DE BLOQUEIOS CADASTRADOS */}
        <Card className="lg:col-span-2">
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Horários Bloqueados
            </CardTitle>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex justify-center py-10">
                <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
              </div>
            ) : displayedSlots.length === 0 ? (
              <div className="text-center py-10 text-muted-foreground">
                <Clock className="mx-auto h-10 w-10 mb-2 opacity-30" />
                <p>Nenhum horário bloqueado.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Data</TableHead>
                      <TableHead>Barbeiro</TableHead>
                      <TableHead>Intervalo</TableHead>
                      <TableHead>Motivo</TableHead>
                      <TableHead className="text-right">Ações</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {displayedSlots.map((slot: any) => (
                      <TableRow key={slot.id}>
                        <TableCell className="font-medium text-sm">
                          {slot.block_date}
                        </TableCell>
                        <TableCell className="text-sm">
                          {slot.barber?.name || "Barbeiro"}
                        </TableCell>
                        <TableCell className="font-mono text-sm font-semibold">
                          {slot.start_time.substring(0, 5)} - {slot.end_time.substring(0, 5)}
                        </TableCell>
                        <TableCell className="text-xs text-muted-foreground">
                          {slot.reason || "-"}
                        </TableCell>
                        <TableCell className="text-right">
                          <Button
                            size="sm"
                            variant="ghost"
                            className="text-destructive hover:bg-destructive/10"
                            onClick={() =>
                              handleDelete(
                                slot.id,
                                `${slot.block_date} (${slot.start_time} - ${slot.end_time})`
                              )
                            }
                            title="Remover bloqueio"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </TableCell>
                      </TableRow>
                    ))}
                  </TableBody>
                </Table>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

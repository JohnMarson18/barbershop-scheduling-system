"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { CalendarDays, Clock, Loader2 } from "lucide-react";

interface AvailableSlotsProps {
  selectedDate: string;
  selectedBarberId: string;
  selectedServiceId: string;
  selectedSlot: string;
  onSlotSelect: (slot: string) => void;
}

export function AvailableSlots({
  selectedDate,
  selectedBarberId,
  selectedServiceId,
  selectedSlot,
  onSlotSelect,
}: AvailableSlotsProps) {
  const [availableSlots, setAvailableSlots] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchSlots = async () => {
      if (!selectedDate || !selectedBarberId || !selectedServiceId) {
        setAvailableSlots([]);
        return;
      }
      setLoading(true);
      setError(null);
      try {
        const response = await fetch(
          `/api/available-slots?barberId=${selectedBarberId}&date=${selectedDate}&serviceId=${selectedServiceId}`
        );
        const result = await response.json();
        if (result.success) {
          setAvailableSlots(result.data || []);
        } else {
          setError(result.error || "Não foi possível carregar os horários.");
          setAvailableSlots([]);
        }
      } catch (err) {
        setError("Erro ao carregar horários disponíveis.");
        setAvailableSlots([]);
      } finally {
        setLoading(false);
      }
    };

    fetchSlots();
  }, [selectedDate, selectedBarberId, selectedServiceId]);

  if (!selectedDate || !selectedBarberId || !selectedServiceId) {
    return (
      <Card>
        <CardContent className="pt-6 text-center text-muted-foreground">
          <CalendarDays className="mx-auto h-12 w-12 mb-3 opacity-50" />
          <p>Selecione um serviço, barbeiro e data para consultar os horários.</p>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="h-full">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-lg">
          <Clock className="h-5 w-5 text-primary" />
          Horários Disponíveis
        </CardTitle>
        <p className="text-sm text-muted-foreground">
          Toque no horário desejado para prosseguir com o agendamento.
        </p>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex flex-col items-center justify-center py-10 text-muted-foreground">
            <Loader2 className="h-8 w-8 animate-spin mb-2" />
            <p className="text-sm">Consultando agenda em tempo real...</p>
          </div>
        ) : error ? (
          <div className="bg-destructive/10 text-destructive p-4 rounded-md text-sm text-center">
            {error}
          </div>
        ) : availableSlots.length === 0 ? (
          <div className="text-center py-10 text-muted-foreground">
            <CalendarDays className="mx-auto h-12 w-12 mb-3 opacity-40" />
            <p className="font-medium text-foreground">Sem horários disponíveis para este dia</p>
            <p className="text-sm mt-1">
              Todos os horários estão ocupados ou a barbearia não abre nesta data. Experimente outro dia ou barbeiro.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-3 sm:grid-cols-4 gap-2">
            {availableSlots.map((slot) => {
              const isSelected = selectedSlot === slot;
              return (
                <Button
                  key={slot}
                  type="button"
                  variant={isSelected ? "default" : "outline"}
                  className={`h-11 font-medium transition-all ${
                    isSelected ? "ring-2 ring-primary ring-offset-2 scale-105" : ""
                  }`}
                  onClick={() => onSlotSelect(slot)}
                >
                  {slot}
                </Button>
              );
            })}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

"use client";

import { useState, useCallback } from "react";
import { CreateAppointment, CreateAppointmentSchema, Appointment } from "@/schemas";
import { ActionResponse } from "@/types/api";

export function useAppointment() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const createAppointment = useCallback(
    async (data: CreateAppointment): Promise<Appointment | null> => {
      setLoading(true);
      setError(null);

      const validation = CreateAppointmentSchema.safeParse(data);
      if (!validation.success) {
        setError(validation.error.errors.map((e) => e.message).join(", "));
        setLoading(false);
        return null;
      }

      try {
        const response = await fetch("/api/appointments", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(validation.data),
        });

        const result: ActionResponse<Appointment> = await response.json();
        if (!result.success) {
          setError(result.error || "Erro ao realizar agendamento.");
          return null;
        }

        return result.data || null;
      } catch (err) {
        setError("Erro de rede. Tente novamente.");
        return null;
      } finally {
        setLoading(false);
      }
    },
    []
  );

  return { createAppointment, loading, error };
}

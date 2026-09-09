"use client";

import { useState, useEffect, useCallback } from "react";
import { Barber, CreateBarber, UpdateBarber } from "@/schemas";
import { ActionResponse } from "@/types/api";

export function useBarbers(includeAll = false) {
  const [barbers, setBarbers] = useState<Barber[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBarbers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = includeAll ? "/api/barbers?all=true" : "/api/barbers";
      const response = await fetch(url);
      const result: ActionResponse<Barber[]> = await response.json();
      if (result.success) {
        setBarbers(result.data || []);
      } else {
        setError(result.error || "Erro ao carregar barbeiros.");
      }
    } catch (err) {
      setError("Erro de rede ao buscar barbeiros.");
    } finally {
      setLoading(false);
    }
  }, [includeAll]);

  useEffect(() => {
    fetchBarbers();
  }, [fetchBarbers]);

  const createBarber = useCallback(
    async (input: CreateBarber): Promise<boolean> => {
      try {
        const response = await fetch("/api/barbers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const result: ActionResponse<Barber> = await response.json();
        if (result.success) {
          await fetchBarbers();
          return true;
        } else {
          setError(result.error || "Erro ao cadastrar barbeiro.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao salvar barbeiro.");
        return false;
      }
    },
    [fetchBarbers]
  );

  const updateBarber = useCallback(
    async (id: string, input: UpdateBarber): Promise<boolean> => {
      try {
        const response = await fetch(`/api/barbers/${id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const result: ActionResponse<Barber> = await response.json();
        if (result.success) {
          await fetchBarbers();
          return true;
        } else {
          setError(result.error || "Erro ao atualizar barbeiro.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao atualizar barbeiro.");
        return false;
      }
    },
    [fetchBarbers]
  );

  const deleteBarber = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/barbers/${id}`, {
          method: "DELETE",
        });
        const result: ActionResponse<null> = await response.json();
        if (result.success) {
          await fetchBarbers();
          return true;
        } else {
          setError(result.error || "Erro ao desativar barbeiro.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao desativar barbeiro.");
        return false;
      }
    },
    [fetchBarbers]
  );

  return {
    barbers,
    loading,
    error,
    reload: fetchBarbers,
    createBarber,
    updateBarber,
    deleteBarber,
  };
}

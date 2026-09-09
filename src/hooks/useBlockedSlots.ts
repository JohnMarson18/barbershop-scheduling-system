"use client";

import { useState, useEffect, useCallback } from "react";
import { BlockedSlot, CreateBlockedSlot } from "@/schemas";
import { ActionResponse } from "@/types/api";

export function useBlockedSlots(barberId?: string, date?: string) {
  const [blockedSlots, setBlockedSlots] = useState<BlockedSlot[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchBlockedSlots = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      let url = "/api/blocked-slots";
      const params = new URLSearchParams();
      if (barberId) params.append("barberId", barberId);
      if (date) params.append("date", date);
      if (params.toString()) url += `?${params.toString()}`;

      const response = await fetch(url);
      const result: ActionResponse<BlockedSlot[]> = await response.json();
      if (result.success) {
        setBlockedSlots(result.data || []);
      } else {
        setError(result.error || "Erro ao carregar bloqueios.");
      }
    } catch (err) {
      setError("Erro de rede ao buscar bloqueios.");
    } finally {
      setLoading(false);
    }
  }, [barberId, date]);

  useEffect(() => {
    fetchBlockedSlots();
  }, [fetchBlockedSlots]);

  const createBlockedSlot = useCallback(
    async (input: CreateBlockedSlot): Promise<boolean> => {
      try {
        const response = await fetch("/api/blocked-slots", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(input),
        });
        const result: ActionResponse<BlockedSlot> = await response.json();
        if (result.success) {
          await fetchBlockedSlots();
          return true;
        } else {
          setError(result.error || "Erro ao cadastrar bloqueio.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao salvar bloqueio.");
        return false;
      }
    },
    [fetchBlockedSlots]
  );

  const deleteBlockedSlot = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/blocked-slots/${id}`, {
          method: "DELETE",
        });
        const result: ActionResponse<null> = await response.json();
        if (result.success) {
          await fetchBlockedSlots();
          return true;
        } else {
          setError(result.error || "Erro ao remover bloqueio.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao remover bloqueio.");
        return false;
      }
    },
    [fetchBlockedSlots]
  );

  return {
    blockedSlots,
    loading,
    error,
    reload: fetchBlockedSlots,
    createBlockedSlot,
    deleteBlockedSlot,
  };
}

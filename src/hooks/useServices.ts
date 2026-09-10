"use client";

import { useState, useEffect, useCallback } from "react";
import { Service, CreateService, UpdateService } from "@/schemas";
import { ActionResponse } from "@/types/api";
import { useAuth } from "@/contexts/AuthContext";

export function useServices(includeAll = false) {
  const { getAuthHeaders } = useAuth();
  const [services, setServices] = useState<Service[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  const fetchServices = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const url = includeAll ? "/api/services?all=true" : "/api/services";
      const response = await fetch(url);
      const result: ActionResponse<Service[]> = await response.json();
      if (result.success) {
        setServices(result.data || []);
      } else {
        setError(result.error || "Erro ao carregar serviços.");
      }
    } catch (err) {
      setError("Erro de rede ao buscar serviços.");
    } finally {
      setLoading(false);
    }
  }, [includeAll]);

  useEffect(() => {
    fetchServices();
  }, [fetchServices]);

  const createService = useCallback(
    async (input: CreateService): Promise<boolean> => {
      try {
        const response = await fetch("/api/services", {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(input),
        });
        const result: ActionResponse<Service> = await response.json();
        if (result.success) {
          await fetchServices();
          return true;
        } else {
          setError(result.error || "Erro ao criar serviço.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao salvar serviço.");
        return false;
      }
    },
    [fetchServices, getAuthHeaders]
  );

  const updateService = useCallback(
    async (id: string, input: UpdateService): Promise<boolean> => {
      try {
        const response = await fetch(`/api/services/${id}`, {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
            ...getAuthHeaders(),
          },
          body: JSON.stringify(input),
        });
        const result: ActionResponse<Service> = await response.json();
        if (result.success) {
          await fetchServices();
          return true;
        } else {
          setError(result.error || "Erro ao atualizar serviço.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao atualizar serviço.");
        return false;
      }
    },
    [fetchServices, getAuthHeaders]
  );

  const deleteService = useCallback(
    async (id: string): Promise<boolean> => {
      try {
        const response = await fetch(`/api/services/${id}`, {
          method: "DELETE",
          headers: getAuthHeaders(),
        });
        const result: ActionResponse<null> = await response.json();
        if (result.success) {
          await fetchServices();
          return true;
        } else {
          setError(result.error || "Erro ao remover serviço.");
          return false;
        }
      } catch (err) {
        setError("Erro de rede ao remover serviço.");
        return false;
      }
    },
    [fetchServices, getAuthHeaders]
  );

  return {
    services,
    loading,
    error,
    reload: fetchServices,
    createService,
    updateService,
    deleteService,
  };
}

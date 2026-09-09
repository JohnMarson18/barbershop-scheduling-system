"use client";

import React, { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import { zodResolver } from "@hookform/resolvers/zod";
import { ClientBookingFormSchema, ClientBookingFormData, Appointment } from "@/schemas";
import { useAppointment } from "@/hooks/useAppointment";
import { useServices } from "@/hooks/useServices";
import { useBarbers } from "@/hooks/useBarbers";
import { useAuth } from "@/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { PrivacyPolicyModal } from "./PrivacyPolicyModal";
import { Loader2, User, Phone, Clock, AlertCircle, CheckCircle2, ShieldCheck } from "lucide-react";
import { siteConfig } from "@/config/site";

interface AppointmentFormProps {
  selectedDate: string;
  selectedBarberId: string;
  selectedServiceId: string;
  selectedSlot: string;
  onSuccess: (appointment: Appointment) => void;
}

export function AppointmentForm({
  selectedDate,
  selectedBarberId,
  selectedServiceId,
  selectedSlot,
  onSuccess,
}: AppointmentFormProps) {
  const { services } = useServices();
  const { barbers } = useBarbers();
  const { profile } = useAuth();
  const { createAppointment, loading, error } = useAppointment();
  const [phoneVal, setPhoneVal] = useState("");

  const selectedService = services.find((s) => s.id === selectedServiceId);
  const selectedBarber = barbers.find((b) => b.id === selectedBarberId);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors },
  } = useForm<ClientBookingFormData>({
    resolver: zodResolver(ClientBookingFormSchema),
    defaultValues: {
      client_name: profile?.name || "",
      client_whatsapp: "",
      appointment_time: selectedSlot || "",
      lgpd_consent: true,
    },
  });

  const lgpdConsent = watch("lgpd_consent");

  // Preenche dados automaticamente se o cliente estiver logado
  useEffect(() => {
    if (profile?.name) {
      setValue("client_name", profile.name, { shouldValidate: true });
    }
  }, [profile, setValue]);

  // Atualiza appointment_time no form sempre que o slot selecionado mudar
  useEffect(() => {
    if (selectedSlot) {
      setValue("appointment_time", selectedSlot, { shouldValidate: true });
    }
  }, [selectedSlot, setValue]);

  // Máscara automática de telefone: (XX) 9XXXX-XXXX
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let v = e.target.value.replace(/\D/g, "");
    if (v.length > 11) v = v.substring(0, 11);

    let formatted = "";
    if (v.length > 0) {
      formatted = `(${v.substring(0, 2)}`;
    }
    if (v.length > 2) {
      if (v.length > 6) {
        if (v.length === 11) {
          formatted += `) ${v.substring(2, 7)}-${v.substring(7)}`;
        } else {
          formatted += `) ${v.substring(2, 6)}-${v.substring(6)}`;
        }
      } else {
        formatted += `) ${v.substring(2)}`;
      }
    }

    setPhoneVal(formatted);
    setValue("client_whatsapp", formatted, { shouldValidate: true });
  };

  const onSubmit = async (data: ClientBookingFormData) => {
    if (!selectedSlot) return;

    const payload = {
      user_id: profile?.id || null,
      service_id: selectedServiceId,
      barber_id: selectedBarberId,
      appointment_date: selectedDate,
      appointment_time: selectedSlot,
      client_name: data.client_name,
      client_whatsapp: data.client_whatsapp,
      lgpd_consent: true,
    };

    const appointment = await createAppointment(payload);
    if (appointment) {
      onSuccess(appointment);
    }
  };

  const formattedDate = (() => {
    if (!selectedDate) return "";
    const [y, m, d] = selectedDate.split("-").map(Number);
    const dateObj = new Date(y, m - 1, d);
    return dateObj.toLocaleDateString("pt-BR", {
      weekday: "long",
      day: "numeric",
      month: "long",
    });
  })();

  return (
    <Card className="h-full flex flex-col justify-between">
      <div>
        <CardHeader>
          <CardTitle className="text-lg flex items-center gap-2">
            <CheckCircle2 className="h-5 w-5 text-primary" />
            Dados do Agendamento
          </CardTitle>
          <p className="text-sm text-muted-foreground capitalize">{formattedDate}</p>
        </CardHeader>

        <CardContent className="space-y-4">
          {/* Resumo da seleção */}
          <div className="bg-muted/50 rounded-lg p-3 space-y-1.5 text-sm border">
            <div className="flex justify-between">
              <span className="text-muted-foreground">Serviço:</span>
              <span className="font-medium">{selectedService?.name || "Carregando..."}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Duração:</span>
              <span className="font-medium">{selectedService?.duration_minutes} min</span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Preço:</span>
              <span className="font-semibold text-primary">
                R$ {Number(selectedService?.price || 0).toFixed(2).replace(".", ",")}
              </span>
            </div>
            <div className="flex justify-between">
              <span className="text-muted-foreground">Barbeiro:</span>
              <span className="font-medium">{selectedBarber?.name || "Carregando..."}</span>
            </div>
            <div className="flex justify-between pt-1 border-t">
              <span className="text-muted-foreground">Horário Selecionado:</span>
              <span className={`font-bold ${selectedSlot ? "text-primary" : "text-amber-600"}`}>
                {selectedSlot || "Nenhum selecionado"}
              </span>
            </div>
          </div>

          {!selectedSlot && (
            <div className="flex items-center gap-2 text-xs text-amber-700 bg-amber-50 p-2.5 rounded border border-amber-200">
              <Clock className="h-4 w-4 shrink-0" />
              <span>Selecione um horário na coluna ao lado para habilitar a confirmação.</span>
            </div>
          )}

          <form id="appointment-form" onSubmit={handleSubmit(onSubmit)} className="space-y-3.5">
            {/* Nome Completo */}
            <div className="space-y-1">
              <Label htmlFor="client_name">Seu Nome Completo *</Label>
              <div className="relative">
                <User className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_name"
                  {...register("client_name")}
                  placeholder="Ex: João da Silva"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
              {errors.client_name && (
                <p className="text-xs text-destructive">{errors.client_name.message}</p>
              )}
            </div>

            {/* WhatsApp */}
            <div className="space-y-1">
              <Label htmlFor="client_whatsapp">Seu WhatsApp (com DDD) *</Label>
              <div className="relative">
                <Phone className="absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input
                  id="client_whatsapp"
                  type="tel"
                  value={phoneVal}
                  onChange={handlePhoneChange}
                  placeholder="(11) 98765-4321"
                  className="pl-9"
                  disabled={loading}
                />
              </div>
              {errors.client_whatsapp && (
                <p className="text-xs text-destructive">{errors.client_whatsapp.message}</p>
              )}
            </div>

            {/* Checkbox de Consentimento LGPD */}
            <div className="pt-2 border-t">
              <label className="flex items-start gap-2.5 cursor-pointer text-xs text-muted-foreground leading-snug">
                <input
                  type="checkbox"
                  {...register("lgpd_consent")}
                  defaultChecked
                  className="mt-0.5 rounded border-gray-300 text-primary focus:ring-primary h-4 w-4"
                />
                <span>
                  Concordo que a {siteConfig.name} utilize meu WhatsApp estritamente para envio de confirmações e lembretes de atendimento conforme a LGPD. Consulte nossa{" "}
                  <PrivacyPolicyModal />.
                </span>
              </label>
              {errors.lgpd_consent && (
                <p className="text-xs text-destructive mt-1">{errors.lgpd_consent.message}</p>
              )}
            </div>

            {/* Alerta de erro da API */}
            {error && (
              <div className="flex items-start gap-2 bg-destructive/10 border border-destructive/20 text-destructive text-sm p-3 rounded-md">
                <AlertCircle className="h-5 w-5 shrink-0 mt-0.5" />
                <span>{error}</span>
              </div>
            )}
          </form>
        </CardContent>
      </div>

      <div className="p-6 pt-0">
        <Button
          type="submit"
          form="appointment-form"
          className="w-full h-12 text-base font-semibold shadow"
          disabled={loading || !selectedSlot}
        >
          {loading ? (
            <>
              <Loader2 className="mr-2 h-5 w-5 animate-spin" />
              Confirmando Agendamento...
            </>
          ) : (
            "Confirmar Agendamento"
          )}
        </Button>
      </div>
    </Card>
  );
}

import { describe, it, expect } from "vitest";
import {
  isWithinBusinessHours,
  hasTimeConflict,
  anonymizeClientAppointments,
  listAppointments,
} from "@/services/appointment.service";
import { CreateAppointmentSchema, ClientBookingFormSchema } from "@/schemas";

describe("Appointment Service - Regras de Negócio e Casos de Borda", () => {
  describe("Horário de Funcionamento (isWithinBusinessHours)", () => {
    it("deve retornar falso para domingo (dia 0)", () => {
      expect(isWithinBusinessHours("10:00", 0)).toBe(false);
      expect(isWithinBusinessHours("14:00", 0)).toBe(false);
    });

    it("deve retornar verdadeiro para horário válido em dia de semana (segunda a sexta)", () => {
      // Segunda-feira (dia 1): 09:00 às 19:00
      expect(isWithinBusinessHours("09:00", 1)).toBe(true);
      expect(isWithinBusinessHours("14:30", 2)).toBe(true);
      expect(isWithinBusinessHours("18:30", 5, 30)).toBe(true);
    });

    it("deve retornar falso para horário que ultrapassa o fechamento ou fora do expediente", () => {
      expect(isWithinBusinessHours("19:00", 5, 30)).toBe(false);
      expect(isWithinBusinessHours("08:30", 1)).toBe(false);
      expect(isWithinBusinessHours("19:30", 1)).toBe(false);
      expect(isWithinBusinessHours("22:00", 3)).toBe(false);
    });

    it("deve respeitar expediente reduzido no sábado (dia 6: 09:00 às 13:00)", () => {
      expect(isWithinBusinessHours("10:00", 6)).toBe(true);
      expect(isWithinBusinessHours("12:30", 6)).toBe(true);
      expect(isWithinBusinessHours("14:00", 6)).toBe(false);
    });
  });

  describe("Detecção de Conflitos de Horário (hasTimeConflict)", () => {
    const existingAppointments = [
      { appointment_time: "10:00", duration_minutes: 30 }, // 10:00 às 10:30
      { appointment_time: "14:00", duration_minutes: 60 }, // 14:00 às 15:00
    ];

    const blockedSlots = [
      { start_time: "12:00", end_time: "13:00" }, // Almoço
    ];

    it("deve detectar conflito com agendamento existente no mesmo horário", () => {
      expect(hasTimeConflict("10:00", 30, existingAppointments, blockedSlots)).toBe(true);
    });

    it("deve detectar conflito de sobreposição parcial", () => {
      // Tentativa às 10:15 para serviço de 30min (colide com 10:00-10:30)
      expect(hasTimeConflict("10:15", 30, existingAppointments, blockedSlots)).toBe(true);
      // Tentativa às 09:45 para serviço de 30min (colide com 10:00)
      expect(hasTimeConflict("09:45", 30, existingAppointments, blockedSlots)).toBe(true);
    });

    it("deve detectar colisão entre serviços de durações diferentes (ex: combo 50min bloqueando 10:30)", () => {
      const comboAppointment = [{ appointment_time: "10:00", duration_minutes: 50 }]; // 10:00 às 10:50
      expect(hasTimeConflict("10:30", 30, comboAppointment, [])).toBe(true);
      expect(hasTimeConflict("10:45", 15, comboAppointment, [])).toBe(true);
      expect(hasTimeConflict("10:50", 30, comboAppointment, [])).toBe(false);
    });

    it("deve detectar conflito com horário bloqueado (almoço)", () => {
      expect(hasTimeConflict("12:00", 30, existingAppointments, blockedSlots)).toBe(true);
      expect(hasTimeConflict("12:30", 30, existingAppointments, blockedSlots)).toBe(true);
      expect(hasTimeConflict("11:45", 30, existingAppointments, blockedSlots)).toBe(true);
    });

    it("deve liberar horários sem qualquer conflito", () => {
      expect(hasTimeConflict("10:30", 30, existingAppointments, blockedSlots)).toBe(false);
      expect(hasTimeConflict("11:00", 30, existingAppointments, blockedSlots)).toBe(false);
      expect(hasTimeConflict("13:00", 30, existingAppointments, blockedSlots)).toBe(false);
    });
  });

  describe("Validação com Zod e Conformidade LGPD", () => {
    it("deve validar com sucesso um payload correto de agendamento", () => {
      const validPayload = {
        service_id: "a0000000-0000-0000-0000-000000000001",
        barber_id: "b0000000-0000-0000-0000-000000000001",
        client_name: "Marcos Souza",
        client_whatsapp: "(11) 98765-4321",
        appointment_date: "2026-10-15",
        appointment_time: "10:00",
        lgpd_consent: true,
      };

      const result = CreateAppointmentSchema.safeParse(validPayload);
      expect(result.success).toBe(true);
    });

    it("deve exigir consentimento LGPD no formulário público do cliente", () => {
      const formWithoutConsent = {
        client_name: "Marcos Souza",
        client_whatsapp: "(11) 98765-4321",
        appointment_time: "10:00",
        lgpd_consent: false,
      };

      const result = ClientBookingFormSchema.safeParse(formWithoutConsent);
      expect(result.success).toBe(false);
      if (!result.success) {
        expect(result.error.flatten().fieldErrors.lgpd_consent).toBeDefined();
      }
    });

    it("deve aceitar formulário público quando o consentimento LGPD for verdadeiro", () => {
      const formWithConsent = {
        client_name: "Marcos Souza",
        client_whatsapp: "(11) 98765-4321",
        appointment_time: "10:00",
        lgpd_consent: true,
      };

      const result = ClientBookingFormSchema.safeParse(formWithConsent);
      expect(result.success).toBe(true);
    });

    it("deve rejeitar WhatsApp fora do padrão (XX) 9XXXX-XXXX", () => {
      const invalidPayload = {
        service_id: "a0000000-0000-0000-0000-000000000001",
        barber_id: "b0000000-0000-0000-0000-000000000001",
        client_name: "Marcos Souza",
        client_whatsapp: "11987654321",
        appointment_date: "2026-10-15",
        appointment_time: "10:00",
      };

      const result = CreateAppointmentSchema.safeParse(invalidPayload);
      expect(result.success).toBe(false);
    });
  });

  describe("Anonimização LGPD (Artigo 18 - Direito ao Esquecimento)", () => {
    it("deve desvincular nome e telefone substituindo por dados anonimizados", async () => {
      // Anonimiza dados do usuário de teste
      const res = await anonymizeClientAppointments({ userId: "user-client-0001" });
      expect(res.success).toBe(true);

      // Busca os agendamentos e verifica se o agendamento foi anonimizado
      const listRes = await listAppointments();
      expect(listRes.success).toBe(true);

      const anonymizedApt = listRes.data?.find((apt) => apt.id === "demo-apt-0001");
      expect(anonymizedApt).toBeDefined();
      expect(anonymizedApt?.client_name).toBe("Cliente Anonimizado (LGPD)");
      expect(anonymizedApt?.client_whatsapp).toBe("(00) 00000-0000");
      expect(anonymizedApt?.is_anonymized).toBe(true);
      expect(anonymizedApt?.user_id).toBeNull();
    });

    it("deve rejeitar solicitação de anonimização sem nenhum identificador", async () => {
      const res = await anonymizeClientAppointments({});
      expect(res.success).toBe(false);
      expect(res.error).toBeDefined();
    });
  });
});

import { z } from "zod";

// Schema base para horário (HH:mm)
export const timeSchema = z.string().regex(/^([0-1]?[0-9]|2[0-3]):[0-5][0-9]$/, {
  message: "Horário inválido, use o formato HH:mm",
});

// Schema base para data (YYYY-MM-DD)
export const dateSchema = z.string().regex(/^\d{4}-\d{2}-\d{2}$/, {
  message: "Data inválida, use o formato YYYY-MM-DD",
});

// Schema de Serviço
export const ServiceSchema = z.object({
  id: z.string().uuid("ID de serviço inválido"),
  name: z.string().min(2, "Nome do serviço deve ter pelo menos 2 caracteres").trim(),
  description: z.string().optional().nullable(),
  duration_minutes: z.coerce.number().int().positive("Duração deve ser maior que 0 minutos"),
  price: z.coerce.number().nonnegative("Preço não pode ser negativo"),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateServiceSchema = ServiceSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateServiceSchema = CreateServiceSchema.partial();

// Schema de Barbeiro
export const BarberSchema = z.object({
  id: z.string().uuid("ID de barbeiro inválido"),
  name: z.string().min(2, "Nome do barbeiro deve ter pelo menos 2 caracteres").trim(),
  is_active: z.boolean().default(true),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateBarberSchema = BarberSchema.omit({ id: true, created_at: true, updated_at: true });
export const UpdateBarberSchema = CreateBarberSchema.partial();

// Schema de Horário Bloqueado
export const BaseBlockedSlotSchema = z.object({
  id: z.string().uuid(),
  barber_id: z.string().uuid("Selecione um barbeiro válido"),
  block_date: dateSchema,
  start_time: timeSchema,
  end_time: timeSchema,
  reason: z.string().optional().nullable(),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const BlockedSlotSchema = BaseBlockedSlotSchema.refine((data) => data.start_time < data.end_time, {
  message: "Horário de início deve ser anterior ao horário de fim",
  path: ["end_time"],
});

export const CreateBlockedSlotSchema = BaseBlockedSlotSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).refine((data) => data.start_time < data.end_time, {
  message: "Horário de início deve ser anterior ao horário de fim",
  path: ["end_time"],
});

export const UpdateBlockedSlotSchema = BaseBlockedSlotSchema.omit({
  id: true,
  created_at: true,
  updated_at: true,
}).partial();

// Schema de Agendamento com Suporte a LGPD e Usuário Autenticado
export const AppointmentSchema = z.object({
  id: z.string().uuid(),
  user_id: z.string().uuid().optional().nullable(),
  service_id: z.string().uuid("Selecione um serviço válido"),
  barber_id: z.string().uuid("Selecione um barbeiro válido"),
  client_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").trim(),
  client_whatsapp: z.string().regex(/^\(\d{2}\)\s?(?:9\d{4}|\d{4})-\d{4}$/, {
    message: "WhatsApp inválido, use o formato (XX) 9XXXX-XXXX",
  }),
  appointment_date: dateSchema,
  appointment_time: timeSchema,
  status: z.enum(["scheduled", "attended", "cancelled"]).default("scheduled"),
  lgpd_consent: z.boolean().default(true),
  lgpd_consent_date: z.string().optional(),
  is_anonymized: z.boolean().default(false),
  created_at: z.string().optional(),
  updated_at: z.string().optional(),
});

export const CreateAppointmentSchema = AppointmentSchema.omit({
  id: true,
  status: true,
  is_anonymized: true,
  created_at: true,
  updated_at: true,
});

export const UpdateAppointmentSchema = z.object({
  status: z.enum(["scheduled", "attended", "cancelled"]),
});

// Schema específico para o formulário público com consentimento LGPD obrigatório
export const ClientBookingFormSchema = z.object({
  client_name: z.string().min(3, "Nome deve ter pelo menos 3 caracteres").trim(),
  client_whatsapp: z.string().regex(/^\(\d{2}\)\s?(?:9\d{4}|\d{4})-\d{4}$/, {
    message: "WhatsApp inválido, use o formato (XX) 9XXXX-XXXX",
  }),
  appointment_time: timeSchema,
  lgpd_consent: z.literal(true, {
    errorMap: () => ({ message: "Você precisa aceitar os termos de privacidade para agendar." }),
  }),
});

// Schemas de Autenticação e Perfis
export const LoginSchema = z.object({
  email: z.string().email("Endereço de email inválido").trim().toLowerCase(),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
});

export const RegisterSchema = z.object({
  name: z.string().min(3, "Nome completo deve ter pelo menos 3 caracteres").trim(),
  email: z.string().email("Endereço de email inválido").trim().toLowerCase(),
  password: z.string().min(6, "A senha deve ter no mínimo 6 caracteres"),
  phone: z.string().regex(/^\(\d{2}\)\s?(?:9\d{4}|\d{4})-\d{4}$/, {
    message: "Telefone/WhatsApp inválido, use o formato (XX) 9XXXX-XXXX",
  }).optional(),
  role: z.enum(["admin", "barber", "client"]).default("client"),
  barber_id: z.string().uuid().optional().nullable(),
  lgpd_consent: z.literal(true, {
    errorMap: () => ({ message: "É obrigatório aceitar a política de privacidade da LGPD." }),
  }),
});

// Tipos inferidos dos schemas
export type Service = z.infer<typeof ServiceSchema>;
export type CreateService = z.infer<typeof CreateServiceSchema>;
export type UpdateService = z.infer<typeof UpdateServiceSchema>;

export type Barber = z.infer<typeof BarberSchema>;
export type CreateBarber = z.infer<typeof CreateBarberSchema>;
export type UpdateBarber = z.infer<typeof UpdateBarberSchema>;

export type BlockedSlot = z.infer<typeof BlockedSlotSchema>;
export type CreateBlockedSlot = z.infer<typeof CreateBlockedSlotSchema>;
export type UpdateBlockedSlot = z.infer<typeof UpdateBlockedSlotSchema>;

export type Appointment = z.infer<typeof AppointmentSchema>;
export type CreateAppointment = z.infer<typeof CreateAppointmentSchema>;
export type UpdateAppointment = z.infer<typeof UpdateAppointmentSchema>;
export type ClientBookingFormData = z.infer<typeof ClientBookingFormSchema>;

export type LoginFormData = z.infer<typeof LoginSchema>;
export type RegisterFormData = z.infer<typeof RegisterSchema>;

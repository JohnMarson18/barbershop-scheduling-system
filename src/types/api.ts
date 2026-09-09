// Padrão de resposta do backend (obrigatório conforme guia)
export type ActionResponse<T> = {
  success: boolean;
  data?: T;
  error?: string;
  fieldErrors?: Record<string, string[]>;
};

// Funções de usuário (RBAC)
export type UserRole = "admin" | "barber" | "client";

// Status do agendamento
export type AppointmentStatus = "scheduled" | "attended" | "cancelled";

// Perfil de usuário no sistema
export interface UserProfile {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  barber_id?: string | null;
  created_at?: string;
  updated_at?: string;
}

// Resposta de Autenticação
export interface AuthResponseData {
  user: {
    id: string;
    email: string;
  };
  profile: UserProfile;
}

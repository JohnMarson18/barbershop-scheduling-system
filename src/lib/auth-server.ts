import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { UserProfile, UserRole } from "@/types/api";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@barberflow.com";

// Usuários demo reconhecidos no modo local
const DEMO_PROFILES: Record<string, UserProfile> = {
  "user-admin-0001": {
    id: "user-admin-0001",
    email: ADMIN_EMAIL,
    name: "Gerente Geral (Dono)",
    role: "admin",
  },
  "user-barber-0001": {
    id: "user-barber-0001",
    email: "lucas@barberflow.com",
    name: "Lucas Silva",
    role: "barber",
    barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  },
  "user-barber-0002": {
    id: "user-barber-0002",
    email: "gabriel@barberflow.com",
    name: "Gabriel Santos",
    role: "barber",
    barber_id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
  },
  "user-client-0001": {
    id: "user-client-0001",
    email: "cliente@email.com",
    name: "Marcos Cliente",
    role: "client",
  },
};

/**
 * Extrai e valida o usuário autenticado a partir da requisição
 */
export async function getAuthenticatedUser(
  request: NextRequest
): Promise<UserProfile | null> {
  const authHeader = request.headers.get("authorization");
  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return null;
  }

  const token = authHeader.replace("Bearer ", "").trim();
  if (!token) return null;

  // 1. Modo demonstração local: aceita estritamente se isPlaceholder for true e perfil constar em DEMO_PROFILES
  if (isPlaceholder) {
    if (token.startsWith("demo-token:")) {
      const parts = token.split(":");
      if (parts.length >= 3) {
        const id = parts[2];
        const demoProfile = DEMO_PROFILES[id];
        if (demoProfile) {
          return demoProfile;
        }
      }
    }
    return null;
  }

  // 2. Modo Produção (Supabase real): tokens sintéticos "demo-token:" são sumariamente rejeitados
  if (token.startsWith("demo-token:")) {
    return null;
  }

  // 3. Validação criptográfica via Supabase Auth
  try {
    const { data: { user }, error } = await supabaseAdmin.auth.getUser(token);
    if (error || !user) {
      return null;
    }

    const { data: profile } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", user.id)
      .single();

    if (profile) {
      return profile as UserProfile;
    }

    return {
      id: user.id,
      email: user.email || "",
      name: user.user_metadata?.name || "Usuário",
      role: (user.user_metadata?.role as UserRole) || "client",
      barber_id: user.user_metadata?.barber_id || null,
    };
  } catch {
    return null;
  }
}

/**
 * Exige que a requisição venha de um usuário com um dos papéis permitidos (RBAC)
 */
export async function requireRole(
  request: NextRequest,
  allowedRoles: UserRole[]
): Promise<
  | { authorized: true; user: UserProfile }
  | { authorized: false; response: NextResponse }
> {
  const user = await getAuthenticatedUser(request);

  if (!user) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado. É necessário estar autenticado para realizar esta operação.",
        },
        { status: 401 }
      ),
    };
  }

  if (!allowedRoles.includes(user.role)) {
    return {
      authorized: false,
      response: NextResponse.json(
        {
          success: false,
          error: "Acesso proibido. Seu perfil não possui permissão para executar esta ação.",
        },
        { status: 403 }
      ),
    };
  }

  return { authorized: true, user };
}

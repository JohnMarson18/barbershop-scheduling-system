import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { LoginSchema } from "@/schemas";
import { UserProfile } from "@/types/api";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@barberflow.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || "admin123";

// Usuários padrão para autenticação no modo demonstração local
const DEMO_USERS: { email: string; password: string; profile: UserProfile }[] = [
  {
    email: ADMIN_EMAIL,
    password: ADMIN_PASSWORD,
    profile: {
      id: "user-admin-0001",
      email: ADMIN_EMAIL,
      name: "Gerente Geral (Dono)",
      role: "admin",
    },
  },
  {
    email: "lucas@barberflow.com",
    password: "barbeiro123",
    profile: {
      id: "user-barber-0001",
      email: "lucas@barberflow.com",
      name: "Lucas Silva",
      role: "barber",
      barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
  },
  {
    email: "gabriel@barberflow.com",
    password: "barbeiro123",
    profile: {
      id: "user-barber-0002",
      email: "gabriel@barberflow.com",
      name: "Gabriel Santos",
      role: "barber",
      barber_id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    },
  },
  {
    email: "cliente@email.com",
    password: "cliente123",
    profile: {
      id: "user-client-0001",
      email: "cliente@email.com",
      name: "Marcos Cliente",
      role: "client",
    },
  },
];

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();

    // Suporte para retrocompatibilidade com senha antiga direta ou novo email+senha
    let email = body.email;
    const password = body.password;

    if (!email && password) {
      email = ADMIN_EMAIL;
    }

    const validation = LoginSchema.safeParse({ email, password });
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de login inválidos.",
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    // Modo Demo / Fallback
    if (isPlaceholder) {
      const found = DEMO_USERS.find(
        (u) => u.email.toLowerCase() === validation.data.email.toLowerCase()
      );

      if (found && found.password === validation.data.password) {
        return NextResponse.json({
          success: true,
          data: {
            user: { id: found.profile.id, email: found.profile.email },
            profile: found.profile,
          },
        });
      }

      return NextResponse.json(
        { success: false, error: "Credenciais inválidas. Verifique seu email e senha." },
        { status: 401 }
      );
    }

    // Modo Supabase Real
    const { data: authData, error: authError } = await supabase.auth.signInWithPassword({
      email: validation.data.email,
      password: validation.data.password,
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: "Email ou senha incorretos." },
        { status: 401 }
      );
    }

    // Buscar perfil do usuário na tabela profiles
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .select("*")
      .eq("id", authData.user.id)
      .single();

    if (profileError || !profile) {
      // Perfil padrão se ainda não tiver na tabela
      const fallbackProfile: UserProfile = {
        id: authData.user.id,
        email: authData.user.email || "",
        name: authData.user.user_metadata?.name || "Usuário",
        role: (authData.user.user_metadata?.role as any) || "client",
      };

      return NextResponse.json({
        success: true,
        data: {
          user: { id: authData.user.id, email: authData.user.email || "" },
          profile: fallbackProfile,
        },
      });
    }

    return NextResponse.json({
      success: true,
      data: {
        user: { id: authData.user.id, email: authData.user.email || "" },
        profile,
      },
    });
  } catch (err) {
    console.error("[AUTH LOGIN ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao processar autenticação." },
      { status: 500 }
    );
  }
}

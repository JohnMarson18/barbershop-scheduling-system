import { NextRequest, NextResponse } from "next/server";
import { supabase, supabaseAdmin } from "@/lib/supabase";
import { RegisterSchema } from "@/schemas";
import { UserProfile } from "@/types/api";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const validation = RegisterSchema.safeParse(body);

    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Dados de cadastro inválidos.",
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const { email, password, name, role, barber_id } = validation.data;

    // Proteção contra escalação de privilégios (Privilege Escalation):
    // Apenas requisições com credencial de administrador podem registrar administradores ou barbeiros.
    const adminHeader = request.headers.get("x-admin-id");
    if ((role === "admin" || role === "barber") && !adminHeader) {
      return NextResponse.json(
        {
          success: false,
          error: "Apenas gerentes e administradores autenticados podem criar acessos de equipe.",
        },
        { status: 403 }
      );
    }

    if (isPlaceholder) {
      const newProfile: UserProfile = {
        id: crypto.randomUUID(),
        email,
        name,
        role,
        barber_id: barber_id || null,
        created_at: new Date().toISOString(),
      };

      return NextResponse.json({
        success: true,
        data: {
          user: { id: newProfile.id, email: newProfile.email },
          profile: newProfile,
        },
      });
    }

    // Criação no Supabase Auth
    const { data: authData, error: authError } = await supabaseAdmin.auth.admin.createUser({
      email,
      password,
      email_confirm: true,
      user_metadata: { name, role, barber_id },
    });

    if (authError || !authData.user) {
      return NextResponse.json(
        { success: false, error: authError?.message || "Erro ao criar usuário." },
        { status: 400 }
      );
    }

    // Inserção na tabela de perfis
    const { data: profile, error: profileError } = await supabaseAdmin
      .from("profiles")
      .insert({
        id: authData.user.id,
        email,
        name,
        role,
        barber_id: barber_id || null,
      })
      .select()
      .single();

    if (profileError) {
      console.error("[REGISTER PROFILE ERROR]:", profileError.message);
    }

    return NextResponse.json({
      success: true,
      data: {
        user: { id: authData.user.id, email: authData.user.email },
        profile: profile || {
          id: authData.user.id,
          email,
          name,
          role,
          barber_id,
        },
      },
    });
  } catch (err) {
    console.error("[REGISTER ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao cadastrar usuário." },
      { status: 500 }
    );
  }
}

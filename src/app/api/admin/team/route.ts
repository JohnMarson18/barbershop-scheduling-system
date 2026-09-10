import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { requireRole } from "@/lib/auth-server";
import { ActionResponse } from "@/types/api";

export const dynamic = "force-dynamic";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

export interface TeamMemberResponse {
  id: string;
  name: string;
  email: string;
  role: "admin" | "barber";
  barber_id?: string | null;
  barber_name?: string;
  created_at?: string;
}

// Memória de apoio para demonstração / testes locais
const demoTeam: TeamMemberResponse[] = [
  {
    id: "user-admin-0001",
    name: "Gerente Geral (Dono)",
    email: process.env.ADMIN_EMAIL || "admin@barberflow.com",
    role: "admin",
    barber_id: null,
    barber_name: "Acesso Geral",
  },
  {
    id: "user-barber-0001",
    name: "Lucas Silva",
    email: "lucas@barberflow.com",
    role: "barber",
    barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    barber_name: "Lucas Silva",
  },
  {
    id: "user-barber-0002",
    name: "Gabriel Santos",
    email: "gabriel@barberflow.com",
    role: "barber",
    barber_id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    barber_name: "Gabriel Santos",
  },
];

// GET /api/admin/team
// Consulta de membros da equipe (restrito a Admin)
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    if (isPlaceholder) {
      return NextResponse.json<ActionResponse<TeamMemberResponse[]>>({
        success: true,
        data: demoTeam,
      });
    }

    const { data, error } = await supabaseAdmin
      .from("profiles")
      .select(`
        id,
        name,
        email,
        role,
        barber_id,
        created_at,
        barber:barbers(id, name)
      `)
      .in("role", ["admin", "barber"])
      .order("created_at", { ascending: true });

    if (error) {
      console.error("[ADMIN TEAM ERROR]:", error.message);
      return NextResponse.json<ActionResponse<null>>(
        {
          success: false,
          error: "Erro ao consultar membros da equipe no banco de dados.",
        },
        { status: 500 }
      );
    }

    const teamMembers: TeamMemberResponse[] = (data || []).map((p: any) => ({
      id: p.id,
      name: p.name,
      email: p.email,
      role: p.role as "admin" | "barber",
      barber_id: p.barber_id,
      barber_name:
        p.barber?.name || (p.role === "admin" ? "Acesso Geral" : "Barbeiro"),
      created_at: p.created_at,
    }));

    return NextResponse.json<ActionResponse<TeamMemberResponse[]>>({
      success: true,
      data: teamMembers,
    });
  } catch (err) {
    console.error("[UNEXPECTED ADMIN TEAM ERROR]:", err);
    return NextResponse.json<ActionResponse<null>>(
      {
        success: false,
        error: "Erro interno inesperado ao carregar membros da equipe.",
      },
      { status: 500 }
    );
  }
}

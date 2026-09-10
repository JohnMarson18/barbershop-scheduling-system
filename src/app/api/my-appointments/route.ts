import { NextRequest, NextResponse } from "next/server";
import { getAuthenticatedUser } from "@/lib/auth-server";
import { listAppointmentsByUserId } from "@/services/appointment.service";

export const dynamic = "force-dynamic";

// GET /api/my-appointments
// Rota segura para área do cliente (LGPD - Isolamento estrito de dados por titular)
export async function GET(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);

    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado. Faça login para acessar seus agendamentos.",
        },
        { status: 401 }
      );
    }

    const result = await listAppointmentsByUserId(user.id);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    console.error("[MY APPOINTMENTS ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno ao carregar seus agendamentos." },
      { status: 500 }
    );
  }
}

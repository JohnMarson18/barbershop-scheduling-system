import { NextRequest, NextResponse } from "next/server";
import { listAppointments, createAppointment } from "@/services/appointment.service";
import { requireRole, getAuthenticatedUser } from "@/lib/auth-server";

export const dynamic = "force-dynamic";

// GET /api/appointments?date=YYYY-MM-DD
// Acesso restrito a Gerentes (Admin) e Barbeiros. Barbeiro só vê seus próprios atendimentos.
export async function GET(request: NextRequest) {
  try {
    const auth = await requireRole(request, ["admin", "barber"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    // Se for barbeiro, força o filtro para o seu próprio barber_id
    let barberId: string | undefined = undefined;
    if (auth.user.role === "barber") {
      barberId = auth.user.barber_id || "no-barber-linked";
    } else if (auth.user.role === "admin") {
      barberId = searchParams.get("barberId") || undefined;
    }

    const result = await listAppointments(date, barberId);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor." },
      { status: 500 }
    );
  }
}

// POST /api/appointments
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    const body = await request.json();

    const sanitizedBody = {
      ...body,
      user_id: user ? user.id : null,
    };

    const result = await createAppointment(sanitizedBody);

    if (!result.success) {
      const status = result.fieldErrors ? 400 : 409;
      return NextResponse.json(result, { status });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao processar agendamento." },
      { status: 500 }
    );
  }
}

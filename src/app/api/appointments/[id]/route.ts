import { NextRequest, NextResponse } from "next/server";
import { updateAppointmentStatus, getAppointmentById } from "@/services/appointment.service";
import { UpdateAppointmentSchema } from "@/schemas";
import { getAuthenticatedUser } from "@/lib/auth-server";

// PATCH /api/appointments/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado. É necessário estar autenticado para atualizar o status do agendamento.",
        },
        { status: 401 }
      );
    }

    const { id } = params;
    if (!id) {
      return NextResponse.json(
        { success: false, error: "ID do agendamento é obrigatório." },
        { status: 400 }
      );
    }

    const body = await request.json();
    const validation = UpdateAppointmentSchema.safeParse(body);
    if (!validation.success) {
      return NextResponse.json(
        {
          success: false,
          error: "Status inválido. Deve ser 'attended' ou 'cancelled'.",
          fieldErrors: validation.error.flatten().fieldErrors,
        },
        { status: 400 }
      );
    }

    const newStatus = validation.data.status as "attended" | "cancelled";

    // Valida a existência prévia do agendamento
    const aptResult = await getAppointmentById(id);
    if (!aptResult.success || !aptResult.data) {
      return NextResponse.json(
        { success: false, error: "Agendamento não encontrado." },
        { status: 404 }
      );
    }

    const appointment = aptResult.data;

    // Matriz de autorização horizontal (BOLA)
    if (user.role === "client") {
      if (newStatus !== "cancelled") {
        return NextResponse.json(
          { success: false, error: "Clientes só têm permissão para cancelar agendamentos." },
          { status: 403 }
        );
      }

      if (!appointment.user_id || appointment.user_id !== user.id) {
        return NextResponse.json(
          { success: false, error: "Você só pode cancelar seus próprios agendamentos." },
          { status: 403 }
        );
      }
    } else if (user.role === "barber") {
      if (appointment.barber_id !== user.barber_id) {
        return NextResponse.json(
          { success: false, error: "Barbeiros só podem gerenciar agendamentos da sua própria agenda." },
          { status: 403 }
        );
      }
    }

    const result = await updateAppointmentStatus(id, newStatus);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao atualizar agendamento." },
      { status: 500 }
    );
  }
}

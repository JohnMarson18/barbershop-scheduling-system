import { NextRequest, NextResponse } from "next/server";
import { updateAppointmentStatus } from "@/services/appointment.service";
import { UpdateAppointmentSchema } from "@/schemas";

// PATCH /api/appointments/[id]
export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
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

    const result = await updateAppointmentStatus(id, validation.data.status as "attended" | "cancelled");
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

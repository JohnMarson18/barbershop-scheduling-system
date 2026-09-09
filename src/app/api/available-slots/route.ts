import { NextRequest, NextResponse } from "next/server";
import { getAvailableSlots } from "@/services/appointment.service";

// GET /api/available-slots?barberId=...&date=...&serviceId=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get("barberId");
    const date = searchParams.get("date");
    const serviceId = searchParams.get("serviceId");

    if (!barberId || !date || !serviceId) {
      return NextResponse.json(
        {
          success: false,
          error: "Parâmetros obrigatórios ausentes (barberId, date, serviceId).",
        },
        { status: 400 }
      );
    }

    const result = await getAvailableSlots(barberId, date, serviceId);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao calcular horários disponíveis." },
      { status: 500 }
    );
  }
}

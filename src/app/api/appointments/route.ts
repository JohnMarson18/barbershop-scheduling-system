import { NextRequest, NextResponse } from "next/server";
import { listAppointments, createAppointment } from "@/services/appointment.service";

// GET /api/appointments?date=YYYY-MM-DD
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const date = searchParams.get("date") || undefined;

    const result = await listAppointments(date);
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
    const body = await request.json();
    const result = await createAppointment(body);

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

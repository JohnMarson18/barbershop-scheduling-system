import { NextRequest, NextResponse } from "next/server";
import { listBlockedSlots, createBlockedSlot } from "@/services/blocked-slot.service";

// GET /api/blocked-slots?barberId=...&date=...
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const barberId = searchParams.get("barberId") || undefined;
    const date = searchParams.get("date") || undefined;

    const result = await listBlockedSlots(barberId, date);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro ao carregar bloqueios de horário." },
      { status: 500 }
    );
  }
}

// POST /api/blocked-slots
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createBlockedSlot(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao cadastrar bloqueio." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { listBarbers, createBarber } from "@/services/barber.service";

// GET /api/barbers?all=true
export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const includeInactive = searchParams.get("all") === "true";

    const result = await listBarbers(includeInactive);
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro ao carregar barbeiros." },
      { status: 500 }
    );
  }
}

// POST /api/barbers
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const result = await createBarber(body);

    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 201 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao cadastrar barbeiro." },
      { status: 500 }
    );
  }
}

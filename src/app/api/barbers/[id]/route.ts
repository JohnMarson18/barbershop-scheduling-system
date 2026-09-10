import { NextRequest, NextResponse } from "next/server";
import { updateBarber, deleteBarber } from "@/services/barber.service";
import { requireRole } from "@/lib/auth-server";

// PUT /api/barbers/[id]
export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = params;
    const body = await request.json();

    const result = await updateBarber(id, body);
    if (!result.success) {
      return NextResponse.json(result, { status: 400 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao atualizar barbeiro." },
      { status: 500 }
    );
  }
}

// DELETE /api/barbers/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ["admin"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = params;
    const result = await deleteBarber(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao desativar barbeiro." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { deleteBlockedSlot } from "@/services/blocked-slot.service";

// DELETE /api/blocked-slots/[id]
export async function DELETE(
  _request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    const result = await deleteBlockedSlot(id);

    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    return NextResponse.json(result, { status: 200 });
  } catch (err) {
    return NextResponse.json(
      { success: false, error: "Erro interno ao remover bloqueio." },
      { status: 500 }
    );
  }
}

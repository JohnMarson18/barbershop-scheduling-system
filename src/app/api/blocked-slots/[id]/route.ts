import { NextRequest, NextResponse } from "next/server";
import { deleteBlockedSlot, getBlockedSlotById } from "@/services/blocked-slot.service";
import { requireRole } from "@/lib/auth-server";

// DELETE /api/blocked-slots/[id]
export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const auth = await requireRole(request, ["admin", "barber"]);
    if (!auth.authorized) {
      return auth.response;
    }

    const { id } = params;

    // Se for barbeiro, valida a propriedade do bloqueio
    if (auth.user.role === "barber") {
      const slotResult = await getBlockedSlotById(id);
      if (!slotResult.success || !slotResult.data) {
        return NextResponse.json(
          { success: false, error: "Bloqueio não encontrado." },
          { status: 404 }
        );
      }

      if (slotResult.data.barber_id !== auth.user.barber_id) {
        return NextResponse.json(
          {
            success: false,
            error: "Você não tem permissão para excluir bloqueios de outros barbeiros.",
          },
          { status: 403 }
        );
      }
    }

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

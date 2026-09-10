import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { anonymizeClientAppointments, getAppointmentById } from "@/services/appointment.service";
import { getAuthenticatedUser } from "@/lib/auth-server";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

// POST /api/lgpd/anonymize
export async function POST(request: NextRequest) {
  try {
    const user = await getAuthenticatedUser(request);
    if (!user) {
      return NextResponse.json(
        {
          success: false,
          error: "Acesso não autorizado. É necessário estar autenticado para exercer direitos sob a LGPD.",
        },
        { status: 401 }
      );
    }

    const body = await request.json().catch(() => ({}));
    let { appointmentId, whatsapp, userId } = body;

    // Se for cliente, restringe estritamente para o seu próprio ID
    if (user.role === "client") {
      userId = user.id;
      whatsapp = undefined;

      if (appointmentId) {
        const aptResult = await getAppointmentById(appointmentId);
        if (!aptResult.success || !aptResult.data) {
          return NextResponse.json(
            {
              success: false,
              error: "Agendamento não encontrado.",
            },
            { status: 404 }
          );
        }

        if (aptResult.data.user_id !== user.id) {
          return NextResponse.json(
            {
              success: false,
              error: "Você não possui permissão para anonimizar agendamentos de outros clientes.",
            },
            { status: 403 }
          );
        }
      }
    } else if (user.role === "barber") {
      return NextResponse.json(
        {
          success: false,
          error: "Barbeiros não possuem permissão para executar solicitações de exclusão LGPD.",
        },
        { status: 403 }
      );
    }

    if (!appointmentId && !whatsapp && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Identificador para anonimização não fornecido.",
        },
        { status: 400 }
      );
    }

    // Executa a anonimização dos agendamentos
    const result = await anonymizeClientAppointments({ userId, whatsapp, appointmentId });
    if (!result.success) {
      return NextResponse.json(result, { status: 500 });
    }

    // Se houver userId e estiver conectado ao Supabase, anonimiza também o cadastro do perfil
    if (userId && !isPlaceholder) {
      try {
        await supabaseAdmin
          .from("profiles")
          .update({
            name: "Cliente Anonimizado (LGPD)",
            email: `anonimizado-${userId}@lgpd.invalid`,
          })
          .eq("id", userId);
      } catch (profileErr) {
        console.warn("[LGPD WARNING]: Falha ao anonimizar perfil:", profileErr);
      }
    }

    return NextResponse.json({
      success: true,
      message: "Seus dados pessoais foram anonimizados com sucesso em conformidade com o Art. 18 da LGPD (Direito ao Esquecimento).",
      data: result.data,
    });
  } catch (err) {
    console.error("[LGPD ERROR]:", err);
    return NextResponse.json(
      { success: false, error: "Erro interno no servidor ao processar solicitação da LGPD." },
      { status: 500 }
    );
  }
}

import { NextRequest, NextResponse } from "next/server";
import { supabaseAdmin } from "@/lib/supabase";
import { anonymizeClientAppointments } from "@/services/appointment.service";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

// POST /api/lgpd/anonymize
export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { appointmentId, whatsapp, userId } = body;

    if (!appointmentId && !whatsapp && !userId) {
      return NextResponse.json(
        {
          success: false,
          error: "Identificador não fornecido (userId, appointmentId ou whatsapp são necessários).",
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

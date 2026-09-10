import { supabase, supabaseAdmin } from "@/lib/supabase";
import { CreateAppointmentSchema, Appointment } from "@/schemas";
import { ActionResponse } from "@/types/api";
import { getDemoServices } from "./service.service";
import { getDemoBarbers } from "./barber.service";
import { getDemoBlockedSlots } from "./blocked-slot.service";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

function getTodayDateString(): string {
  const now = new Date();
  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");
  return `${year}-${month}-${day}`;
}

// Armazenamento em memória para demonstração local
function initDemoAppointments(): any[] {
  const today = getTodayDateString();
  return [
    {
      id: "demo-apt-0001",
      user_id: "user-client-0001",
      service_id: "11111111-1111-1111-1111-111111111111",
      barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      client_name: "Marcos Cliente",
      client_whatsapp: "(11) 98765-4321",
      appointment_date: today,
      appointment_time: "10:00",
      status: "scheduled",
      lgpd_consent: true,
      service: {
        id: "11111111-1111-1111-1111-111111111111",
        name: "Corte Tradicional",
        duration_minutes: 30,
        price: 45.0,
      },
      barber: {
        id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "Lucas Silva",
      },
      created_at: new Date().toISOString(),
    },
    {
      id: "demo-apt-0002",
      user_id: null,
      service_id: "22222222-2222-2222-2222-222222222222",
      barber_id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      client_name: "João Silva",
      client_whatsapp: "(11) 91234-5678",
      appointment_date: today,
      appointment_time: "14:00",
      status: "scheduled",
      lgpd_consent: true,
      service: {
        id: "22222222-2222-2222-2222-222222222222",
        name: "Barba Terapia",
        duration_minutes: 30,
        price: 35.0,
      },
      barber: {
        id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
        name: "Gabriel Santos",
      },
      created_at: new Date().toISOString(),
    },
  ];
}

let demoAppointments: any[] = initDemoAppointments();

// Horário de funcionamento da barbearia:
// 0: Domingo (fechado)
// 1 a 5: Seg-Sex (09:00 às 19:00)
// 6: Sábado (09:00 às 13:00)
const BUSINESS_HOURS = {
  0: null,
  1: { start: "09:00", end: "19:00" },
  2: { start: "09:00", end: "19:00" },
  3: { start: "09:00", end: "19:00" },
  4: { start: "09:00", end: "19:00" },
  5: { start: "09:00", end: "19:00" },
  6: { start: "09:00", end: "13:00" },
};

function parseDateLocal(dateStr: string): Date {
  const [year, month, day] = dateStr.split("-").map(Number);
  return new Date(year, month - 1, day);
}

export function isWithinBusinessHours(
  time: string,
  dayOfWeek: number,
  durationMinutes = 30
): boolean {
  const hours = BUSINESS_HOURS[dayOfWeek as keyof typeof BUSINESS_HOURS];
  if (!hours) return false;

  const [hoursTime, minutesTime] = time.split(":").map(Number);
  const [hoursStart, minutesStart] = hours.start.split(":").map(Number);
  const [hoursEnd, minutesEnd] = hours.end.split(":").map(Number);

  const timeInMinutes = hoursTime * 60 + minutesTime;
  const startInMinutes = hoursStart * 60 + minutesStart;
  const endInMinutes = hoursEnd * 60 + minutesEnd;

  return timeInMinutes >= startInMinutes && (timeInMinutes + durationMinutes) <= endInMinutes;
}

export function hasTimeConflict(
  appointmentTime: string,
  durationMinutes: number,
  existingAppointments: { appointment_time: string; duration_minutes: number }[],
  blockedSlots: { start_time: string; end_time: string }[]
): boolean {
  const [aptHours, aptMinutes] = appointmentTime.split(":").map(Number);
  const aptStartInMinutes = aptHours * 60 + aptMinutes;
  const aptEndInMinutes = aptStartInMinutes + durationMinutes;

  for (const apt of existingAppointments) {
    const [existingHours, existingMinutes] = apt.appointment_time.split(":").map(Number);
    const existingStartInMinutes = existingHours * 60 + existingMinutes;
    const existingEndInMinutes = existingStartInMinutes + apt.duration_minutes;

    if (
      (aptStartInMinutes >= existingStartInMinutes && aptStartInMinutes < existingEndInMinutes) ||
      (aptEndInMinutes > existingStartInMinutes && aptEndInMinutes <= existingEndInMinutes) ||
      (aptStartInMinutes <= existingStartInMinutes && aptEndInMinutes >= existingEndInMinutes)
    ) {
      return true;
    }
  }

  for (const block of blockedSlots) {
    const [blockStartHours, blockStartMinutes] = block.start_time.split(":").map(Number);
    const [blockEndHours, blockEndMinutes] = block.end_time.split(":").map(Number);
    const blockStartInMinutes = blockStartHours * 60 + blockStartMinutes;
    const blockEndInMinutes = blockEndHours * 60 + blockEndMinutes;

    if (
      (aptStartInMinutes >= blockStartInMinutes && aptStartInMinutes < blockEndInMinutes) ||
      (aptEndInMinutes > blockStartInMinutes && aptEndInMinutes <= blockEndInMinutes) ||
      (aptStartInMinutes <= blockStartInMinutes && aptEndInMinutes >= blockEndInMinutes)
    ) {
      return true;
    }
  }

  return false;
}

export async function listAppointments(
  date?: string,
  barberId?: string
): Promise<ActionResponse<Appointment[]>> {
  if (isPlaceholder) {
    let list = [...demoAppointments];
    if (date) {
      list = list.filter((apt) => apt.appointment_date === date);
    }
    if (barberId) {
      list = list.filter((apt) => apt.barber_id === barberId);
    }
    return { success: true, data: list };
  }

  try {
    let query = supabaseAdmin
      .from("appointments")
      .select(`
        *,
        service:services(id, name, duration_minutes, price),
        barber:barbers(id, name)
      `)
      .order("appointment_time", { ascending: true });

    if (date) {
      query = query.eq("appointment_date", date);
    }
    if (barberId) {
      query = query.eq("barber_id", barberId);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[SERVICE WARNING - listAppointments]: Falha ao consultar agendamentos.", error.message);
      return { success: false, error: "Erro ao carregar agendamentos do banco." };
    }

    return { success: true, data: (data || []) as Appointment[] };
  } catch (err) {
    return { success: false, error: "Erro interno no servidor." };
  }
}

export async function listAppointmentsByUserId(
  userId: string
): Promise<ActionResponse<Appointment[]>> {
  if (isPlaceholder) {
    const list = demoAppointments.filter((apt) => apt.user_id === userId);
    return { success: true, data: list };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        service:services(id, name, duration_minutes, price),
        barber:barbers(id, name)
      `)
      .eq("user_id", userId)
      .order("appointment_date", { ascending: false })
      .order("appointment_time", { ascending: false });

    if (error) {
      console.error("[SERVICE ERROR - listAppointmentsByUserId]:", error.message);
      return { success: false, error: "Erro ao buscar agendamentos do cliente." };
    }

    return { success: true, data: (data || []) as Appointment[] };
  } catch (err) {
    return { success: false, error: "Erro interno ao consultar agendamentos." };
  }
}

export async function getAvailableSlots(
  barberId: string,
  date: string,
  serviceId: string
): Promise<ActionResponse<string[]>> {
  try {
    let durationMinutes = 30;

    if (isPlaceholder) {
      const s = getDemoServices().find((item) => item.id === serviceId);
      if (s) durationMinutes = s.duration_minutes;
    } else {
      const { data: service, error: serviceError } = await supabase
        .from("services")
        .select("duration_minutes")
        .eq("id", serviceId)
        .single();

      if (serviceError || !service) {
        console.error("[SERVICE ERROR - getAvailableSlots]: Falha ao buscar serviço no banco.", serviceError?.message);
        return { success: false, error: "Serviço não encontrado no banco de dados." };
      }

      durationMinutes = service.duration_minutes;
    }

    const appointmentDate = parseDateLocal(date);
    const dayOfWeek = appointmentDate.getDay();
    const businessHours = BUSINESS_HOURS[dayOfWeek as keyof typeof BUSINESS_HOURS];

    if (!businessHours) {
      return { success: true, data: [] };
    }

    let activeAppointments: { appointment_time: string; duration_minutes: number }[] = [];
    let activeBlocks: { start_time: string; end_time: string }[] = [];

    if (isPlaceholder) {
      activeAppointments = demoAppointments
        .filter(
          (apt) =>
            apt.barber_id === barberId &&
            apt.appointment_date === date &&
            apt.status === "scheduled"
        )
        .map((apt) => ({
          appointment_time: apt.appointment_time,
          duration_minutes: apt.service?.duration_minutes || 30,
        }));

      activeBlocks = getDemoBlockedSlots()
        .filter((b) => b.barber_id === barberId && b.block_date === date)
        .map((b) => ({ start_time: b.start_time, end_time: b.end_time }));
    } else {
      const { data: appointments } = await supabase
        .from("appointments")
        .select("appointment_time, service:services(duration_minutes)")
        .eq("barber_id", barberId)
        .eq("appointment_date", date)
        .eq("status", "scheduled");

      activeAppointments = (appointments || []).map((apt: any) => ({
        appointment_time: apt.appointment_time,
        duration_minutes: apt.service?.duration_minutes || 30,
      }));

      const { data: blockedSlots } = await supabase
        .from("blocked_slots")
        .select("start_time, end_time")
        .eq("barber_id", barberId)
        .eq("block_date", date);

      activeBlocks = (blockedSlots || []).map((b: any) => ({
        start_time: b.start_time,
        end_time: b.end_time,
      }));
    }

    const [startHours, startMinutes] = businessHours.start.split(":").map(Number);
    const [endHours, endMinutes] = businessHours.end.split(":").map(Number);

    const startInMinutes = startHours * 60 + startMinutes;
    const endInMinutes = endHours * 60 + endMinutes;
    const availableSlots: string[] = [];

    const todayStr = getTodayDateString();
    const isToday = date === todayStr;
    const now = new Date();
    const currentTimeInMinutes = now.getHours() * 60 + now.getMinutes();

    for (let time = startInMinutes; time + durationMinutes <= endInMinutes; time += 30) {
      if (isToday && time <= currentTimeInMinutes) {
        continue;
      }

      const hours = Math.floor(time / 60);
      const minutes = time % 60;
      const timeString = `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;

      const hasConflict = hasTimeConflict(
        timeString,
        durationMinutes,
        activeAppointments,
        activeBlocks
      );

      if (!hasConflict) {
        availableSlots.push(timeString);
      }
    }

    return { success: true, data: availableSlots };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - getAvailableSlots]:", err);
    return { success: false, error: "Erro interno inesperado ao calcular horários." };
  }
}

export async function createAppointment(
  input: unknown
): Promise<ActionResponse<Appointment>> {
  const validation = CreateAppointmentSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados do agendamento inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  const { barber_id, appointment_date, appointment_time, service_id } = validation.data;

  try {
    const todayStr = getTodayDateString();
    if (appointment_date < todayStr) {
      return { success: false, error: "Não é possível agendar para datas passadas." };
    }

    if (appointment_date === todayStr) {
      const now = new Date();
      const [aptH, aptM] = appointment_time.split(":").map(Number);
      const aptTotal = aptH * 60 + aptM;
      const currentTotal = now.getHours() * 60 + now.getMinutes();
      if (aptTotal <= currentTotal) {
        return { success: false, error: "Este horário já passou para o dia de hoje." };
      }
    }

    let serviceDuration = 30;
    if (isPlaceholder) {
      const s = getDemoServices().find((item) => item.id === service_id);
      if (s) serviceDuration = s.duration_minutes;
    } else {
      const { data: s, error: sError } = await supabase.from("services").select("duration_minutes").eq("id", service_id).single();
      if (sError || !s) {
        return { success: false, error: "Serviço solicitado não foi encontrado no banco de dados." };
      }
      serviceDuration = s.duration_minutes;
    }

    const appointmentDate = parseDateLocal(appointment_date);
    const dayOfWeek = appointmentDate.getDay();
    if (!isWithinBusinessHours(appointment_time, dayOfWeek, serviceDuration)) {
      return { success: false, error: "O horário ou duração do serviço excede o expediente da barbearia." };
    }

    if (isPlaceholder) {
      const service = getDemoServices().find((s) => s.id === service_id);
      const barber = getDemoBarbers().find((b) => b.id === barber_id);

      const activeAppointments = demoAppointments
        .filter(
          (apt) =>
            apt.barber_id === barber_id &&
            apt.appointment_date === appointment_date &&
            apt.status === "scheduled"
        )
        .map((apt) => ({
          appointment_time: apt.appointment_time,
          duration_minutes: apt.service?.duration_minutes || 30,
        }));

      const activeBlocks = getDemoBlockedSlots()
        .filter((b) => b.barber_id === barber_id && b.block_date === appointment_date)
        .map((b) => ({ start_time: b.start_time, end_time: b.end_time }));

      const conflict = hasTimeConflict(
        appointment_time,
        serviceDuration,
        activeAppointments,
        activeBlocks
      );

      if (conflict) {
        return {
          success: false,
          error: "Este horário colide com um agendamento existente ou intervalo/almoço.",
        };
      }

      const newAppointment: Appointment = {
        id: crypto.randomUUID(),
        ...validation.data,
        status: "scheduled",
        service: service ? { id: service.id, name: service.name, duration_minutes: service.duration_minutes, price: service.price } : undefined,
        barber: barber ? { id: barber.id, name: barber.name } : undefined,
      } as any;

      demoAppointments.push(newAppointment);
      return { success: true, data: newAppointment };
    }

    // Fluxo com Supabase real:
    // 1. Tenta a criação atômica protegida por pg_advisory_xact_lock via Stored Procedure
    try {
      const { data: rpcResult, error: rpcError } = await supabaseAdmin.rpc(
        "check_and_create_appointment",
        {
          p_service_id: service_id,
          p_barber_id: barber_id,
          p_client_name: validation.data.client_name,
          p_client_whatsapp: validation.data.client_whatsapp,
          p_appointment_date: appointment_date,
          p_appointment_time: appointment_time,
          p_user_id: validation.data.user_id || null,
          p_lgpd_consent: validation.data.lgpd_consent ?? true,
        }
      );

      if (!rpcError && rpcResult) {
        if (!rpcResult.success) {
          return { success: false, error: rpcResult.error || "Horário indisponível para agendamento." };
        }

        const createdApt = rpcResult.data;
        const { data: fullData } = await supabaseAdmin
          .from("appointments")
          .select(`
            *,
            service:services(id, name, duration_minutes, price),
            barber:barbers(id, name)
          `)
          .eq("id", createdApt.id)
          .single();

        return { success: true, data: (fullData || createdApt) as Appointment };
      }
    } catch {
      // Caso a RPC não esteja instalada no banco, prossegue para o fallback direto
    }

    // 2. Fallback direto caso a procedure não esteja disponível no banco
    const { data: service } = await supabase
      .from("services")
      .select("duration_minutes")
      .eq("id", service_id)
      .single();

    const duration = service?.duration_minutes || 30;

    const { data: existingAppointments } = await supabase
      .from("appointments")
      .select("appointment_time, service:services(duration_minutes)")
      .eq("barber_id", barber_id)
      .eq("appointment_date", appointment_date)
      .eq("status", "scheduled");

    const { data: blockedSlots } = await supabase
      .from("blocked_slots")
      .select("start_time, end_time")
      .eq("barber_id", barber_id)
      .eq("block_date", appointment_date);

    const hasConflict = hasTimeConflict(
      appointment_time,
      duration,
      (existingAppointments || []).map((apt: any) => ({
        appointment_time: apt.appointment_time,
        duration_minutes: apt.service?.duration_minutes || 30,
      })),
      blockedSlots || []
    );

    if (hasConflict) {
      return { success: false, error: "Este horário acabou de ser ocupado. Por favor, escolha outro horário." };
    }

    const { data, error } = await supabaseAdmin
      .from("appointments")
      .insert({
        ...validation.data,
        status: "scheduled",
      })
      .select(`
        *,
        service:services(id, name, duration_minutes, price),
        barber:barbers(id, name)
      `)
      .single();

    if (error) {
      return { success: false, error: "Erro ao confirmar agendamento no banco. Tente novamente." };
    }

    return { success: true, data: data as Appointment };
  } catch (err) {
    return { success: false, error: "Erro interno inesperado ao salvar agendamento." };
  }
}

export async function updateAppointmentStatus(
  id: string,
  status: "attended" | "cancelled"
): Promise<ActionResponse<Appointment>> {
  if (isPlaceholder) {
    const index = demoAppointments.findIndex((apt) => apt.id === id);
    if (index === -1) {
      return { success: false, error: "Agendamento não encontrado." };
    }
    demoAppointments[index].status = status;
    return { success: true, data: demoAppointments[index] };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .update({ status })
      .eq("id", id)
      .select(`
        *,
        service:services(id, name, duration_minutes, price),
        barber:barbers(id, name)
      `)
      .single();

    if (error) {
      return { success: false, error: "Erro ao atualizar status do agendamento." };
    }

    return { success: true, data: data as Appointment };
  } catch (err) {
    return { success: false, error: "Erro interno inesperado ao alterar status." };
  }
}

export async function anonymizeClientAppointments(criteria: {
  userId?: string;
  whatsapp?: string;
  appointmentId?: string;
}): Promise<ActionResponse<{ anonymizedCount: number }>> {
  const { userId, whatsapp, appointmentId } = criteria;
  if (!userId && !whatsapp && !appointmentId) {
    return { success: false, error: "Identificador para anonimização não fornecido." };
  }

  if (isPlaceholder) {
    let count = 0;
    demoAppointments = demoAppointments.map((apt) => {
      let matches = false;

      if (appointmentId && userId) {
        matches = apt.id === appointmentId && apt.user_id === userId;
      } else if (appointmentId) {
        matches = apt.id === appointmentId;
      } else if (userId) {
        matches = apt.user_id === userId;
      } else if (whatsapp) {
        matches = apt.client_whatsapp === whatsapp;
      }

      if (matches) {
        count++;
        return {
          ...apt,
          client_name: "Cliente Anonimizado (LGPD)",
          client_whatsapp: "(00) 00000-0000",
          is_anonymized: true,
          user_id: null,
          updated_at: new Date().toISOString(),
        };
      }
      return apt;
    });

    return { success: true, data: { anonymizedCount: count } };
  }

  try {
    let query = supabaseAdmin
      .from("appointments")
      .update({
        client_name: "Cliente Anonimizado (LGPD)",
        client_whatsapp: "(00) 00000-0000",
        is_anonymized: true,
        user_id: null,
        updated_at: new Date().toISOString(),
      });

    if (appointmentId && userId) {
      query = query.eq("id", appointmentId).eq("user_id", userId);
    } else if (appointmentId) {
      query = query.eq("id", appointmentId);
    } else if (userId) {
      query = query.eq("user_id", userId);
    } else if (whatsapp) {
      query = query.eq("client_whatsapp", whatsapp);
    }

    const { error, count } = await query;
    if (error) {
      return { success: false, error: "Erro ao anonimizar dados no banco." };
    }

    return { success: true, data: { anonymizedCount: count || 1 } };
  } catch (err) {
    return { success: false, error: "Erro interno ao processar anonimização." };
  }
}

export async function getAppointmentById(
  id: string
): Promise<ActionResponse<Appointment | null>> {
  if (isPlaceholder) {
    const found = demoAppointments.find((apt) => apt.id === id);
    return { success: true, data: (found as Appointment) || null };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("appointments")
      .select(`
        *,
        service:services(*),
        barber:barbers(*)
      `)
      .eq("id", id)
      .maybeSingle();

    if (error) {
      console.error("[SERVICE ERROR - getAppointmentById]:", error.message);
      return { success: false, error: "Erro ao buscar agendamento no banco." };
    }

    return { success: true, data: (data as Appointment) || null };
  } catch (err) {
    console.error("[SERVICE UNEXPECTED ERROR - getAppointmentById]:", err);
    return { success: false, error: "Erro interno ao consultar agendamento." };
  }
}



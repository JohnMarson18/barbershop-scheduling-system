import { supabaseAdmin } from "@/lib/supabase";
import { CreateBlockedSlotSchema, UpdateBlockedSlotSchema, BlockedSlot } from "@/schemas";
import { ActionResponse } from "@/types/api";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

const todayDateStr = new Date().toISOString().split("T")[0];

let demoBlockedSlots: (BlockedSlot & { barber?: { id: string; name: string } })[] = [
  {
    id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb",
    barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    block_date: todayDateStr,
    start_time: "12:00",
    end_time: "13:00",
    reason: "Horário de Almoço",
    barber: { id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa", name: "Lucas Silva" },
  },
];

export async function listBlockedSlots(
  barberId?: string,
  date?: string
): Promise<ActionResponse<BlockedSlot[]>> {
  if (isPlaceholder) {
    let list = [...demoBlockedSlots];
    if (barberId) list = list.filter((b) => b.barber_id === barberId);
    if (date) list = list.filter((b) => b.block_date === date);
    return { success: true, data: list };
  }

  try {
    let query = supabaseAdmin
      .from("blocked_slots")
      .select(`
        *,
        barber:barbers(id, name)
      `);

    if (barberId) query = query.eq("barber_id", barberId);
    if (date) query = query.eq("block_date", date);

    const { data, error } = await query.order("block_date", { ascending: true });

    if (error) {
      console.warn("[SERVICE WARNING - listBlockedSlots]: Usando bloqueios demo.", error.message);
      let list = [...demoBlockedSlots];
      if (barberId) list = list.filter((b) => b.barber_id === barberId);
      if (date) list = list.filter((b) => b.block_date === date);
      return { success: true, data: list };
    }

    return { success: true, data: (data || []) as BlockedSlot[] };
  } catch (err) {
    let list = [...demoBlockedSlots];
    if (barberId) list = list.filter((b) => b.barber_id === barberId);
    if (date) list = list.filter((b) => b.block_date === date);
    return { success: true, data: list };
  }
}

export async function createBlockedSlot(
  input: unknown
): Promise<ActionResponse<BlockedSlot>> {
  const validation = CreateBlockedSlotSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados do bloqueio inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  if (isPlaceholder) {
    const newSlot: BlockedSlot = {
      id: crypto.randomUUID(),
      ...validation.data,
    };
    demoBlockedSlots.push(newSlot);
    return { success: true, data: newSlot };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("blocked_slots")
      .insert(validation.data)
      .select(`
        *,
        barber:barbers(id, name)
      `)
      .single();

    if (error) {
      console.error("[SERVICE ERROR - createBlockedSlot]:", error.message);
      return { success: false, error: "Erro ao cadastrar bloqueio de horário no banco." };
    }

    return { success: true, data: data as BlockedSlot };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - createBlockedSlot]:", err);
    return { success: false, error: "Erro interno inesperado ao salvar bloqueio." };
  }
}

export async function updateBlockedSlot(
  id: string,
  input: unknown
): Promise<ActionResponse<BlockedSlot>> {
  const validation = UpdateBlockedSlotSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados de atualização inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  if (isPlaceholder) {
    const index = demoBlockedSlots.findIndex((b) => b.id === id);
    if (index === -1) {
      return { success: false, error: "Bloqueio não encontrado." };
    }
    demoBlockedSlots[index] = { ...demoBlockedSlots[index], ...validation.data };
    return { success: true, data: demoBlockedSlots[index] };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("blocked_slots")
      .update(validation.data)
      .eq("id", id)
      .select(`
        *,
        barber:barbers(id, name)
      `)
      .single();

    if (error) {
      console.error("[SERVICE ERROR - updateBlockedSlot]:", error.message);
      return { success: false, error: "Erro ao atualizar bloqueio de horário." };
    }

    return { success: true, data: data as BlockedSlot };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - updateBlockedSlot]:", err);
    return { success: false, error: "Erro interno inesperado ao atualizar bloqueio." };
  }
}

export async function deleteBlockedSlot(id: string): Promise<ActionResponse<null>> {
  if (isPlaceholder) {
    demoBlockedSlots = demoBlockedSlots.filter((b) => b.id !== id);
    return { success: true, data: null };
  }

  try {
    const { error } = await supabaseAdmin
      .from("blocked_slots")
      .delete()
      .eq("id", id);

    if (error) {
      console.error("[SERVICE ERROR - deleteBlockedSlot]:", error.message);
      return { success: false, error: "Erro ao remover bloqueio de horário." };
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - deleteBlockedSlot]:", err);
    return { success: false, error: "Erro interno inesperado ao excluir bloqueio." };
  }
}

export function getDemoBlockedSlots(): BlockedSlot[] {
  return demoBlockedSlots;
}

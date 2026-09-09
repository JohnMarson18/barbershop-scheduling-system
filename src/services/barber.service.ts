import { supabaseAdmin } from "@/lib/supabase";
import { CreateBarberSchema, UpdateBarberSchema, Barber } from "@/schemas";
import { ActionResponse } from "@/types/api";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

let demoBarbers: Barber[] = [
  {
    id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Lucas Silva",
    is_active: true,
  },
  {
    id: "aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Gabriel Santos",
    is_active: true,
  },
  {
    id: "aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
    name: "Mateus Oliveira",
    is_active: true,
  },
];

export async function listBarbers(includeInactive = false): Promise<ActionResponse<Barber[]>> {
  if (isPlaceholder) {
    const list = includeInactive ? demoBarbers : demoBarbers.filter((b) => b.is_active);
    return { success: true, data: list };
  }

  try {
    let query = supabaseAdmin
      .from("barbers")
      .select("*")
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      console.warn("[SERVICE WARNING - listBarbers]: Usando barbeiros demo.", error.message);
      const list = includeInactive ? demoBarbers : demoBarbers.filter((b) => b.is_active);
      return { success: true, data: list };
    }

    return { success: true, data: (data || []) as Barber[] };
  } catch (err) {
    const list = includeInactive ? demoBarbers : demoBarbers.filter((b) => b.is_active);
    return { success: true, data: list };
  }
}

export async function createBarber(
  input: unknown
): Promise<ActionResponse<Barber>> {
  const validation = CreateBarberSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados do barbeiro inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  if (isPlaceholder) {
    const newBarber: Barber = {
      id: crypto.randomUUID(),
      ...validation.data,
      is_active: validation.data.is_active ?? true,
    };
    demoBarbers.push(newBarber);
    return { success: true, data: newBarber };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("barbers")
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      console.error("[SERVICE ERROR - createBarber]:", error.message);
      return { success: false, error: "Erro ao cadastrar barbeiro no banco de dados." };
    }

    return { success: true, data: data as Barber };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - createBarber]:", err);
    return { success: false, error: "Erro interno inesperado ao cadastrar barbeiro." };
  }
}

export async function updateBarber(
  id: string,
  input: unknown
): Promise<ActionResponse<Barber>> {
  const validation = UpdateBarberSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados de atualização inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  if (isPlaceholder) {
    const index = demoBarbers.findIndex((b) => b.id === id);
    if (index === -1) {
      return { success: false, error: "Barbeiro não encontrado." };
    }
    demoBarbers[index] = { ...demoBarbers[index], ...validation.data };
    return { success: true, data: demoBarbers[index] };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("barbers")
      .update(validation.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SERVICE ERROR - updateBarber]:", error.message);
      return { success: false, error: "Erro ao atualizar dados do barbeiro." };
    }

    return { success: true, data: data as Barber };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - updateBarber]:", err);
    return { success: false, error: "Erro interno inesperado ao atualizar barbeiro." };
  }
}

export async function deleteBarber(id: string): Promise<ActionResponse<null>> {
  if (isPlaceholder) {
    demoBarbers = demoBarbers.map((b) => (b.id === id ? { ...b, is_active: false } : b));
    return { success: true, data: null };
  }

  try {
    const { error } = await supabaseAdmin
      .from("barbers")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("[SERVICE ERROR - deleteBarber]:", error.message);
      return { success: false, error: "Erro ao desativar barbeiro." };
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - deleteBarber]:", err);
    return { success: false, error: "Erro interno inesperado ao desativar barbeiro." };
  }
}

export function getDemoBarbers(): Barber[] {
  return demoBarbers;
}

import { supabaseAdmin } from "@/lib/supabase";
import { CreateServiceSchema, UpdateServiceSchema, Service } from "@/schemas";
import { ActionResponse } from "@/types/api";

const isPlaceholder =
  !process.env.NEXT_PUBLIC_SUPABASE_URL ||
  process.env.NEXT_PUBLIC_SUPABASE_URL.includes("placeholder");

// Base inicial em memória caso o Supabase ainda não esteja configurado
let demoServices: Service[] = [
  {
    id: "11111111-1111-1111-1111-111111111111",
    name: "Corte Tradicional",
    description: "Corte completo com tesoura ou máquina e acabamento navalhado.",
    duration_minutes: 30,
    price: 45.0,
    is_active: true,
  },
  {
    id: "22222222-2222-2222-2222-222222222222",
    name: "Barba Terapia",
    description: "Modelagem de barba com toalha quente, óleo especial e navalha.",
    duration_minutes: 30,
    price: 35.0,
    is_active: true,
  },
  {
    id: "33333333-3333-3333-3333-333333333333",
    name: "Combo Corte + Barba",
    description: "Experiência completa: corte estilizado e barba com toalha quente.",
    duration_minutes: 50,
    price: 75.0,
    is_active: true,
  },
];

export async function listServices(includeInactive = false): Promise<ActionResponse<Service[]>> {
  if (isPlaceholder) {
    const list = includeInactive ? demoServices : demoServices.filter((s) => s.is_active);
    return { success: true, data: list };
  }

  try {
    let query = supabaseAdmin
      .from("services")
      .select("*")
      .order("name", { ascending: true });

    if (!includeInactive) {
      query = query.eq("is_active", true);
    }

    const { data, error } = await query;

    if (error) {
      // Fallback gracioso para dados demo se o banco falhar
      console.warn("[SERVICE WARNING - listServices]: Falha no banco, usando dados demo.", error.message);
      const list = includeInactive ? demoServices : demoServices.filter((s) => s.is_active);
      return { success: true, data: list };
    }

    return { success: true, data: (data || []) as Service[] };
  } catch (err) {
    const list = includeInactive ? demoServices : demoServices.filter((s) => s.is_active);
    return { success: true, data: list };
  }
}

export async function createService(
  input: unknown
): Promise<ActionResponse<Service>> {
  const validation = CreateServiceSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados do serviço inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  if (isPlaceholder) {
    const newService: Service = {
      id: crypto.randomUUID(),
      ...validation.data,
      is_active: validation.data.is_active ?? true,
    };
    demoServices.push(newService);
    return { success: true, data: newService };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .insert(validation.data)
      .select()
      .single();

    if (error) {
      console.error("[SERVICE ERROR - createService]:", error.message);
      return { success: false, error: "Erro ao cadastrar serviço no banco de dados." };
    }

    return { success: true, data: data as Service };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - createService]:", err);
    return { success: false, error: "Erro interno inesperado ao cadastrar serviço." };
  }
}

export async function updateService(
  id: string,
  input: unknown
): Promise<ActionResponse<Service>> {
  const validation = UpdateServiceSchema.safeParse(input);
  if (!validation.success) {
    return {
      success: false,
      error: "Dados de atualização do serviço inválidos.",
      fieldErrors: validation.error.flatten().fieldErrors,
    };
  }

  if (isPlaceholder) {
    const index = demoServices.findIndex((s) => s.id === id);
    if (index === -1) {
      return { success: false, error: "Serviço não encontrado." };
    }
    demoServices[index] = { ...demoServices[index], ...validation.data };
    return { success: true, data: demoServices[index] };
  }

  try {
    const { data, error } = await supabaseAdmin
      .from("services")
      .update(validation.data)
      .eq("id", id)
      .select()
      .single();

    if (error) {
      console.error("[SERVICE ERROR - updateService]:", error.message);
      return { success: false, error: "Erro ao atualizar serviço." };
    }

    return { success: true, data: data as Service };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - updateService]:", err);
    return { success: false, error: "Erro interno inesperado ao atualizar serviço." };
  }
}

export async function deleteService(id: string): Promise<ActionResponse<null>> {
  if (isPlaceholder) {
    demoServices = demoServices.map((s) => (s.id === id ? { ...s, is_active: false } : s));
    return { success: true, data: null };
  }

  try {
    const { error } = await supabaseAdmin
      .from("services")
      .update({ is_active: false })
      .eq("id", id);

    if (error) {
      console.error("[SERVICE ERROR - deleteService]:", error.message);
      return { success: false, error: "Erro ao remover serviço." };
    }

    return { success: true, data: null };
  } catch (err) {
    console.error("[UNEXPECTED ERROR - deleteService]:", err);
    return { success: false, error: "Erro interno inesperado ao remover serviço." };
  }
}

export function getDemoServices(): Service[] {
  return demoServices;
}

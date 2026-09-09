import { describe, it, expect } from "vitest";
import { listServices, createService, updateService, deleteService } from "@/services/service.service";
import { CreateServiceSchema } from "@/schemas";

describe("Service Service - Gestão de Serviços e Preços", () => {
  it("deve listar os serviços de demonstração ativos", async () => {
    const res = await listServices();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBeGreaterThan(0);
    expect(res.data!.every((s) => s.is_active)).toBe(true);
  });

  it("deve validar e permitir cadastro de novo serviço com dados válidos", async () => {
    const valid = {
      name: "Corte Infantil",
      description: "Corte para crianças até 10 anos",
      duration_minutes: 25,
      price: 35.0,
      is_active: true,
    };

    const res = await createService(valid);
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe("Corte Infantil");
    expect(res.data?.price).toBe(35.0);
  });

  it("deve rejeitar cadastro com preço negativo", async () => {
    const invalid = {
      name: "Corte Inválido",
      duration_minutes: 30,
      price: -10,
    };

    const validation = CreateServiceSchema.safeParse(invalid);
    expect(validation.success).toBe(false);

    const res = await createService(invalid);
    expect(res.success).toBe(false);
  });

  it("deve rejeitar duração menor ou igual a zero", async () => {
    const invalid = {
      name: "Corte Zero Minutos",
      duration_minutes: 0,
      price: 40,
    };

    const validation = CreateServiceSchema.safeParse(invalid);
    expect(validation.success).toBe(false);

    const res = await createService(invalid);
    expect(res.success).toBe(false);
  });

  it("deve desativar serviço com soft-delete mantendo o registro", async () => {
    const resList = await listServices(true);
    const firstService = resList.data![0];

    const delRes = await deleteService(firstService.id);
    expect(delRes.success).toBe(true);

    const afterDel = await listServices(false);
    expect(afterDel.data?.some((s) => s.id === firstService.id)).toBe(false);
  });
});

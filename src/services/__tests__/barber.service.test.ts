import { describe, it, expect } from "vitest";
import { listBarbers, createBarber, deleteBarber } from "@/services/barber.service";
import { CreateBarberSchema } from "@/schemas";

describe("Barber Service - Gestão de Barbeiros", () => {
  it("deve listar os barbeiros ativos da barbearia", async () => {
    const res = await listBarbers();
    expect(res.success).toBe(true);
    expect(res.data).toBeDefined();
    expect(res.data!.length).toBeGreaterThan(0);
    expect(res.data!.every((b) => b.is_active)).toBe(true);
  });

  it("deve criar um novo barbeiro com sucesso", async () => {
    const valid = {
      name: "Rodrigo Navalha de Ouro",
      is_active: true,
    };

    const res = await createBarber(valid);
    expect(res.success).toBe(true);
    expect(res.data?.name).toBe("Rodrigo Navalha de Ouro");
  });

  it("deve rejeitar barbeiro com nome muito curto", async () => {
    const invalid = {
      name: "R",
      is_active: true,
    };

    const validation = CreateBarberSchema.safeParse(invalid);
    expect(validation.success).toBe(false);

    const res = await createBarber(invalid);
    expect(res.success).toBe(false);
  });

  it("deve desativar barbeiro sem apagar histórico", async () => {
    const list = await listBarbers(true);
    const target = list.data![0];

    const del = await deleteBarber(target.id);
    expect(del.success).toBe(true);

    const activeList = await listBarbers(false);
    expect(activeList.data?.some((b) => b.id === target.id)).toBe(false);
  });
});

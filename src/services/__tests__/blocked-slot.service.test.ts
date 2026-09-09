import { describe, it, expect } from "vitest";
import { listBlockedSlots, createBlockedSlot, deleteBlockedSlot } from "@/services/blocked-slot.service";
import { CreateBlockedSlotSchema } from "@/schemas";

describe("BlockedSlot Service - Bloqueios de Horário", () => {
  it("deve rejeitar bloqueio com horário de início posterior ou igual ao horário de fim", () => {
    const invalid = {
      barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      block_date: "2026-09-09",
      start_time: "14:00",
      end_time: "13:00", // Fim antes do início
      reason: "Erro de horário",
    };

    const validation = CreateBlockedSlotSchema.safeParse(invalid);
    expect(validation.success).toBe(false);
  });

  it("deve rejeitar horário de início igual ao horário de fim", () => {
    const invalid = {
      barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      block_date: "2026-09-09",
      start_time: "12:00",
      end_time: "12:00",
      reason: "Horário zerado",
    };

    const validation = CreateBlockedSlotSchema.safeParse(invalid);
    expect(validation.success).toBe(false);
  });

  it("deve criar bloqueio válido com sucesso", async () => {
    const valid = {
      barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
      block_date: "2026-09-09",
      start_time: "17:00",
      end_time: "18:00",
      reason: "Curso de aperfeiçoamento",
    };

    const res = await createBlockedSlot(valid);
    expect(res.success).toBe(true);
    expect(res.data?.reason).toBe("Curso de aperfeiçoamento");
  });

  it("deve listar os bloqueios cadastrados", async () => {
    const list = await listBlockedSlots();
    expect(list.success).toBe(true);
    expect(list.data).toBeDefined();
    expect(list.data!.length).toBeGreaterThan(0);
  });
});

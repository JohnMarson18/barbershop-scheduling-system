import { describe, it, expect } from "vitest";
import { LoginSchema, RegisterSchema } from "@/schemas";

describe("Autenticação e RBAC - Validações de Segurança", () => {
  describe("LoginSchema", () => {
    it("deve aceitar credenciais no formato correto", () => {
      const valid = {
        email: "admin@barberflow.com",
        password: "password123",
      };
      const res = LoginSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("deve rejeitar email sem @ ou formato inválido", () => {
      const invalid = {
        email: "adminbarberflow.com",
        password: "password123",
      };
      const res = LoginSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("deve rejeitar senha com menos de 6 caracteres", () => {
      const invalid = {
        email: "admin@barberflow.com",
        password: "123",
      };
      const res = LoginSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });
  });

  describe("RegisterSchema e Papéis RBAC", () => {
    it("deve validar registro de cliente com aceite de LGPD", () => {
      const valid = {
        name: "Carlos Ferreira",
        email: "carlos@gmail.com",
        password: "senhaSegura123",
        role: "client",
        lgpd_consent: true,
      };
      const res = RegisterSchema.safeParse(valid);
      expect(res.success).toBe(true);
    });

    it("deve rejeitar cadastro caso o consentimento LGPD não seja fornecido", () => {
      const invalid = {
        name: "Carlos Ferreira",
        email: "carlos@gmail.com",
        password: "senhaSegura123",
        role: "client",
        lgpd_consent: false,
      };
      const res = RegisterSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("deve rejeitar papel que não seja admin, barber ou client", () => {
      const invalid = {
        name: "Hacker User",
        email: "hacker@test.com",
        password: "senhaSegura123",
        role: "super_root",
        lgpd_consent: true,
      };
      const res = RegisterSchema.safeParse(invalid);
      expect(res.success).toBe(false);
    });

    it("deve atribuir o papel 'client' por padrão quando omitido", () => {
      const validWithoutRole = {
        name: "Cliente Padrão",
        email: "padrao@gmail.com",
        password: "senhaSegura123",
        lgpd_consent: true,
      };
      const res = RegisterSchema.safeParse(validWithoutRole);
      expect(res.success).toBe(true);
      if (res.success) {
        expect(res.data.role).toBe("client");
      }
    });

    it("deve validar vinculação de barbeiro apenas com uuid válido", () => {
      const withInvalidBarberId = {
        name: "Barbeiro Teste",
        email: "barbeiro@teste.com",
        password: "senhaSegura123",
        role: "barber",
        barber_id: "not-a-valid-uuid",
        lgpd_consent: true,
      };
      const res = RegisterSchema.safeParse(withInvalidBarberId);
      expect(res.success).toBe(false);
    });
  });
});

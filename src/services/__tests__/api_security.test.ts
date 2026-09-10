import { describe, it, expect } from "vitest";
import { GET as getAppointments, POST as createAppointment } from "@/app/api/appointments/route";
import { GET as getMyAppointments } from "@/app/api/my-appointments/route";
import { PATCH as updateAppointment } from "@/app/api/appointments/[id]/route";
import { DELETE as deleteBlockedSlot } from "@/app/api/blocked-slots/[id]/route";
import { POST as createService } from "@/app/api/services/route";
import { POST as registerUser } from "@/app/api/auth/register/route";
import { POST as anonymizeLgpd } from "@/app/api/lgpd/anonymize/route";
import { POST as loginUser } from "@/app/api/auth/login/route";
import { GET as getAdminTeam } from "@/app/api/admin/team/route";
import { NextRequest } from "next/server";

function createMockRequest(
  url: string,
  options: {
    method?: string;
    token?: string;
    headers?: Record<string, string>;
    body?: any;
  } = {}
): NextRequest {
  const reqHeaders = new Headers(options.headers || {});
  if (options.token) {
    reqHeaders.set("Authorization", `Bearer ${options.token}`);
  }
  if (options.body) {
    reqHeaders.set("Content-Type", "application/json");
  }

  const reqInit: RequestInit = {
    method: options.method || "GET",
    headers: reqHeaders,
  };

  if (options.body) {
    reqInit.body = JSON.stringify(options.body);
  }

  return new NextRequest(new URL(url, "http://localhost:3000"), reqInit as any);
}

describe("Fase 1: Segurança de APIs e Isolamento LGPD", () => {
  const adminToken = "demo-token:admin:user-admin-0001";
  const barberToken = "demo-token:barber:user-barber-0001";
  const barber2Token = "demo-token:barber:user-barber-0002";
  const clientToken = "demo-token:client:user-client-0001";

  describe("Bloqueio de Vazamento em GET /api/appointments", () => {
    it("deve rejeitar acesso anônimo com 401 Unauthorized", async () => {
      const req = createMockRequest("/api/appointments");
      const res = await getAppointments(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("deve rejeitar acesso de cliente comum com 403 Forbidden", async () => {
      const req = createMockRequest("/api/appointments", { token: clientToken });
      const res = await getAppointments(req);
      expect(res.status).toBe(403);
    });

    it("deve permitir acesso de barbeiro, mas isolar estritamente para seus próprios atendimentos", async () => {
      const req = createMockRequest("/api/appointments", { token: barberToken });
      const res = await getAppointments(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      // Todos os agendamentos retornados devem pertencer ao barber_id do Lucas
      for (const apt of json.data) {
        expect(apt.barber_id).toBe("aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa");
      }
    });

    it("deve permitir que o administrador consulte todos os agendamentos", async () => {
      const req = createMockRequest("/api/appointments", { token: adminToken });
      const res = await getAppointments(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
    });
  });

  describe("Isolamento Estrito em GET /api/my-appointments", () => {
    it("deve rejeitar acesso anônimo com 401 Unauthorized", async () => {
      const req = createMockRequest("/api/my-appointments");
      const res = await getMyAppointments(req);
      expect(res.status).toBe(401);
    });

    it("deve retornar apenas agendamentos pertencentes ao cliente autenticado", async () => {
      const req = createMockRequest("/api/my-appointments", { token: clientToken });
      const res = await getMyAppointments(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      for (const apt of json.data) {
        expect(apt.user_id).toBe("user-client-0001");
      }
    });
  });

  describe("Proteção contra Escalação de Privilégios em POST /api/auth/register", () => {
    it("deve impedir criação de admin sem credencial administrativa", async () => {
      const req = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Invasor Admin",
          email: "hacker@evil.com",
          password: "password123",
          role: "admin",
          lgpd_consent: true,
        },
      });
      const res = await registerUser(req);
      expect(res.status).toBe(401);
    });

    it("deve rejeitar tentativa de bypass com header falso x-admin-id", async () => {
      const req = createMockRequest("/api/auth/register", {
        method: "POST",
        headers: { "x-admin-id": "qualquer-coisa" },
        body: {
          name: "Invasor Admin",
          email: "hacker2@evil.com",
          password: "password123",
          role: "admin",
          lgpd_consent: true,
        },
      });
      const res = await registerUser(req);
      expect(res.status).toBe(401);
    });

    it("deve permitir que um admin autenticado crie um barbeiro", async () => {
      const req = createMockRequest("/api/auth/register", {
        method: "POST",
        token: adminToken,
        body: {
          name: "Novo Barbeiro",
          email: "novobarbeiro@barberflow.com",
          password: "password123",
          role: "barber",
          barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          lgpd_consent: true,
        },
      });
      const res = await registerUser(req);
      expect(res.status).toBe(200);
    });

    it("deve permitir auto-cadastro público de cliente", async () => {
      const req = createMockRequest("/api/auth/register", {
        method: "POST",
        body: {
          name: "Novo Cliente",
          email: "novocliente@gmail.com",
          password: "password123",
          role: "client",
          lgpd_consent: true,
        },
      });
      const res = await registerUser(req);
      expect(res.status).toBe(200);
    });
  });

  describe("Blindagem contra IDOR em POST /api/lgpd/anonymize", () => {
    it("deve rejeitar anonimização anônima com 401 Unauthorized", async () => {
      const req = createMockRequest("/api/lgpd/anonymize", {
        method: "POST",
        body: { userId: "user-client-0001" },
      });
      const res = await anonymizeLgpd(req);
      expect(res.status).toBe(401);
    });

    it("deve forçar que cliente anonimize apenas seus próprios dados por userId", async () => {
      const req = createMockRequest("/api/lgpd/anonymize", {
        method: "POST",
        token: clientToken,
        body: { userId: "vitima-123" }, // Tentativa de anonimizar outro usuário
      });
      const res = await anonymizeLgpd(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
    });

    it("deve rejeitar com 403 quando cliente tenta anonimizar agendamento pertencente a terceiro", async () => {
      // demo-apt-0002 não pertence ao user-client-0001
      const req = createMockRequest("/api/lgpd/anonymize", {
        method: "POST",
        token: clientToken,
        body: { appointmentId: "demo-apt-0002" },
      });
      const res = await anonymizeLgpd(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Você não possui permissão para anonimizar agendamentos de outros clientes.");
    });
  });

  describe("Blindagem contra BOLA em PATCH /api/appointments/:id", () => {
    it("deve rejeitar com 403 quando cliente tenta cancelar agendamento de terceiro", async () => {
      // demo-apt-0002 não possui user_id ou pertence a outro cliente
      const req = createMockRequest("/api/appointments/demo-apt-0002", {
        method: "PATCH",
        token: clientToken,
        body: { status: "cancelled" },
      });
      const res = await updateAppointment(req, { params: { id: "demo-apt-0002" } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Você só pode cancelar seus próprios agendamentos.");
    });

    it("deve rejeitar com 403 quando barbeiro tenta alterar agendamento de outro barbeiro", async () => {
      // demo-apt-0002 pertence ao Gabriel (barber_id: aaaaaaa2-...)
      // barberToken pertence ao Lucas (barber_id: aaaaaaa1-...)
      const req = createMockRequest("/api/appointments/demo-apt-0002", {
        method: "PATCH",
        token: barberToken,
        body: { status: "cancelled" },
      });
      const res = await updateAppointment(req, { params: { id: "demo-apt-0002" } });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Barbeiros só podem gerenciar agendamentos da sua própria agenda.");
    });
  });

  describe("Blindagem contra IDOR em DELETE /api/blocked-slots/:id", () => {
    it("deve rejeitar com 403 quando barbeiro tenta excluir bloqueio de horário de outro profissional", async () => {
      // bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb pertence ao Lucas (user-barber-0001)
      const req = createMockRequest("/api/blocked-slots/bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb", {
        method: "DELETE",
        token: barber2Token,
      });
      const res = await deleteBlockedSlot(req, {
        params: { id: "bbbbbbb1-bbbb-bbbb-bbbb-bbbbbbbbbbbb" },
      });
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Você não tem permissão para excluir bloqueios de outros barbeiros.");
    });

    it("deve rejeitar com 404 quando o bloqueio não existe", async () => {
      const req = createMockRequest("/api/blocked-slots/non-existent-slot-id", {
        method: "DELETE",
        token: barberToken,
      });
      const res = await deleteBlockedSlot(req, {
        params: { id: "non-existent-slot-id" },
      });
      expect(res.status).toBe(404);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.error).toBe("Bloqueio não encontrado.");
    });
  });

  describe("Sanitização de user_id em POST /api/appointments", () => {
    it("deve descartar user_id injetado por cliente anônimo em agendamento público e salvar como null", async () => {
      const req = createMockRequest("/api/appointments", {
        method: "POST",
        body: {
          client_name: "Cliente Anônimo Teste",
          client_whatsapp: "(11) 98888-7777",
          appointment_date: "2026-11-20",
          appointment_time: "11:00",
          service_id: "11111111-1111-1111-1111-111111111111",
          barber_id: "aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa",
          user_id: "00000000-0000-0000-0000-000000000000", // Tentativa de personificação
          lgpd_consent: true,
        },
      });
      const res = await createAppointment(req);
      expect(res.status).toBe(201);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.user_id).toBeNull();
    });
  });

  describe("Validação Estrita de Login em POST /api/auth/login", () => {
    it("deve rejeitar tentativa de login sem informar email com 400 Bad Request", async () => {
      const req = createMockRequest("/api/auth/login", {
        method: "POST",
        body: { password: "admin123" },
      });
      const res = await loginUser(req);
      expect(res.status).toBe(400);
      const json = await res.json();
      expect(json.success).toBe(false);
      expect(json.fieldErrors).toHaveProperty("email");
    });

    it("deve rejeitar tentativa de login com credenciais incorretas com 401 Unauthorized", async () => {
      const req = createMockRequest("/api/auth/login", {
        method: "POST",
        body: { email: "admin@barberflow.com", password: "wrongpassword" },
      });
      const res = await loginUser(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("deve autenticar com sucesso quando email e senha forem válidos", async () => {
      const req = createMockRequest("/api/auth/login", {
        method: "POST",
        body: { email: "admin@barberflow.com", password: "admin123" },
      });
      const res = await loginUser(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(json.data.token).toBeDefined();
    });
  });

  describe("Proteção de Rotas Administrativas em POST /api/services", () => {
    it("deve rejeitar criação de serviços por anônimos", async () => {
      const req = createMockRequest("/api/services", {
        method: "POST",
        body: {
          name: "Serviço Invasor",
          duration_minutes: 30,
          price: 50,
        },
      });
      const res = await createService(req);
      expect(res.status).toBe(401);
    });

    it("deve rejeitar criação de serviços por clientes comuns", async () => {
      const req = createMockRequest("/api/services", {
        method: "POST",
        token: clientToken,
        body: {
          name: "Serviço Invasor",
          duration_minutes: 30,
          price: 50,
        },
      });
      const res = await createService(req);
      expect(res.status).toBe(403);
    });

    it("deve aceitar criação de serviços por administradores autenticados", async () => {
      const req = createMockRequest("/api/services", {
        method: "POST",
        token: adminToken,
        body: {
          name: "Barba Premium Exclusiva",
          duration_minutes: 40,
          price: 60,
        },
      });
      const res = await createService(req);
      expect(res.status).toBe(201);
    });
  });

  describe("Proteção de Acesso em GET /api/admin/team", () => {
    it("deve rejeitar acesso anônimo com 401 Unauthorized", async () => {
      const req = createMockRequest("/api/admin/team");
      const res = await getAdminTeam(req);
      expect(res.status).toBe(401);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("deve rejeitar acesso de cliente comum com 403 Forbidden", async () => {
      const req = createMockRequest("/api/admin/team", { token: clientToken });
      const res = await getAdminTeam(req);
      expect(res.status).toBe(403);
      const json = await res.json();
      expect(json.success).toBe(false);
    });

    it("deve permitir acesso de administrador e listar membros da equipe com 200 OK", async () => {
      const req = createMockRequest("/api/admin/team", { token: adminToken });
      const res = await getAdminTeam(req);
      expect(res.status).toBe(200);
      const json = await res.json();
      expect(json.success).toBe(true);
      expect(Array.isArray(json.data)).toBe(true);
      expect(json.data.length).toBeGreaterThanOrEqual(1);
      expect(json.data.some((m: any) => m.role === "admin")).toBe(true);
    });
  });
});



# BarberFlow

Sistema de agendamento online e gestão para barbearias, construído com Next.js 14, TypeScript, Tailwind CSS e Supabase.

O projeto é **white-label**: o nome da barbearia e contato de WhatsApp são configurados via variáveis de ambiente, sem precisar alterar código.

---

## Funcionalidades

- **Agendamento público (Mobile-first):** Fluxo rápido de reserva pensado para link na bio do Instagram (serviço, barbeiro, data e horário).
- **Sem conflito de horários:** Cálculo dinâmico de slots considerando a duração de cada procedimento e bloqueios de intervalo/almoço.
- **Painel administrativo (RBAC):**
  - **Dono / Gerente:** Faturamento do dia, agenda geral, cadastro de serviços, barbeiros e equipe.
  - **Barbeiros:** Acesso restrito apenas à sua própria agenda e bloqueios pessoais.
- **Área do cliente:** Histórico de agendamentos e cancelamento com 1 clique.
- **Privacidade (LGPD):** Termo de consentimento e endpoint para anonimização definitiva dos dados do cliente (Art. 18).
- **Modo Demo integrado:** Roda 100% em memória localmente sem precisar configurar o banco de dados imediatamente.

---

## Stack

- **Framework:** Next.js 14 (App Router) + React 18
- **Linguagem:** TypeScript
- **Estilos:** Tailwind CSS + Radix UI
- **Validação:** Zod + React Hook Form
- **Banco & Auth:** Supabase (PostgreSQL + RLS)
- **Testes:** Vitest

---

## Instalação e Uso

1. **Clone o repositório:**
   ```bash
   git clone https://github.com/seu-usuario/barberflow.git
   cd barberflow
   ```

2. **Instale as dependências:**
   ```bash
   npm install
   ```

3. **Configure as variáveis de ambiente:**
   ```bash
   cp .env.example .env.local
   ```
   No `.env.local`, defina o nome da sua barbearia:
   ```env
   NEXT_PUBLIC_APP_NAME="BarberFlow"
   NEXT_PUBLIC_SHOP_WHATSAPP="5511999999999"
   ADMIN_EMAIL=admin@barberflow.com
   ADMIN_PASSWORD=admin123
   ```

4. **Inicie o servidor de desenvolvimento:**
   ```bash
   npm run dev
   ```
   Acesse [http://localhost:3000](http://localhost:3000).

---

## Contas de Teste (Modo Local)

| Papel | Email | Senha |
| :--- | :--- | :--- |
| Administrador / Dono | `admin@barberflow.com` | `admin123` |
| Barbeiro Lucas | `lucas@barberflow.com` | `barbeiro123` |
| Barbeiro Gabriel | `gabriel@barberflow.com` | `barbeiro123` |
| Cliente | `cliente@email.com` | `cliente123` |

---

## Testes Automatizados

Para rodar os testes unitários e de regras de negócio:

```bash
npm test
```

---

## Licença

MIT

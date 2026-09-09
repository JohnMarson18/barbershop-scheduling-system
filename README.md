<div align="center">

# 💈 BarberFlow

**Sistema Moderno de Agendamento Online e Gestão para Barbearias**  
*White-label &bull; Mobile-First &bull; Multi-Login (RBAC) &bull; 100% LGPD Compliant*

[![Next.js](https://img.shields.io/badge/Next.js-14.2-black?style=for-the-badge&logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5.5-blue?style=for-the-badge&logo=typescript)](https://www.typescriptlang.org/)
[![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-3.4-38B2AC?style=for-the-badge&logo=tailwind-css)](https://tailwindcss.com/)
[![Supabase](https://img.shields.io/badge/Supabase-PostgreSQL-3ECF8E?style=for-the-badge&logo=supabase)](https://supabase.com/)
[![Vitest](https://img.shields.io/badge/Vitest-Automated_Tests-FCC72B?style=for-the-badge&logo=vitest)](https://vitest.dev/)
[![LGPD](https://img.shields.io/badge/LGPD-Art._18_Compliant-emerald?style=for-the-badge)](https://www.gov.br/cidadania/pt-br/acesso-a-informacao/lgpd)

</div>

---

## 📖 Visão Geral

O **BarberFlow** é uma solução completa de agendamento online e gestão operacional desenvolvida sob medida para barbearias, estúdios de estética e salões modernos. 

O projeto foi arquitetado como uma plataforma **white-label**, permitindo que qualquer barbearia configure seu próprio nome, número de WhatsApp e regras de negócio apenas editando variáveis de ambiente — sem necessidade de alterar o código-fonte.

Funciona imediatamente tanto em **modo de demonstração local** (com banco de dados em memória e dados demonstrativos realistas) quanto integrado a um banco de dados real no **Supabase (PostgreSQL)** com segurança RLS (*Row Level Security*).

---

## ✨ Principais Funcionalidades

### 📱 1. Fluxo de Agendamento Público (Mobile-First / Link na Bio)
- **Zero Atrito:** Agendamento rápido em menos de 1 minuto diretamente pelo smartphone.
- **Seleção Intuitiva em Etapas:**
  1. Escolha do Serviço (com duração e preço visíveis);
  2. Escolha do Profissional/Barbeiro preferido;
  3. Escolha da Data (próximos 7 dias úteis com exclusão automática de domingos);
  4. Seleção de Horário Disponível (calculado em tempo real com base no expediente e durações);
  5. Identificação rápida (Nome e WhatsApp) com aceite explícito da LGPD.
- **Comprovante Digital & Notificação WhatsApp:** Geração de recibo e link direto com mensagem formatada para confirmação com o barbeiro via WhatsApp Web/App.

### 👑 2. Painel Administrativo Multi-Login & RBAC (Role-Based Access Control)
- **Dono / Gerente Geral (`admin`):**
  - Métricas de faturamento diário consolidado em tempo real;
  - Visão geral de todos os atendimentos da barbearia ou filtro por profissional;
  - Gestão completa de Serviços (preço, duração, soft delete);
  - Gestão de Barbeiros da equipe;
  - Criação de novos logins e permissões para funcionários (`/admin/team`).
- **Barbeiro Individual (`barber`):**
  - Login individual com senha corporativa;
  - Visualização **exclusiva da sua própria fila de clientes do dia** (resguardando a privacidade dos colegas);
  - Bloqueio de horários pessoais (almoço, compromissos ou folgas) travado no seu próprio perfil.

### 🛡️ 3. Conformidade Rigorosa com a LGPD (Lei Geral de Proteção de Dados)
- **Consentimento Transparente:** Checkbox obrigatório e modal explicativo sobre a finalidade da coleta dos dados (Nome e WhatsApp).
- **Direito ao Esquecimento (Art. 18):** O cliente pode solicitar a anonimização permanente de seus dados cadastrais e histórico com 1 clique pela Área do Cliente.
- **Segurança de Dados:** O sistema anonimiza nomes e contatos (`Cliente Anonimizado (LGPD)` / `(00) 00000-0000`) preservando a integridade das métricas financeiras sem violar a privacidade.

### 👤 4. Área do Cliente ("Meus Agendamentos")
- Login opcional para clientes acompanharem seus agendamentos futuros e passados;
- **Cancelamento Autônomo:** O próprio cliente pode cancelar seu horário com antecedência, liberando a vaga imediatamente na grade para outros clientes;
- Gestão de privacidade e exercício de direitos da LGPD.

### ⏱️ 5. Algoritmo Anticolisão de Horários
- Cálculo preciso de slots considerando serviços com durações distintas (ex: combos de 50min bloqueando adequadamente intervalos subsequentes);
- Bloqueio automático de horários que ultrapassam o fechamento da barbearia;
- Proteção contra agendamentos simultâneos (*double-booking*) com índice parcial único no PostgreSQL:
  ```sql
  CREATE UNIQUE INDEX uq_active_appointment_slot 
  ON appointments (barber_id, appointment_date, appointment_time) 
  WHERE status = 'scheduled';
  ```

---

## 🛠️ Stack Tecnológica

| Camada | Tecnologia |
| :--- | :--- |
| **Frontend & Framework** | [Next.js 14 (App Router)](https://nextjs.org/) + React 18 |
| **Linguagem** | [TypeScript](https://www.typescriptlang.org/) |
| **Estilização & UI** | [Tailwind CSS](https://tailwindcss.com/) + Radix UI + Lucide Icons |
| **Formulários & Validação** | [React Hook Form](https://react-hook-form.com/) + [Zod](https://zod.dev/) |
| **Banco de Dados & Auth** | [Supabase](https://supabase.com/) (PostgreSQL + RLS + Supabase Auth) |
| **Testes Automatizados** | [Vitest](https://vitest.dev/) (Suíte completa de regras de negócio e RBAC) |

---

## 🚀 Como Executar o Projeto

### Pré-requisitos
- [Node.js](https://nodejs.org/) versão 18.17 ou superior;
- Gerenciador de pacotes `npm` ou `yarn`.

### 1. Clonar o Repositório
```bash
git clone https://github.com/seu-usuario/barberflow.git
cd barberflow
```

### 2. Instalar as Dependências
```bash
npm install
```

### 3. Configurar as Variáveis de Ambiente
Copie o arquivo de exemplo:
```bash
cp .env.example .env.local
```
Personalize os dados da barbearia:
```env
# Identidade White-label
NEXT_PUBLIC_APP_NAME="Nome da Sua Barbearia"
NEXT_PUBLIC_SHOP_WHATSAPP="5511999999999"

# Credenciais do Administrador
ADMIN_EMAIL=admin@barberflow.com
ADMIN_PASSWORD=admin123
```

### 4. Executar em Modo de Desenvolvimento
```bash
npm run dev
```
Acesse [http://localhost:3000](http://localhost:3000) no seu navegador. O sistema já estará operando com dados demonstrativos em memória!

---

## 🧪 Testes Automatizados

O projeto conta com uma suíte de testes unitários e de integração validando regras de negócio, colisões de horários, papéis RBAC e LGPD:

```bash
npm test
```

### Arquivos de Teste Incluídos:
- `appointment.service.test.ts`: Validação de expediente, cálculo de colisões parciais, durações mistas e anonimização LGPD;
- `auth_rbac.test.ts`: Validação de credenciais, permissões de papéis e bloqueio contra escalação de privilégios;
- `service.service.test.ts`: Gestão de serviços, validação de preços e soft delete;
- `barber.service.test.ts`: Gestão de barbeiros e integridade de vínculos;
- `blocked-slot.service.test.ts`: Bloqueio de horários de almoço e intervalos.

---

## 🗄️ Estrutura do Banco de Dados (Supabase)

Para conectar um banco Supabase em produção, basta executar os scripts SQL inclusos na pasta `supabase/migrations/`:
1. `20240520_initial_schema.sql`: Tabelas `barbers`, `services`, `blocked_slots`, `appointments` e índices anticolisão;
2. `20240521_rbac_and_lgpd.sql`: Tabela `profiles` para RBAC e políticas RLS de segurança.

Após rodar as migrações no dashboard do Supabase, preencha as variáveis `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY` e `SUPABASE_SERVICE_ROLE_KEY` no seu `.env.local`.

---

## 📂 Estrutura de Pastas

```
barberflow/
├── src/
│   ├── app/                    # Rotas do Next.js App Router
│   │   ├── admin/              # Painel administrativo (Dashboard, Serviços, Barbeiros, Equipe)
│   │   ├── api/                # Endpoints REST (Auth, Agendamentos, LGPD, etc.)
│   │   ├── login/              # Tela unificada de login e cadastro
│   │   ├── meus-agendamentos/  # Área do cliente (histórico, cancelamento, LGPD)
│   │   ├── globals.css         # Estilização global Tailwind
│   │   ├── layout.tsx          # Layout raiz com AuthProvider global
│   │   └── page.tsx            # Página de agendamento público (Mobile-first)
│   ├── components/             # Componentes modulares reutilizáveis
│   │   ├── admin/              # Componentes de gestão e layouts administrativos
│   │   ├── public/             # Formulários públicos, seletor de horários e modais
│   │   ├── shared/             # Badges de status e componentes compartilhados
│   │   └── ui/                 # Componentes visuais base (Botões, Cards, Inputs, Tables)
│   ├── config/                 # Configuração central white-label (site.ts)
│   ├── contexts/               # AuthContext global (reatividade de sessão sem F5)
│   ├── hooks/                  # Custom hooks para consumo limpo das APIs
│   ├── lib/                    # Utilitários e cliente Supabase
│   ├── schemas/                # Schemas de validação Zod e tipos TypeScript
│   └── services/               # Camada de regras de negócio e fallback demo
├── supabase/migrations/        # Migrações SQL e scripts RLS para produção
├── package.json
└── README.md
```

---

## 📄 Licença

Este projeto é distribuído sob a licença **MIT**. Você é livre para utilizar, modificar e comercializar em suas próprias soluções ou barbearias.

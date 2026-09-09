-- Migração: Controle de Acesso Baseado em Funções (RBAC) e Conformidade LGPD

-- 1. Tabela de Perfis de Usuário vinculada ao Supabase Auth
CREATE TABLE IF NOT EXISTS profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'barber', 'client')) DEFAULT 'client',
  barber_id UUID REFERENCES barbers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para updated_at em profiles
CREATE TRIGGER update_profiles_updated_at 
BEFORE UPDATE ON profiles 
FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- 2. Alteração na tabela de agendamentos para suportar clientes autenticados e consentimento LGPD
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lgpd_consent BOOLEAN NOT NULL DEFAULT true;
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS lgpd_consent_date TIMESTAMPTZ DEFAULT NOW();
ALTER TABLE appointments ADD COLUMN IF NOT EXISTS is_anonymized BOOLEAN NOT NULL DEFAULT false;

-- 3. Habilitar RLS na tabela de perfis
ALTER TABLE profiles ENABLE ROW LEVEL SECURITY;

-- Políticas para PROFILES
-- Usuário pode ver seu próprio perfil
CREATE POLICY "Users can view own profile" ON profiles
  FOR SELECT USING (auth.uid() = id);

-- Admins podem ver todos os perfis
CREATE POLICY "Admins can view all profiles" ON profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Admins podem gerenciar todos os perfis
CREATE POLICY "Admins can manage profiles" ON profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- 4. Atualizar políticas RLS de APPOINTMENTS para isolamento estrito de dados (LGPD)
DROP POLICY IF EXISTS "Admins can view all appointments" ON appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON appointments;

-- Clientes autenticados podem ver apenas os seus próprios agendamentos
CREATE POLICY "Clients can view own appointments" ON appointments
  FOR SELECT USING (auth.uid() = user_id);

-- Barbeiros podem ver apenas agendamentos atribuídos a eles
CREATE POLICY "Barbers can view their assigned appointments" ON appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'barber' 
      AND profiles.barber_id = appointments.barber_id
    )
  );

-- Administradores/Gerentes podem ver todos os agendamentos
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Barbeiros podem atualizar status dos seus próprios agendamentos
CREATE POLICY "Barbers can update own appointments" ON appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'barber' 
      AND profiles.barber_id = appointments.barber_id
    )
  );

-- Administradores podem atualizar qualquer agendamento
CREATE POLICY "Admins can update any appointment" ON appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM profiles WHERE id = auth.uid() AND role = 'admin')
  );

-- Clientes podem cancelar seus próprios agendamentos futuros
CREATE POLICY "Clients can cancel own appointments" ON appointments
  FOR UPDATE USING (auth.uid() = user_id AND status = 'scheduled');

-- 5. Índices de segurança e busca por usuário
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_barber_id ON profiles(barber_id);

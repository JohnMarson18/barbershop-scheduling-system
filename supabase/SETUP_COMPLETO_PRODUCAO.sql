-- ==============================================================================
-- BARBERFLOW: SCRIPT UNIFICADO DE IMPLANTAÇÃO COMPLETA NO SUPABASE (PRODUÇÃO)
-- ==============================================================================
-- Instruções:
-- 1. Abra o painel do seu projeto no Supabase (https://supabase.com/dashboard)
-- 2. No menu lateral esquerdo, clique no ícone "SQL Editor"
-- 3. Clique em "New query", cole todo este arquivo e clique em "Run" (botão verde)
-- 4. O banco estará 100% criado, com RLS blindado, locks atômicos e dados iniciais!
-- ==============================================================================

-- 1. HABILITAR EXTENSÃO CRIPTOGRÁFICA
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. CRIAÇÃO DAS TABELAS PRINCIPAIS

-- Tabela de Serviços da Barbearia
CREATE TABLE IF NOT EXISTS public.services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Barbeiros da Equipe
CREATE TABLE IF NOT EXISTS public.barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Horários Bloqueados (Folgas, Intervalos, Almoço)
CREATE TABLE IF NOT EXISTS public.blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Perfis de Usuário (Integrada ao Supabase Auth)
CREATE TABLE IF NOT EXISTS public.profiles (
  id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
  email TEXT NOT NULL UNIQUE,
  name TEXT NOT NULL,
  role TEXT NOT NULL CHECK (role IN ('admin', 'barber', 'client')) DEFAULT 'client',
  barber_id UUID REFERENCES public.barbers(id) ON DELETE SET NULL,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de Agendamentos
CREATE TABLE IF NOT EXISTS public.appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES public.services(id) ON DELETE RESTRICT,
  barber_id UUID NOT NULL REFERENCES public.barbers(id) ON DELETE RESTRICT,
  user_id UUID REFERENCES auth.users(id) ON DELETE SET NULL,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'attended', 'cancelled')),
  lgpd_consent BOOLEAN NOT NULL DEFAULT true,
  lgpd_consent_date TIMESTAMPTZ DEFAULT NOW(),
  is_anonymized BOOLEAN NOT NULL DEFAULT false,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 3. GATILHOS DE ATUALIZAÇÃO AUTOMÁTICA (updated_at)
CREATE OR REPLACE FUNCTION public.update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS update_services_updated_at ON public.services;
CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON public.services FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_barbers_updated_at ON public.barbers;
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON public.barbers FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_blocked_slots_updated_at ON public.blocked_slots;
CREATE TRIGGER update_blocked_slots_updated_at BEFORE UPDATE ON public.blocked_slots FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_profiles_updated_at ON public.profiles;
CREATE TRIGGER update_profiles_updated_at BEFORE UPDATE ON public.profiles FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

DROP TRIGGER IF EXISTS update_appointments_updated_at ON public.appointments;
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON public.appointments FOR EACH ROW EXECUTE FUNCTION public.update_updated_at_column();

-- 4. ÍNDICES DE PERFORMANCE E INTEGRIDADE
CREATE INDEX IF NOT EXISTS idx_appointments_date_barber ON public.appointments(appointment_date, barber_id);
CREATE INDEX IF NOT EXISTS idx_appointments_user_id ON public.appointments(user_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_barber_date ON public.blocked_slots(barber_id, block_date);
CREATE INDEX IF NOT EXISTS idx_services_active ON public.services(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_active ON public.barbers(is_active);
CREATE INDEX IF NOT EXISTS idx_profiles_role ON public.profiles(role);
CREATE INDEX IF NOT EXISTS idx_profiles_barber_id ON public.profiles(barber_id);

-- Blindagem física contra agendamento simultâneo no mesmo minuto exato
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_appointment_slot 
ON public.appointments(barber_id, appointment_date, appointment_time) 
WHERE status = 'scheduled';

-- 5. SEGURANÇA POR LINHA (ROW LEVEL SECURITY - RLS)
ALTER TABLE public.services ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.appointments ENABLE ROW LEVEL SECURITY;

-- Políticas para SERVICES
DROP POLICY IF EXISTS "Public can view active services" ON public.services;
DROP POLICY IF EXISTS "Admins can manage services" ON public.services;

CREATE POLICY "Public can view active services" ON public.services
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage services" ON public.services
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Políticas para BARBERS
DROP POLICY IF EXISTS "Public can view active barbers" ON public.barbers;
DROP POLICY IF EXISTS "Admins can manage barbers" ON public.barbers;

CREATE POLICY "Public can view active barbers" ON public.barbers
  FOR SELECT USING (is_active = true);

CREATE POLICY "Admins can manage barbers" ON public.barbers
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Políticas para BLOCKED_SLOTS
DROP POLICY IF EXISTS "Public can view blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Admins can manage all blocked slots" ON public.blocked_slots;
DROP POLICY IF EXISTS "Barbers can manage own blocked slots" ON public.blocked_slots;

CREATE POLICY "Public can view blocked slots" ON public.blocked_slots
  FOR SELECT USING (true);

CREATE POLICY "Admins can manage all blocked slots" ON public.blocked_slots
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Barbers can manage own blocked slots" ON public.blocked_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'barber' 
      AND profiles.barber_id = blocked_slots.barber_id
    )
  );

-- Políticas para PROFILES
DROP POLICY IF EXISTS "Users can view own profile" ON public.profiles;
DROP POLICY IF EXISTS "Admins can view all profiles" ON public.profiles;
DROP POLICY IF EXISTS "Admins can manage profiles" ON public.profiles;

CREATE POLICY "Users can view own profile" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "Admins can view all profiles" ON public.profiles
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Admins can manage profiles" ON public.profiles
  FOR ALL USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

-- Políticas para APPOINTMENTS
DROP POLICY IF EXISTS "Public can create appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can view all appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update appointments" ON public.appointments;
DROP POLICY IF EXISTS "Clients can view own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can view their assigned appointments" ON public.appointments;
DROP POLICY IF EXISTS "Barbers can update own appointments" ON public.appointments;
DROP POLICY IF EXISTS "Admins can update any appointment" ON public.appointments;
DROP POLICY IF EXISTS "Clients can cancel own appointments" ON public.appointments;

CREATE POLICY "Clients can view own appointments" ON public.appointments
  FOR SELECT USING (auth.uid() = user_id);

CREATE POLICY "Barbers can view their assigned appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'barber' 
      AND profiles.barber_id = appointments.barber_id
    )
  );

CREATE POLICY "Admins can view all appointments" ON public.appointments
  FOR SELECT USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Barbers can update own appointments" ON public.appointments
  FOR UPDATE USING (
    EXISTS (
      SELECT 1 FROM public.profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'barber' 
      AND profiles.barber_id = appointments.barber_id
    )
  );

CREATE POLICY "Admins can update any appointment" ON public.appointments
  FOR UPDATE USING (
    EXISTS (SELECT 1 FROM public.profiles WHERE profiles.id = auth.uid() AND profiles.role = 'admin')
  );

CREATE POLICY "Clients can cancel own appointments" ON public.appointments
  FOR UPDATE USING (auth.uid() = user_id AND status = 'scheduled');

CREATE POLICY "Public can create appointments" ON public.appointments
  FOR INSERT WITH CHECK (true);

-- 6. STORED PROCEDURE COM LOCK TRANSACIONAL (ANTI-RACE CONDITION POR INTERVALO)
CREATE OR REPLACE FUNCTION public.check_and_create_appointment(
  p_service_id UUID,
  p_barber_id UUID,
  p_client_name TEXT,
  p_client_whatsapp TEXT,
  p_appointment_date DATE,
  p_appointment_time TIME,
  p_user_id UUID DEFAULT NULL,
  p_lgpd_consent BOOLEAN DEFAULT TRUE
)
RETURNS JSONB
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
DECLARE
  v_duration INTEGER;
  v_start_time TIME := p_appointment_time;
  v_end_time TIME;
  v_has_conflict BOOLEAN;
  v_has_block_conflict BOOLEAN;
  v_appointment RECORD;
  v_lock_key BIGINT;
BEGIN
  -- Bloqueio consultivo transacional atômico baseado em hash do barbeiro e da data
  v_lock_key := ('x' || substr(md5(p_barber_id::text || ':' || p_appointment_date::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- Consulta da duração do serviço
  SELECT duration_minutes INTO v_duration
  FROM public.services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Serviço solicitado não foi encontrado ou está desativado.'
    );
  END IF;

  v_end_time := (v_start_time::INTERVAL + (v_duration || ' minutes')::INTERVAL)::TIME;

  -- Checagem de sobreposição com agendamentos ativos
  SELECT EXISTS (
    SELECT 1
    FROM public.appointments a
    JOIN public.services s ON s.id = a.service_id
    WHERE a.barber_id = p_barber_id
      AND a.appointment_date = p_appointment_date
      AND a.status = 'scheduled'
      AND (a.appointment_time < v_end_time)
      AND ((a.appointment_time::INTERVAL + (s.duration_minutes || ' minutes')::INTERVAL)::TIME > v_start_time)
  ) INTO v_has_conflict;

  IF v_has_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Horário indisponível: já existe outro atendimento agendado neste intervalo.'
    );
  END IF;

  -- Checagem de sobreposição com bloqueios de folga/almoço
  SELECT EXISTS (
    SELECT 1
    FROM public.blocked_slots b
    WHERE b.barber_id = p_barber_id
      AND b.block_date = p_appointment_date
      AND (b.start_time < v_end_time)
      AND (b.end_time > v_start_time)
  ) INTO v_has_block_conflict;

  IF v_has_block_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Horário indisponível: o barbeiro possui um intervalo/bloqueio neste horário.'
    );
  END IF;

  -- Inserção atômica
  INSERT INTO public.appointments (
    service_id,
    barber_id,
    client_name,
    client_whatsapp,
    appointment_date,
    appointment_time,
    user_id,
    lgpd_consent,
    status
  ) VALUES (
    p_service_id,
    p_barber_id,
    p_client_name,
    p_client_whatsapp,
    p_appointment_date,
    p_appointment_time,
    p_user_id,
    COALESCE(p_lgpd_consent, true),
    'scheduled'
  )
  RETURNING * INTO v_appointment;

  RETURN jsonb_build_object(
    'success', true,
    'data', to_jsonb(v_appointment)
  );

EXCEPTION WHEN OTHERS THEN
  RETURN jsonb_build_object(
    'success', false,
    'error', 'Erro ao salvar agendamento: ' || SQLERRM
  );
END;
$$;

GRANT EXECUTE ON FUNCTION public.check_and_create_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION public.check_and_create_appointment TO anon;
GRANT EXECUTE ON FUNCTION public.check_and_create_appointment TO service_role;

-- 7. DADOS INICIAIS (SEED CATÁLOGO DE SERVIÇOS E BARBEIROS)
INSERT INTO public.services (id, name, description, duration_minutes, price, is_active)
VALUES 
  ('11111111-1111-1111-1111-111111111111', 'Corte Tradicional', 'Corte completo com tesoura ou máquina e acabamento navalhado.', 30, 45.00, true),
  ('22222222-2222-2222-2222-222222222222', 'Barba Terapia', 'Modelagem de barba com toalha quente, óleo especial e navalha.', 30, 35.00, true),
  ('33333333-3333-3333-3333-333333333333', 'Combo Corte + Barba', 'Experiência completa: corte estilizado e barba com toalha quente.', 50, 75.00, true)
ON CONFLICT (name) DO NOTHING;

INSERT INTO public.barbers (id, name, is_active)
VALUES 
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lucas Silva', true),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gabriel Santos', true),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mateus Oliveira', true)
ON CONFLICT (name) DO NOTHING;

-- 8. CRIAÇÃO DO PRIMEIRO ADMINISTRADOR MASTER (DONO DA BARBEARIA)
-- NOTA: Altere a senha 'admin123' abaixo para a sua senha de preferência antes de rodar
DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_admin_email TEXT := 'admin@barberflow.com';
  v_admin_password TEXT := 'admin123'; -- << DIGITE SUA SENHA AQUI
BEGIN
  IF NOT EXISTS (SELECT 1 FROM auth.users WHERE email = v_admin_email) THEN
    INSERT INTO auth.users (
      id,
      instance_id,
      email,
      encrypted_password,
      email_confirmed_at,
      raw_app_meta_data,
      raw_user_meta_data,
      created_at,
      updated_at,
      role
    ) VALUES (
      v_admin_id,
      '00000000-0000-0000-0000-000000000000',
      v_admin_email,
      crypt(v_admin_password, gen_salt('bf')),
      NOW(),
      '{"provider":"email","providers":["email"]}',
      '{"name":"Gerente Geral (Dono)","role":"admin"}',
      NOW(),
      NOW(),
      'authenticated'
    );
  ELSE
    SELECT id INTO v_admin_id FROM auth.users WHERE email = v_admin_email;
  END IF;

  INSERT INTO public.profiles (id, email, name, role, barber_id)
  VALUES (v_admin_id, v_admin_email, 'Gerente Geral (Dono)', 'admin', NULL)
  ON CONFLICT (id) DO UPDATE SET role = 'admin', updated_at = NOW();
END $$;

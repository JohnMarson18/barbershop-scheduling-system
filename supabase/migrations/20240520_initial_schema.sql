-- Tabela de serviços (Corte, Barba, Combo)
CREATE TABLE IF NOT EXISTS services (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  description TEXT,
  duration_minutes INTEGER NOT NULL CHECK (duration_minutes > 0),
  price NUMERIC(10,2) NOT NULL CHECK (price >= 0),
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de barbeiros
CREATE TABLE IF NOT EXISTS barbers (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  name TEXT NOT NULL UNIQUE,
  is_active BOOLEAN NOT NULL DEFAULT true,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de horários bloqueados (folgas, almoço, etc.)
CREATE TABLE IF NOT EXISTS blocked_slots (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE CASCADE,
  block_date DATE NOT NULL,
  start_time TIME NOT NULL,
  end_time TIME NOT NULL,
  reason TEXT,
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Tabela de agendamentos
CREATE TABLE IF NOT EXISTS appointments (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  service_id UUID NOT NULL REFERENCES services(id) ON DELETE RESTRICT,
  barber_id UUID NOT NULL REFERENCES barbers(id) ON DELETE RESTRICT,
  client_name TEXT NOT NULL,
  client_whatsapp TEXT NOT NULL,
  appointment_date DATE NOT NULL,
  appointment_time TIME NOT NULL,
  status TEXT NOT NULL DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'attended', 'cancelled')),
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Trigger para atualizar updated_at automaticamente em todas as tabelas
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER update_services_updated_at BEFORE UPDATE ON services FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_barbers_updated_at BEFORE UPDATE ON barbers FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_blocked_slots_updated_at BEFORE UPDATE ON blocked_slots FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
CREATE TRIGGER update_appointments_updated_at BEFORE UPDATE ON appointments FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();

-- Habilitar RLS (Row Level Security) em todas as tabelas
ALTER TABLE services ENABLE ROW LEVEL SECURITY;
ALTER TABLE barbers ENABLE ROW LEVEL SECURITY;
ALTER TABLE blocked_slots ENABLE ROW LEVEL SECURITY;
ALTER TABLE appointments ENABLE ROW LEVEL SECURITY;

-- Políticas de segurança para SERVICES
-- Qualquer pessoa (anônima ou logada) pode ver serviços ativos
CREATE POLICY "Public can view active services" ON services
  FOR SELECT USING (is_active = true);
-- Apenas usuários autenticados (admin) podem gerenciar serviços
CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas de segurança para BARBERS
-- Qualquer pessoa pode ver barbeiros ativos
CREATE POLICY "Public can view active barbers" ON barbers
  FOR SELECT USING (is_active = true);
-- Apenas admin pode gerenciar barbeiros
CREATE POLICY "Admins can manage barbers" ON barbers
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas de segurança para BLOCKED_SLOTS
-- Qualquer pessoa pode ver horários bloqueados (para não mostrar agendamentos nesses horários)
CREATE POLICY "Public can view blocked slots" ON blocked_slots
  FOR SELECT USING (true);
-- Apenas admin pode gerenciar bloqueios
CREATE POLICY "Admins can manage blocked slots" ON blocked_slots
  FOR ALL USING (auth.role() = 'authenticated');

-- Políticas de segurança para APPOINTMENTS
-- Clientes anônimos podem criar agendamentos
CREATE POLICY "Public can create appointments" ON appointments
  FOR INSERT WITH CHECK (true);
-- Apenas admin pode ver todos os agendamentos
CREATE POLICY "Admins can view all appointments" ON appointments
  FOR SELECT USING (auth.role() = 'authenticated');
-- Apenas admin pode atualizar status de agendamentos
CREATE POLICY "Admins can update appointments" ON appointments
  FOR UPDATE USING (auth.role() = 'authenticated');

-- Índices para melhorar performance das consultas
CREATE INDEX IF NOT EXISTS idx_appointments_date_barber ON appointments(appointment_date, barber_id);
CREATE INDEX IF NOT EXISTS idx_blocked_slots_barber_date ON blocked_slots(barber_id, block_date);
CREATE INDEX IF NOT EXISTS idx_services_active ON services(is_active);
CREATE INDEX IF NOT EXISTS idx_barbers_active ON barbers(is_active);

-- Índice único para garantir matematicamente que dois clientes não agendem o mesmo horário simultaneamente (Anti-Race Condition)
CREATE UNIQUE INDEX IF NOT EXISTS uq_active_appointment_slot 
ON appointments(barber_id, appointment_date, appointment_time) 
WHERE status = 'scheduled';

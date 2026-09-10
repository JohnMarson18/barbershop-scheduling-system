-- Migração: Blindagem Estrita de RLS (Row Level Security)
-- Data: 2024-05-23
-- Objetivo: Corrigir políticas que utilizavam auth.role() = 'authenticated' nas tabelas de catálogo
--           e garantir que apenas usuários com role = 'admin' na tabela public.profiles possam modificá-las.

-- 1. Blindagem da tabela SERVICES
DROP POLICY IF EXISTS "Admins can manage services" ON services;

CREATE POLICY "Admins can manage services" ON services
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 2. Blindagem da tabela BARBERS
DROP POLICY IF EXISTS "Admins can manage barbers" ON barbers;

CREATE POLICY "Admins can manage barbers" ON barbers
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- 3. Blindagem da tabela BLOCKED_SLOTS
DROP POLICY IF EXISTS "Admins can manage blocked slots" ON blocked_slots;

-- Administradores podem gerenciar qualquer bloqueio de horário
CREATE POLICY "Admins can manage all blocked slots" ON blocked_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'admin'
    )
  );

-- Barbeiros podem gerenciar seus próprios bloqueios de horário
CREATE POLICY "Barbers can manage own blocked slots" ON blocked_slots
  FOR ALL USING (
    EXISTS (
      SELECT 1 FROM profiles 
      WHERE profiles.id = auth.uid() 
      AND profiles.role = 'barber' 
      AND profiles.barber_id = blocked_slots.barber_id
    )
  );

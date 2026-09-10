-- BarberFlow: Script Declarativo de Inicialização (Seed)
-- Execute este script no SQL Editor do Supabase após aplicar as migrações em supabase/migrations/
-- Objetivo: Criar os serviços iniciais, barbeiros e a conta mestre do Administrador/Dono (Bootstrap).

-- 1. Habilitar extensão pgcrypto caso ainda não esteja ativa
CREATE EXTENSION IF NOT EXISTS pgcrypto;

-- 2. Cadastro dos Serviços Padrão da Barbearia
INSERT INTO public.services (id, name, description, duration_minutes, price, is_active)
VALUES 
  (
    '11111111-1111-1111-1111-111111111111',
    'Corte Tradicional',
    'Corte completo com tesoura ou máquina e acabamento navalhado.',
    30,
    45.00,
    true
  ),
  (
    '22222222-2222-2222-2222-222222222222',
    'Barba Terapia',
    'Modelagem de barba com toalha quente, óleo especial e navalha.',
    30,
    35.00,
    true
  ),
  (
    '33333333-3333-3333-3333-333333333333',
    'Combo Corte + Barba',
    'Experiência completa: corte estilizado e barba com toalha quente.',
    50,
    75.00,
    true
  )
ON CONFLICT (name) DO NOTHING;

-- 3. Cadastro dos Barbeiros Iniciais
INSERT INTO public.barbers (id, name, is_active)
VALUES 
  ('aaaaaaa1-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Lucas Silva', true),
  ('aaaaaaa2-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Gabriel Santos', true),
  ('aaaaaaa3-aaaa-aaaa-aaaa-aaaaaaaaaaaa', 'Mateus Oliveira', true)
ON CONFLICT (name) DO NOTHING;

-- 4. Criação do Primeiro Administrador / Dono (Bootstrap Mestre)
-- ATENÇÃO: Substitua 'admin@barberflow.com' e 'admin123' pelas credenciais desejadas para produção
DO $$
DECLARE
  v_admin_id UUID := '00000000-0000-0000-0000-000000000001';
  v_admin_email TEXT := 'admin@barberflow.com';
  v_admin_password TEXT := 'admin123'; -- Altere para uma senha forte em ambiente de produção
BEGIN
  -- Cria o usuário em auth.users apenas se o email não existir
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

  -- Vincula o perfil na tabela public.profiles com papel de 'admin'
  INSERT INTO public.profiles (
    id,
    email,
    name,
    role,
    barber_id
  ) VALUES (
    v_admin_id,
    v_admin_email,
    'Gerente Geral (Dono)',
    'admin',
    NULL
  )
  ON CONFLICT (id) DO UPDATE SET
    role = 'admin',
    updated_at = NOW();

END $$;

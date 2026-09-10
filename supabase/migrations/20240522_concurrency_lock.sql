-- Migração: Blindagem de Concorrência Transacional por Intervalo (Anti-Race Condition)
-- Data: 2024-05-22
-- Objetivo: Evitar sobreposição de agendamentos com durações variáveis para o mesmo barbeiro

CREATE OR REPLACE FUNCTION check_and_create_appointment(
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
  -- 1. Obter hash de bloqueio transacional único por barbeiro e data
  -- Garante que duas transações simultâneas para o mesmo barbeiro na mesma data sejam serializadas
  v_lock_key := ('x' || substr(md5(p_barber_id::text || ':' || p_appointment_date::text), 1, 16))::bit(64)::bigint;
  PERFORM pg_advisory_xact_lock(v_lock_key);

  -- 2. Consultar a duração do serviço solicitado
  SELECT duration_minutes INTO v_duration
  FROM services
  WHERE id = p_service_id AND is_active = true;

  IF NOT FOUND THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Serviço solicitado não foi encontrado ou está desativado.'
    );
  END IF;

  -- 3. Calcular horário de término do procedimento
  v_end_time := (v_start_time::INTERVAL + (v_duration || ' minutes')::INTERVAL)::TIME;

  -- 4. Verificar conflito de intervalo com agendamentos existentes ativos
  SELECT EXISTS (
    SELECT 1
    FROM appointments a
    JOIN services s ON s.id = a.service_id
    WHERE a.barber_id = p_barber_id
      AND a.appointment_date = p_appointment_date
      AND a.status = 'scheduled'
      AND (a.appointment_time < v_end_time)
      AND ((a.appointment_time::INTERVAL + (s.duration_minutes || ' minutes')::INTERVAL)::TIME > v_start_time)
  ) INTO v_has_conflict;

  IF v_has_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Horário indisponível: existe outro agendamento em andamento neste intervalo.'
    );
  END IF;

  -- 5. Verificar conflito com horários bloqueados (almoço, folga, ausência)
  SELECT EXISTS (
    SELECT 1
    FROM blocked_slots b
    WHERE b.barber_id = p_barber_id
      AND b.block_date = p_appointment_date
      AND (b.start_time < v_end_time)
      AND (b.end_time > v_start_time)
  ) INTO v_has_block_conflict;

  IF v_has_block_conflict THEN
    RETURN jsonb_build_object(
      'success', false,
      'error', 'Horário indisponível: o barbeiro possui um bloqueio de agenda cadastrado neste intervalo.'
    );
  END IF;

  -- 6. Inserção segura e atômica dentro da transação protegida por lock
  INSERT INTO appointments (
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
    'error', 'Erro interno ao processar agendamento transacional: ' || SQLERRM
  );
END;
$$;

-- Permissões de execução para papéis do Supabase
GRANT EXECUTE ON FUNCTION check_and_create_appointment TO authenticated;
GRANT EXECUTE ON FUNCTION check_and_create_appointment TO anon;
GRANT EXECUTE ON FUNCTION check_and_create_appointment TO service_role;

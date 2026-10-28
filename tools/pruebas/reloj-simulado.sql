-- tools/pruebas/reloj-simulado.sql — SOLO bases de prueba (CT-02). Lo ejecuta el paso de siembra de CI,
-- como finn_migraciones, DESPUÉS de C3–C6 sobre la base plantilla. Nunca es una migración.
-- Reloj simulado = reloj real + desfase. La app fija el desfase por transacción con
-- set_config('finn.desfase_ms', …, true) (mismo mecanismo que finn.hoy, 04 §13.1.4).
-- Exige además el parámetro de base finn.reloj_simulado = on (DB-08), que una sesión no puede activar.
DO $$ BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase
                 WHERE d.datname = current_database() AND s.setrole = 0 AND 'finn.reloj_simulado=on' = ANY (s.setconfig)) THEN
    RAISE EXCEPTION 'reloj-simulado.sql: esta base no está marcada como base de prueba (finn.reloj_simulado)';
  END IF;
END $$;
CREATE OR REPLACE FUNCTION finn.desfase() RETURNS interval
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT coalesce(nullif(current_setting('finn.desfase_ms', true), '')::bigint, 0) * interval '1 millisecond' $$;
CREATE OR REPLACE FUNCTION finn.ahora() RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$ SELECT now() + finn.desfase() $$;
CREATE OR REPLACE FUNCTION finn.instante() RETURNS timestamptz
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$ SELECT clock_timestamp() + finn.desfase() $$;

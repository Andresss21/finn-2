-- finn:manual
-- CT-02 (prototipo, Fase 7). Única fuente de instantes de la base. En producción no lee ningún ajuste:
-- finn.ahora() = now() (inicio de la transacción) y finn.instante() = clock_timestamp() (después del bloqueo, BE-27).
-- Las bases de prueba reemplazan estos dos cuerpos con tools/pruebas/reloj-simulado.sql, nunca con una migración.
CREATE FUNCTION finn.ahora() RETURNS timestamptz
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$ SELECT now() $$;
CREATE FUNCTION finn.instante() RETURNS timestamptz
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$ SELECT clock_timestamp() $$;
REVOKE ALL ON FUNCTION finn.ahora(), finn.instante() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finn.ahora(), finn.instante() TO finn_app;

-- Los nueve DEFAULT de instantes técnicos (03 §3.17–§3.28) pasan a finn.ahora().
ALTER TABLE finn.sms_recibidos       ALTER COLUMN recibido_en   SET DEFAULT finn.ahora();
ALTER TABLE finn.sms_procesamientos  ALTER COLUMN procesado_en  SET DEFAULT finn.ahora();
ALTER TABLE finn.cambios_posteriores ALTER COLUMN registrado_en SET DEFAULT finn.ahora();
ALTER TABLE finn.eliminaciones       ALTER COLUMN eliminada_en  SET DEFAULT finn.ahora();
ALTER TABLE finn.suscripciones_push  ALTER COLUMN creada_en     SET DEFAULT finn.ahora();
ALTER TABLE finn.suscripciones_push  ALTER COLUMN renovada_en   SET DEFAULT finn.ahora();
ALTER TABLE finn.notificaciones      ALTER COLUMN creada_en     SET DEFAULT finn.ahora();
ALTER TABLE finn.eventos_sistema     ALTER COLUMN ocurrido_en   SET DEFAULT finn.ahora();
ALTER TABLE finn.token_webhook       ALTER COLUMN creado_en     SET DEFAULT finn.ahora();

-- EN-2 y finn.hoy(): mismo reloj.
CREATE OR REPLACE FUNCTION finn.purgar_eliminaciones() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE v_max bigint; n integer;
BEGIN
  WITH borradas AS (DELETE FROM finn.eliminaciones WHERE eliminada_en < finn.ahora() - interval '30 days' RETURNING revision)
  SELECT count(*), max(revision) INTO n, v_max FROM borradas;
  IF v_max IS NOT NULL THEN
    UPDATE finn.revision SET revision_minima_incremental = greatest(revision_minima_incremental, v_max + 1) WHERE id = 1;
  END IF;
  RETURN n;
END $$;

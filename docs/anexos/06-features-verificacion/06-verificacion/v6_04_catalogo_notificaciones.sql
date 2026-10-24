-- V6-04 · Catálogo de 04 frente a las restricciones de 03 (06-features §3.12, P6-17)
-- Ejecutar con: psql -v ON_ERROR_STOP=0 -f v6_04_catalogo_notificaciones.sql
-- Paso 1: tablas técnicas tal como las define 03 §3.28 y §10 (copiadas literalmente).
-- Paso 2: una fila por cada motivo de 04 §11.2 (y los nuevos de 06: pago_tarjeta_proximo, cuota_proxima) y por cada evento de 04 §15.2.
-- Paso 3: migración de expansión de CF-16 y repetición del paso 2.

DROP SCHEMA IF EXISTS finn CASCADE;
CREATE SCHEMA finn;
CREATE TYPE finn.nivel_evento AS ENUM ('info', 'aviso', 'error');

CREATE TABLE finn.notificaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  creada_en timestamptz NOT NULL DEFAULT now(),
  aviso text NOT NULL,
  motivo text NOT NULL,
  titulo text NOT NULL,
  cuerpo text NOT NULL,
  datos jsonb,
  leida_en timestamptz,
  push_enviada_en timestamptz,
  push_error text
);
ALTER TABLE finn.notificaciones
  ADD CONSTRAINT ck_notificaciones_aviso  CHECK (aviso ~ '^AV-[0-9]{2}$'),
  ADD CONSTRAINT ck_notificaciones_motivo CHECK (motivo = btrim(motivo) AND motivo <> '');

CREATE TABLE finn.eventos_sistema (
  id bigserial PRIMARY KEY,
  ocurrido_en timestamptz NOT NULL DEFAULT now(),
  nivel finn.nivel_evento NOT NULL,
  origen text NOT NULL,
  mensaje text NOT NULL,
  datos jsonb
);
ALTER TABLE finn.eventos_sistema
  ADD CONSTRAINT ck_eventos_origen CHECK (origen IN ('webhook', 'tarea_diaria', 'motor', 'respaldo', 'app'));

-- Catálogo: lo que la aplicación escribe según 04 §11.2 + 06 FD-22 (aviso NULL = motivo sin aviso del dominio)
CREATE TEMP TABLE catalogo_notificaciones (motivo text, aviso text, origen_doc text);
INSERT INTO catalogo_notificaciones VALUES
  ('sms_nuevo', 'AV-23', '04 §11.2'), ('sms_coincidencia', 'AV-23', '04 §11.2'),
  ('sms_posible_duplicado', 'AV-23', '04 §11.2'), ('sms_no_reconocido', 'AV-23', '04 §11.2'),
  ('sms_error', 'AV-23', '04 §11.2'), ('registro_automatico', 'AV-23', '04 §11.2'),
  ('registro_automatico_fallido', 'AV-23', '04 §11.2'), ('ocurrencia_en_periodo_cerrado', 'AV-23', '04 §11.2'),
  ('cierre_periodo', NULL, '04 §11.2'), ('meta_vencida', 'AV-17', '04 §11.2'),
  ('respaldo_atrasado', NULL, '04 §11.2'), ('restauracion_atrasada', NULL, '04 §11.2'),
  ('deriva_catalogo', NULL, '04 §11.2'), ('tarea_fallida', NULL, '04 §11.2'),
  ('carga_incremental', NULL, '04 §11.2'), ('cambio_retroactivo', 'AV-01', '04 §11.2, BE-38'),
  ('pago_tarjeta_proximo', NULL, '06 FD-22'), ('cuota_proxima', NULL, '06 CF-24');

CREATE TEMP TABLE catalogo_eventos (origen text, nivel finn.nivel_evento, mensaje text);
INSERT INTO catalogo_eventos VALUES
  ('app', 'error', 'INTERNO FN003 OP-20'), ('app', 'aviso', 'OCUPADO 55P03 OP-14'),
  ('app', 'info', 'auditoria_formato crear'), ('webhook', 'aviso', 'token_invalido'),
  ('webhook', 'aviso', 'cuerpo_invalido'), ('webhook', 'error', 'guardar_fallido'),
  ('webhook', 'error', 'procesar_fallido'), ('tarea_diaria', 'info', 'puesta_al_dia_inicio'),
  ('tarea_diaria', 'info', 'diaria'), ('tarea_diaria', 'info', 'puesta_al_dia'),
  ('tarea_diaria', 'error', 'paso_fallido'), ('motor', 'info', 'carga_completa'),
  ('motor', 'info', 'carga_incremental'), ('motor', 'aviso', 'memoria_invalidada'),
  ('respaldo', 'info', 'respaldo'), ('respaldo', 'info', 'restauracion'), ('respaldo', 'error', 'deriva');

CREATE OR REPLACE FUNCTION pg_temp.probar(etapa text) RETURNS TABLE (etapa_ text, tabla text, valor text, resultado text)
LANGUAGE plpgsql AS $$
DECLARE r record;
BEGIN
  FOR r IN SELECT * FROM catalogo_notificaciones LOOP
    BEGIN
      INSERT INTO finn.notificaciones (aviso, motivo, titulo, cuerpo) VALUES (r.aviso, r.motivo, 't', 'c');
      etapa_ := etapa; tabla := 'notificaciones'; valor := r.motivo; resultado := 'ok'; RETURN NEXT;
    EXCEPTION WHEN others THEN
      etapa_ := etapa; tabla := 'notificaciones'; valor := r.motivo; resultado := 'FALLA ' || SQLSTATE; RETURN NEXT;
    END;
  END LOOP;
  FOR r IN SELECT * FROM catalogo_eventos LOOP
    BEGIN
      INSERT INTO finn.eventos_sistema (nivel, origen, mensaje) VALUES (r.nivel, r.origen, r.mensaje);
      etapa_ := etapa; tabla := 'eventos_sistema'; valor := r.origen || ' ' || r.mensaje; resultado := 'ok'; RETURN NEXT;
    EXCEPTION WHEN others THEN
      etapa_ := etapa; tabla := 'eventos_sistema'; valor := r.origen || ' ' || r.mensaje; resultado := 'FALLA ' || SQLSTATE; RETURN NEXT;
    END;
  END LOOP;
  -- control negativo: un aviso mal formado debe seguir fallando
  BEGIN
    INSERT INTO finn.notificaciones (aviso, motivo, titulo, cuerpo) VALUES ('AV-1', 'x', 't', 'c');
    etapa_ := etapa; tabla := 'control'; valor := 'aviso AV-1'; resultado := 'ACEPTADO (mal)'; RETURN NEXT;
  EXCEPTION WHEN check_violation THEN
    etapa_ := etapa; tabla := 'control'; valor := 'aviso AV-1'; resultado := 'rechazado (bien)'; RETURN NEXT;
  END;
END $$;

\echo '== Antes de CF-16 =='
SELECT resultado, count(*), string_agg(valor, ', ' ORDER BY valor) FILTER (WHERE resultado <> 'ok' AND tabla <> 'control') AS que_falla
FROM pg_temp.probar('antes') GROUP BY resultado ORDER BY resultado;

-- CF-16: migración de expansión (03 §11.4). El CHECK existente ya acepta NULL.
ALTER TABLE finn.notificaciones ALTER COLUMN aviso DROP NOT NULL;

\echo '== Después de CF-16 =='
SELECT resultado, count(*), string_agg(valor, ', ' ORDER BY valor) FILTER (WHERE resultado <> 'ok' AND tabla <> 'control') AS que_falla
FROM pg_temp.probar('despues') GROUP BY resultado ORDER BY resultado;

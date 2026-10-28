-- finn:manual
-- CT-06 (07 §19.5, V7-14; portado de docs/anexos/07-pruebas-verificacion/.../pool04/marca.sql): marca local
-- de la transacción. finn.tomar_bloqueo() la pone con set_config(…, true), que no sobrevive al fin de la
-- transacción, y finn.tiene_bloqueo() la exige además del bloqueo en pg_locks. Detrás del pooler, un bloqueo
-- asesor de sesión olvidado puede quedar en la conexión, pero la marca no llega a la transacción de otro
-- cliente. El coalesce es el hallazgo del prototipo: sin marca, current_setting devuelve NULL y la
-- comparación NULL no rechazaría. Solo DDL de funciones: no escribe filas.
-- CREATE OR REPLACE conserva dueño (finn_migraciones) y privilegios (m_seguridad); firma, SECURITY DEFINER,
-- volatilidad y search_path son los de m_funciones (C6 los compara).
CREATE OR REPLACE FUNCTION finn.tomar_bloqueo() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  PERFORM set_config('lock_timeout', '10s', true);
  PERFORM pg_advisory_xact_lock(finn.clave_bloqueo());
  PERFORM set_config('finn.bloqueo_xact', pg_current_xact_id()::text, true);
END $$;

CREATE OR REPLACE FUNCTION finn.tiene_bloqueo() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT coalesce(current_setting('finn.bloqueo_xact', true), '') = pg_current_xact_id()::text
     AND EXISTS (SELECT 1 FROM pg_locks l WHERE l.locktype = 'advisory' AND l.pid = pg_backend_pid() AND l.granted
       AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
       AND l.classid = 0::oid AND l.objid = finn.clave_bloqueo()::oid AND l.objsubid = 1)
$$;

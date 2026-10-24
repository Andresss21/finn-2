-- Prototipo de la alternativa a REVOKE (V7-14 parte 2): tomar_bloqueo() deja una marca LOCAL de la transacción y
-- tiene_bloqueo() exige la marca además del bloqueo. Un SET LOCAL no sobrevive al fin de la transacción, así que detrás
-- de un pooler una conexión con un bloqueo de sesión olvidado no lleva la marca a otro cliente.
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

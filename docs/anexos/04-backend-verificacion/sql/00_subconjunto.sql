-- Subconjunto fiel de 03-base-de-datos.md para verificar el patrón de la Fase 4.
-- Funciones copiadas literalmente de 10.4.5; tablas reducidas en columnas.
CREATE ROLE finn_migraciones LOGIN NOINHERIT NOBYPASSRLS PASSWORD 'm';
CREATE ROLE finn_app LOGIN NOINHERIT BYPASSRLS PASSWORD 'a';
GRANT CREATE ON DATABASE finn TO finn_migraciones;
CREATE SCHEMA finn AUTHORIZATION finn_migraciones;
SET ROLE finn_migraciones;
SET search_path = finn;

CREATE FUNCTION finn.rechazar(p_codigo text, p_mensaje text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  RAISE EXCEPTION USING ERRCODE = p_codigo, MESSAGE = 'finn: ' || p_mensaje;
END $$;
CREATE FUNCTION finn.clave_bloqueo() RETURNS bigint
LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$ SELECT 1179209294::bigint $$;
CREATE FUNCTION finn.tomar_bloqueo() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  PERFORM set_config('lock_timeout', '10s', true);
  PERFORM pg_advisory_xact_lock(finn.clave_bloqueo());
END $$;
CREATE FUNCTION finn.tiene_bloqueo() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT EXISTS (SELECT 1 FROM pg_locks l WHERE l.locktype = 'advisory' AND l.pid = pg_backend_pid() AND l.granted
      AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
      AND l.classid = 0::oid AND l.objid = finn.clave_bloqueo()::oid AND l.objsubid = 1)
$$;
CREATE FUNCTION finn.hoy() RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE v text;
BEGIN
  IF EXISTS (SELECT 1 FROM pg_db_role_setting s JOIN pg_database d ON d.oid = s.setdatabase
       WHERE d.datname = current_database() AND s.setrole = 0 AND 'finn.reloj_simulado=on' = ANY (s.setconfig)) THEN
    v := current_setting('finn.hoy', true);
    IF v IS NOT NULL AND v <> '' THEN RETURN v::date; END IF;
  END IF;
  RETURN (now() AT TIME ZONE 'America/El_Salvador')::date;
END $$;
CREATE FUNCTION finn.operacion() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT nullif(current_setting('finn.operacion', true), '') $$;

CREATE TABLE finn.revision (id smallint PRIMARY KEY DEFAULT 1 CHECK (id = 1), valor bigint NOT NULL DEFAULT 0,
  ultima_transaccion bigint, revision_minima_incremental bigint NOT NULL DEFAULT 0);
INSERT INTO finn.revision VALUES (1, 0, NULL, 0);

-- transacciones reducida
CREATE TABLE finn.transacciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  fecha date NOT NULL,
  hora_registro timestamptz NOT NULL,
  clave_orden timestamptz NOT NULL,
  total integer NOT NULL CHECK (total > 0),
  comercio text,
  revision bigint NOT NULL DEFAULT 0);
CREATE TABLE finn.lineas (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  transaccion_id uuid NOT NULL REFERENCES finn.transacciones(id) ON DELETE CASCADE,
  orden smallint NOT NULL, monto integer NOT NULL CHECK (monto > 0),
  revision bigint NOT NULL DEFAULT 0, UNIQUE (transaccion_id, orden));
CREATE TABLE finn.asignaciones (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  categoria_id uuid NOT NULL, periodo_inicio date NOT NULL,
  monto integer NOT NULL CHECK (monto <> 0),
  revision bigint NOT NULL DEFAULT 0, UNIQUE (categoria_id, periodo_inicio));

CREATE FUNCTION finn.tg_exigir_bloqueo() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF NOT finn.tiene_bloqueo() THEN
    PERFORM finn.rechazar('FN001', format('escritura en %s sin el bloqueo global (ADR-06)', TG_TABLE_NAME));
  END IF;
  RETURN NULL;
END $$;
CREATE FUNCTION finn.tg_avanzar_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE x bigint := pg_current_xact_id()::text::bigint;
BEGIN
  UPDATE finn.revision SET valor = valor + 1, ultima_transaccion = x
   WHERE id = 1 AND ultima_transaccion IS DISTINCT FROM x;
  RETURN NULL;
END $$;
CREATE FUNCTION finn.tg_estampar_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN NEW.revision := (SELECT valor FROM finn.revision WHERE id = 1); RETURN NEW; END $$;

-- Regla inmediata tipo g_asignacion (FN002) y diferida tipo x_verificar_transaccion (FN003)
CREATE FUNCTION finn.tg_asignacion_reducida() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF NEW.periodo_inicio < date '2026-09-21' AND finn.operacion() IS DISTINCT FROM 'fusion' THEN
    PERFORM finn.rechazar('FN002', 'lo asignado en un período cerrado no cambia (inv. 18)');
  END IF;
  RETURN NEW;
END $$;
CREATE FUNCTION finn.tg_x_transaccion_reducida() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE v_id uuid; tot bigint; s bigint;
BEGIN
  -- IF en vez de CASE: plpgsql valida OLD.transaccion_id aunque la rama no aplique (falla en transacciones)
  IF TG_TABLE_NAME = 'transacciones' THEN v_id := NEW.id;
  ELSIF TG_OP = 'DELETE' THEN v_id := OLD.transaccion_id;
  ELSE v_id := NEW.transaccion_id; END IF;
  SELECT total INTO tot FROM finn.transacciones WHERE id = v_id;
  IF NOT FOUND THEN RETURN NULL; END IF;
  SELECT coalesce(sum(monto),0) INTO s FROM finn.lineas WHERE transaccion_id = v_id;
  IF s <> tot THEN
    PERFORM finn.rechazar('FN003', format('transacción %s: la suma de las líneas (%s) no es igual al total (%s) (inv. 6)', v_id, s, tot));
  END IF;
  RETURN NULL;
END $$;

DO $$ DECLARE t text; BEGIN
  FOREACH t IN ARRAY ARRAY['transacciones','lineas','asignaciones'] LOOP
    EXECUTE format('CREATE TRIGGER a_exigir_bloqueo BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON finn.%I FOR EACH STATEMENT EXECUTE FUNCTION finn.tg_exigir_bloqueo()', t);
    EXECUTE format('CREATE TRIGGER b_avanzar_revision BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON finn.%I FOR EACH STATEMENT EXECUTE FUNCTION finn.tg_avanzar_revision()', t);
    EXECUTE format('CREATE TRIGGER c_estampar_revision BEFORE INSERT OR UPDATE ON finn.%I FOR EACH ROW EXECUTE FUNCTION finn.tg_estampar_revision()', t);
  END LOOP;
END $$;
CREATE TRIGGER g_asignacion BEFORE INSERT OR UPDATE ON finn.asignaciones FOR EACH ROW EXECUTE FUNCTION finn.tg_asignacion_reducida();
CREATE CONSTRAINT TRIGGER x_verificar_transaccion AFTER INSERT OR UPDATE ON finn.transacciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_transaccion_reducida();
CREATE CONSTRAINT TRIGGER x_verificar_transaccion AFTER INSERT OR UPDATE OR DELETE ON finn.lineas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_transaccion_reducida();

ALTER TABLE finn.transacciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE finn.lineas ENABLE ROW LEVEL SECURITY;
ALTER TABLE finn.asignaciones ENABLE ROW LEVEL SECURITY;
ALTER TABLE finn.revision ENABLE ROW LEVEL SECURITY;
RESET ROLE;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA finn FROM PUBLIC;
GRANT USAGE ON SCHEMA finn TO finn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON finn.transacciones, finn.lineas, finn.asignaciones TO finn_app;
GRANT SELECT ON finn.revision TO finn_app;
GRANT EXECUTE ON FUNCTION finn.tomar_bloqueo(), finn.hoy() TO finn_app;

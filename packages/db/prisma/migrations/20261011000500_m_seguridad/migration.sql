-- prisma/migrations/20261011000500_m_seguridad/migration.sql
-- finn:manual
-- RLS sin políticas (8.1) y privilegios (8.3). Se parte de cero.

-- RLS en todas las tablas del esquema, incluida _prisma_migrations.
DO $$
DECLARE
  r record;
BEGIN
  FOR r IN SELECT c.relname FROM pg_class c JOIN pg_namespace n ON n.oid = c.relnamespace
           WHERE n.nspname = 'finn' AND c.relkind = 'r' LOOP
    EXECUTE format('ALTER TABLE finn.%I ENABLE ROW LEVEL SECURITY', r.relname);
  END LOOP;
END $$;

-- Cero privilegios para PUBLIC y para los roles de Supabase (si existen).
REVOKE ALL ON SCHEMA finn FROM PUBLIC;
REVOKE ALL ON ALL TABLES    IN SCHEMA finn FROM PUBLIC;
REVOKE ALL ON ALL SEQUENCES IN SCHEMA finn FROM PUBLIC;
REVOKE ALL ON ALL FUNCTIONS IN SCHEMA finn FROM PUBLIC;
DO $$
DECLARE
  rol text;
BEGIN
  FOREACH rol IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('REVOKE ALL ON SCHEMA finn FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL TABLES IN SCHEMA finn FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL SEQUENCES IN SCHEMA finn FROM %I', rol);
      EXECUTE format('REVOKE ALL ON ALL FUNCTIONS IN SCHEMA finn FROM %I', rol);
    END IF;
  END LOOP;
END $$;

GRANT USAGE ON SCHEMA finn TO finn_app, finn_respaldo;

-- finn_app: hechos [M] y [H] con escritura completa
GRANT SELECT, INSERT, UPDATE, DELETE ON
  finn.vigencias_ciclo, finn.cuentas, finn.tarjetas, finn.prestamos, finn.inversiones,
  finn.grupos, finn.categorias, finn.asignaciones, finn.deudores, finn.transacciones,
  finn.efectos, finn.lineas, finn.condonaciones, finn.metas, finn.programadas,
  finn.programada_lineas, finn.ocurrencias_resueltas,
  finn.instituciones, finn.movimientos, finn.movimiento_lineas, finn.formatos_bancarios,
  finn.reglas_comercio
TO finn_app;

-- finn_app: solo inserción. Las conciliaciones y sus cambios posteriores se eliminan
-- únicamente con finn.eliminar_conciliaciones_de_cuenta (HZ-1).
GRANT SELECT, INSERT ON finn.sms_recibidos, finn.sms_procesamientos, finn.conciliaciones, finn.cambios_posteriores TO finn_app;

-- finn_app: técnicas
GRANT SELECT ON finn.revision, finn.eliminaciones TO finn_app;
GRANT SELECT, INSERT, UPDATE, DELETE ON
  finn.suscripciones_push, finn.notificaciones, finn.eventos_sistema, finn.estado_respaldo, finn.token_webhook
TO finn_app;

-- secuencia_creacion: sin privilegios para la app; la usa el trigger c_asignar_secuencia (DB-21).
GRANT USAGE ON SEQUENCE finn.eventos_sistema_id_seq TO finn_app;
GRANT EXECUTE ON FUNCTION finn.tomar_bloqueo(), finn.hoy(), finn.eliminar_conciliaciones_de_cuenta(uuid) TO finn_app;

-- finn_respaldo: lectura de todo el esquema
GRANT SELECT ON ALL TABLES    IN SCHEMA finn TO finn_respaldo;
GRANT SELECT ON ALL SEQUENCES IN SCHEMA finn TO finn_respaldo;

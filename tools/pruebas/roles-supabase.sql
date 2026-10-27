-- tools/pruebas/roles-supabase.sql (TA-050; 07 §5.2, paso 2, y §5.3; DP-07)
-- Los roles que Supabase trae y el PostgreSQL de las pruebas no: `anon`, `authenticated` y
-- `service_role`, sin privilegios ni BYPASSRLS. Así `m_seguridad` ejecuta sus REVOKE como en
-- Supabase y las pruebas SEG tienen un rol sin BYPASSRLS. Solo pruebas: nunca en producción.
-- Lo corre el superusuario, después de tools/db/bootstrap.sql. Idempotente.

DO $$
DECLARE
  rol text;
BEGIN
  FOREACH rol IN ARRAY ARRAY['anon', 'authenticated', 'service_role'] LOOP
    IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = rol) THEN
      EXECUTE format('CREATE ROLE %I', rol);
    END IF;
    EXECUTE format(
      'ALTER ROLE %I NOLOGIN NOSUPERUSER NOCREATEDB NOCREATEROLE NOINHERIT NOREPLICATION NOBYPASSRLS',
      rol
    );
  END LOOP;
END $$;

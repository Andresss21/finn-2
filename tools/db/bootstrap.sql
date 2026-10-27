-- tools/db/bootstrap.sql
-- Fuera de Prisma. Se ejecuta UNA vez por base (producción, CI, local) con un
-- rol administrador: `postgres` en Supabase; el superusuario en CI y local.
-- Uso:
--   psql "$URL_ADMIN" -v ON_ERROR_STOP=1 \
--        -v clave_migraciones=... -v clave_app=... -v clave_respaldo=... \
--        -f tools/db/bootstrap.sql
-- Idempotente: se puede volver a ejecutar para rotar contraseñas.

SELECT current_database() AS base \gset

DO $$
BEGIN
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finn_migraciones') THEN
    CREATE ROLE finn_migraciones LOGIN NOINHERIT NOBYPASSRLS NOCREATEROLE NOCREATEDB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finn_app') THEN
    CREATE ROLE finn_app LOGIN NOINHERIT BYPASSRLS NOCREATEROLE NOCREATEDB;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM pg_roles WHERE rolname = 'finn_respaldo') THEN
    CREATE ROLE finn_respaldo LOGIN NOINHERIT BYPASSRLS NOCREATEROLE NOCREATEDB;
  END IF;
END $$;

-- Atributos (se reafirman en cada ejecución; P3-3, 8.2)
ALTER ROLE finn_migraciones LOGIN NOINHERIT NOBYPASSRLS NOCREATEROLE NOCREATEDB PASSWORD :'clave_migraciones';
ALTER ROLE finn_app         LOGIN NOINHERIT BYPASSRLS   NOCREATEROLE NOCREATEDB PASSWORD :'clave_app';
ALTER ROLE finn_respaldo    LOGIN NOINHERIT BYPASSRLS   NOCREATEROLE NOCREATEDB PASSWORD :'clave_respaldo';
ALTER ROLE finn_respaldo SET default_transaction_read_only = on;
-- _prisma_migrations se crea sin esquema explícito: debe quedar en finn (8.1, 12).
ALTER ROLE finn_migraciones SET search_path = finn;

-- Conexión a la base
GRANT CONNECT ON DATABASE :"base" TO finn_migraciones, finn_app, finn_respaldo;
-- La migración generada por Prisma incluye CREATE SCHEMA IF NOT EXISTS "finn", y
-- PostgreSQL exige CREATE sobre la base aunque el esquema ya exista.
GRANT CREATE ON DATABASE :"base" TO finn_migraciones;

-- Esquema propio, propiedad de finn_migraciones (DB-01).
-- La prueba de restauración (12) ejecuta el bootstrap con -v solo_roles=1: el
-- esquema lo crea el propio volcado.
\if :{?solo_roles}
\else
CREATE SCHEMA IF NOT EXISTS finn AUTHORIZATION finn_migraciones;
ALTER SCHEMA finn OWNER TO finn_migraciones;
REVOKE ALL ON SCHEMA finn FROM PUBLIC;
\endif

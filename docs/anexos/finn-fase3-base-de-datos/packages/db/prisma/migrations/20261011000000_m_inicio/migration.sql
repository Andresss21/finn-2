-- prisma/migrations/20261011000000_m_inicio/migration.sql
-- finn:manual
-- Objetos que la migración generada necesita y que Prisma no representa.

CREATE SCHEMA IF NOT EXISTS finn;

-- Las funciones nuevas de finn_migraciones no reciben EXECUTE para PUBLIC (8.3).
ALTER DEFAULT PRIVILEGES REVOKE EXECUTE ON FUNCTIONS FROM PUBLIC;

-- Secuencia de creación común a transacciones y condonaciones (5.4, CB-21, S3-2).
CREATE SEQUENCE finn.secuencia_creacion AS bigint START 1 NO CYCLE;

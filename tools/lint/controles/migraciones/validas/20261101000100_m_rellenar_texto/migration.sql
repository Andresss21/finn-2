-- prisma/migrations/20261101000100_m_rellenar_texto/migration.sql
-- finn:manual
SET LOCAL lock_timeout = '5s';
SELECT finn.tomar_bloqueo();
UPDATE finn.notas SET texto = '' WHERE texto IS NULL;

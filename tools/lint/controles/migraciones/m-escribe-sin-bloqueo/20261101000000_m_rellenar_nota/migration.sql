-- prisma/migrations/20261101000000_m_rellenar_nota/migration.sql
-- finn:manual
UPDATE finn.cuentas SET nota = '' WHERE nota IS NULL;

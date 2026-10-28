-- prisma/migrations/20261101000000_m_rellenar_nota/migration.sql
-- finn:manual
-- CH-23: el bloqueo como sentencia suelta ya no existe cuando llega el UPDATE (migrate deploy, FN001).
SELECT finn.tomar_bloqueo();
UPDATE finn.cuentas SET nota = '' WHERE nota IS NULL;

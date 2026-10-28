-- prisma/migrations/20261101000000_m_rellenar_nota/migration.sql
-- finn:manual
-- CH-23: dentro del DO, pero el bloqueo llega después de la escritura.
DO $$
BEGIN
  UPDATE finn.cuentas SET nota = '' WHERE nota IS NULL;
  PERFORM finn.tomar_bloqueo();
END $$;

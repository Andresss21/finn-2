BEGIN;
SET ROLE finn_migraciones;
CREATE SEQUENCE finn.secuencia_creacion AS bigint START 1 NO CYCLE;
ALTER TABLE finn.transacciones ADD COLUMN secuencia bigint;
CREATE FUNCTION finn.tg_asignar_secuencia() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN NEW.secuencia := nextval('finn.secuencia_creacion'); RETURN NEW; END $$;
CREATE TRIGGER c_asignar_secuencia BEFORE INSERT ON finn.transacciones FOR EACH ROW EXECUTE FUNCTION finn.tg_asignar_secuencia();
SELECT finn.tomar_bloqueo();
UPDATE finn.transacciones SET secuencia = nextval('finn.secuencia_creacion');
SET CONSTRAINTS ALL IMMEDIATE;
ALTER TABLE finn.transacciones ALTER COLUMN secuencia SET NOT NULL;
ALTER TABLE finn.transacciones ADD CONSTRAINT ux_transacciones_secuencia UNIQUE (secuencia);
COMMIT;

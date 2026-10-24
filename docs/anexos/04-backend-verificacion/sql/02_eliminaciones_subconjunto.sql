-- Subconjunto de 03 para probar EN-2: tabla eliminaciones y su trigger y privilegios, como en 03 §3.28, §5.3 y §8.3.
SET ROLE finn_migraciones;
CREATE TABLE finn.eliminaciones (
  id bigserial PRIMARY KEY, tabla text NOT NULL, fila_id uuid NOT NULL,
  revision bigint NOT NULL, eliminada_en timestamptz NOT NULL DEFAULT now());
CREATE INDEX ix_eliminaciones_revision ON finn.eliminaciones (revision);
COMMENT ON TABLE finn.eliminaciones IS 'finn:clase=T';
ALTER TABLE finn.eliminaciones ENABLE ROW LEVEL SECURITY;
CREATE FUNCTION finn.tg_registrar_eliminacion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  INSERT INTO finn.eliminaciones (tabla, fila_id, revision)
  VALUES (TG_TABLE_NAME, (to_jsonb(OLD) ->> TG_ARGV[0])::uuid, (SELECT valor FROM finn.revision WHERE id = 1));
  RETURN NULL;
END $$;
CREATE TRIGGER y_registrar_eliminacion AFTER DELETE ON finn.asignaciones FOR EACH ROW EXECUTE FUNCTION finn.tg_registrar_eliminacion('id');
RESET ROLE;
REVOKE ALL ON finn.eliminaciones FROM PUBLIC;
GRANT SELECT ON finn.eliminaciones TO finn_app;
REVOKE ALL ON FUNCTION finn.tg_registrar_eliminacion() FROM PUBLIC;

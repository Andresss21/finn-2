-- finn:manual
-- Respaldo b) de P7-12 (07 §32.1; CT-02, CH-24; TA-157): las 9 columnas de instantes técnicos conservan su
-- DEFAULT now() y se escriben siempre explícitamente con finn.ahora() (03, enmienda CT-02). La aplicación lo
-- hace con ahoraDb() y L21; eliminaciones.eliminada_en no la escribe la aplicación (finn_app solo tiene SELECT)
-- sino este trigger, que hasta aquí tomaba el DEFAULT. Solo DDL de una función: no escribe filas.
-- CREATE OR REPLACE conserva dueño y privilegios; firma, SECURITY DEFINER y search_path son los de
-- m_funciones (C6 los compara).
CREATE OR REPLACE FUNCTION finn.tg_registrar_eliminacion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  INSERT INTO finn.eliminaciones (tabla, fila_id, revision, eliminada_en)
  VALUES (TG_TABLE_NAME, (to_jsonb(OLD) ->> TG_ARGV[0])::uuid, (SELECT valor FROM finn.revision WHERE id = 1),
          finn.ahora());
  RETURN NULL;
END $$;

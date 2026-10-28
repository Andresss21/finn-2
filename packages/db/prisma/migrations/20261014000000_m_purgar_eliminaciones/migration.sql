-- prisma/migrations/20261014000000_m_purgar_eliminaciones/migration.sql
-- finn:manual
-- EN-2 (enmienda de 03 §5.3, §8.3 y DB-11; aprobada en la revisión de la Parte C, QC-4).
-- Única vía para purgar finn.eliminaciones: la tarea diaria corre como finn_app, que solo
-- tiene SELECT sobre eliminaciones y revision. Plazo fijo de 30 días, sin parámetro.
-- Sigue el patrón de finn.eliminar_conciliaciones_de_cuenta (HZ-1): SECURITY DEFINER,
-- propiedad de finn_migraciones, search_path fijo, EXECUTE solo para finn_app.

CREATE FUNCTION finn.purgar_eliminaciones() RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  v_max bigint;
  n     integer;
BEGIN
  -- Borra las filas de más de 30 días y obtiene la mayor revisión borrada.
  WITH borradas AS (
    DELETE FROM finn.eliminaciones
    WHERE eliminada_en < now() - interval '30 days'
    RETURNING revision
  )
  SELECT count(*), max(revision) INTO n, v_max FROM borradas;

  -- 03 §5.3: una instancia con revisión memorizada menor que la mayor revisión
  -- purgada + 1 debe recargar todo. Nunca se reduce el valor.
  IF v_max IS NOT NULL THEN
    UPDATE finn.revision
       SET revision_minima_incremental = greatest(revision_minima_incremental, v_max + 1)
     WHERE id = 1;
  END IF;
  RETURN n;
END $$;

ALTER FUNCTION finn.purgar_eliminaciones() OWNER TO finn_migraciones;
REVOKE ALL ON FUNCTION finn.purgar_eliminaciones() FROM PUBLIC;
GRANT EXECUTE ON FUNCTION finn.purgar_eliminaciones() TO finn_app;

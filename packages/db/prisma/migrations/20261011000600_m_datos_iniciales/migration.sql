-- prisma/migrations/20261011000600_m_datos_iniciales/migration.sql
-- finn:manual
-- Datos iniciales (sección 9), idempotentes, por los mismos triggers que la app (DB-18).

INSERT INTO finn.estado_respaldo (id) VALUES (1) ON CONFLICT (id) DO NOTHING;

DO $$
DECLARE
  v_bac uuid;
  v_ba  uuid;
  v_cus uuid;
BEGIN
  PERFORM finn.tomar_bloqueo();

  -- 9.2 Vigencia del ciclo
  IF NOT EXISTS (SELECT 1 FROM finn.vigencias_ciclo) THEN
    INSERT INTO finn.vigencias_ciclo (dia_inicio, rige_desde) VALUES (21, NULL);
  END IF;

  -- 9.3 Grupo del sistema
  INSERT INTO finn.grupos (nombre, orden, archivado, clave_sistema)
  VALUES ('Pagos de tarjeta', 0, false, 'pagos_tarjeta')
  ON CONFLICT (clave_sistema) DO NOTHING;

  -- 9.4 Instituciones
  INSERT INTO finn.instituciones (nombre) VALUES ('BAC'), ('Banco Agrícola'), ('Cuscatlán')
  ON CONFLICT ((lower(nombre))) DO NOTHING;
  SELECT id INTO v_bac FROM finn.instituciones WHERE lower(nombre) = 'bac';
  SELECT id INTO v_ba  FROM finn.instituciones WHERE lower(nombre) = 'banco agrícola';
  SELECT id INTO v_cus FROM finn.instituciones WHERE lower(nombre) = 'cuscatlán';

  -- 9.5 Formatos bancarios (⚠ validar con SMS reales)
  INSERT INTO finn.formatos_bancarios
    (institucion_id, nombre, tipo_movimiento, patron, banderas, monto_separador_miles, monto_separador_decimal, formatos_fecha)
  VALUES
    (v_bac, 'BAC compra', 'compra',
     '(?:MASTERCARD|VISA)\s+(?<ultimos4>\d{4}):\s+has realizado una compra por USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})',
     'i', ',', '.', ARRAY['AAAA/MM/DD', 'AAAAMMDD']),
    (v_ba, 'Banco Agrícola compra', 'compra',
     '\((?<ultimos4>\d{4})\).*?USD\s*(?<monto>[\d,]+\.?\d*)\s+en el comercio:?\s+(?<comercio>.+?)\s+(?<fecha>\d{4}\/\d{2}\/\d{2}|\d{8})',
     'i', ',', '.', ARRAY['AAAA/MM/DD', 'AAAAMMDD']),
    (v_cus, 'Cuscatlán compra', 'compra',
     'Titular\s+(?<ultimos4>\d{4})\s+por\s+USD(?<monto>[\d,]+\.?\d*)\s+en\s+(?<comercio>.+?)\s+el\s+(?<fecha>\d{4}-\d{2}-\d{2})',
     'i', ',', '.', ARRAY['AAAA-MM-DD'])
  ON CONFLICT (institucion_id, nombre) DO NOTHING;
END $$;

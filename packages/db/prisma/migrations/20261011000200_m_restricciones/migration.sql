-- prisma/migrations/20261011000200_m_restricciones/migration.sql
-- finn:manual
-- CHECK, índices únicos de expresión (DB-09) y comentarios de clase (0.4).
-- Prefijos: ck_ (CHECK), ux_ (único), ix_ (índice).

-- ── Tiempo ───────────────────────────────────────────────────────────────
ALTER TABLE finn.vigencias_ciclo
  ADD CONSTRAINT ck_vigencias_dia CHECK (dia_inicio BETWEEN 1 AND 31);

-- ── Cuentas ──────────────────────────────────────────────────────────────
ALTER TABLE finn.instituciones
  ADD CONSTRAINT ck_instituciones_nombre CHECK (nombre = btrim(nombre) AND nombre <> '');
CREATE UNIQUE INDEX ux_instituciones_nombre ON finn.instituciones (lower(nombre));

ALTER TABLE finn.cuentas
  ADD CONSTRAINT ck_cuentas_nombre   CHECK (nombre = btrim(nombre) AND nombre <> ''),
  ADD CONSTRAINT ck_cuentas_ultimos4 CHECK (ultimos4 ~ '^[0-9]{4}$');

ALTER TABLE finn.tarjetas
  ADD CONSTRAINT ck_tarjetas_tipo      CHECK (tipo = 'tarjeta'),
  ADD CONSTRAINT ck_tarjetas_limite    CHECK (limite_credito > 0),
  ADD CONSTRAINT ck_tarjetas_tasa      CHECK (tasa_anual_millonesimas >= 0),
  ADD CONSTRAINT ck_tarjetas_dia_corte CHECK (dia_corte BETWEEN 1 AND 31),
  ADD CONSTRAINT ck_tarjetas_dia_pago  CHECK (dia_pago BETWEEN 1 AND 31),
  ADD CONSTRAINT ck_tarjetas_color     CHECK (color ~ '^#[0-9A-F]{6}$');

ALTER TABLE finn.prestamos
  ADD CONSTRAINT ck_prestamos_tipo           CHECK (tipo = 'prestamo'),
  ADD CONSTRAINT ck_prestamos_contraparte    CHECK (contraparte = btrim(contraparte) AND contraparte <> ''),
  ADD CONSTRAINT ck_prestamos_monto_original CHECK (monto_original > 0),
  ADD CONSTRAINT ck_prestamos_tasa           CHECK (tasa_nominal_anual_millonesimas >= 0),
  ADD CONSTRAINT ck_prestamos_seguro         CHECK (seguro_primer_mes >= 0),
  ADD CONSTRAINT ck_prestamos_comision       CHECK (comision >= 0),
  ADD CONSTRAINT ck_prestamos_frecuencia     CHECK ((frecuencia = 'cada_n_dias') = (frecuencia_dias IS NOT NULL)),
  ADD CONSTRAINT ck_prestamos_frecuencia_dias CHECK (frecuencia_dias > 0),
  ADD CONSTRAINT ck_prestamos_cuota          CHECK (cuota_pactada > 0),
  ADD CONSTRAINT ck_prestamos_plazo          CHECK (plazo_cuotas > 0),
  ADD CONSTRAINT ck_prestamos_cuotas_pagadas CHECK (cuotas_pagadas_al_crear BETWEEN 0 AND plazo_cuotas);

ALTER TABLE finn.inversiones
  ADD CONSTRAINT ck_inversiones_tipo        CHECK (tipo = 'inversion'),
  ADD CONSTRAINT ck_inversiones_rendimiento CHECK (rendimiento_anual_esperado_millonesimas >= 0);

-- ── Presupuesto ──────────────────────────────────────────────────────────
ALTER TABLE finn.grupos
  ADD CONSTRAINT ck_grupos_nombre        CHECK (nombre = btrim(nombre) AND nombre <> ''),
  ADD CONSTRAINT ck_grupos_clave_sistema CHECK (clave_sistema IN ('pagos_tarjeta'));
CREATE UNIQUE INDEX ux_grupos_nombre ON finn.grupos (lower(nombre));

ALTER TABLE finn.categorias
  ADD CONSTRAINT ck_categorias_nombre        CHECK (nombre = btrim(nombre) AND nombre <> ''),
  ADD CONSTRAINT ck_categorias_clase_tarjeta CHECK ((clase = 'pago') = (tarjeta_id IS NOT NULL));
CREATE UNIQUE INDEX ux_categorias_grupo_nombre ON finn.categorias (grupo_id, lower(nombre));

ALTER TABLE finn.asignaciones
  ADD CONSTRAINT ck_asignaciones_monto CHECK (monto <> 0);

ALTER TABLE finn.deudores
  ADD CONSTRAINT ck_deudores_nombre CHECK (nombre = btrim(nombre) AND nombre <> '');
CREATE UNIQUE INDEX ux_deudores_nombre ON finn.deudores (lower(nombre));

-- ── Transacciones ────────────────────────────────────────────────────────
ALTER TABLE finn.transacciones
  ADD CONSTRAINT ck_transacciones_total          CHECK (total > 0),
  ADD CONSTRAINT ck_transacciones_comercio       CHECK (comercio = btrim(comercio) AND comercio <> ''),
  ADD CONSTRAINT ck_transacciones_moneda         CHECK (moneda_original ~ '^[A-Z]{3}$'),
  ADD CONSTRAINT ck_transacciones_moneda_par     CHECK ((moneda_original IS NULL) = (monto_original IS NULL)),
  ADD CONSTRAINT ck_transacciones_monto_original CHECK (monto_original > 0),
  ADD CONSTRAINT ck_transacciones_cobro          CHECK ((tipo = 'cobro') = (linea_cobrada_id IS NOT NULL)),
  ADD CONSTRAINT ck_transacciones_conciliada     CHECK ((estado_bancario = 'conciliada') = (conciliacion_id IS NOT NULL));

ALTER TABLE finn.efectos
  ADD CONSTRAINT ck_efectos_monto       CHECK (monto <> 0 OR coalesce(interes, 0) + coalesce(seguro, 0) > 0),
  ADD CONSTRAINT ck_efectos_interes     CHECK (interes >= 0),
  ADD CONSTRAINT ck_efectos_seguro      CHECK (seguro >= 0),
  ADD CONSTRAINT ck_efectos_desglose    CHECK ((interes IS NULL) = (seguro IS NULL));

ALTER TABLE finn.lineas
  ADD CONSTRAINT ck_lineas_orden   CHECK (orden >= 1),
  ADD CONSTRAINT ck_lineas_monto   CHECK (monto > 0),
  ADD CONSTRAINT ck_lineas_destino CHECK (num_nonnulls(categoria_id, deudor_id, linea_original_id) = 1);

ALTER TABLE finn.condonaciones
  ADD CONSTRAINT ck_condonaciones_monto CHECK (monto > 0);

-- ── Metas ────────────────────────────────────────────────────────────────
ALTER TABLE finn.metas
  ADD CONSTRAINT ck_metas_monto          CHECK (monto > 0),
  ADD CONSTRAINT ck_metas_modo           CHECK ((tipo IN ('mensual', 'semanal')) = (modo IS NOT NULL)),
  ADD CONSTRAINT ck_metas_fecha_para     CHECK (tipo <> 'para_fecha' OR fecha_objetivo IS NOT NULL),
  ADD CONSTRAINT ck_metas_fecha_periodo  CHECK (tipo NOT IN ('mensual', 'semanal') OR fecha_objetivo IS NULL);

-- ── Revisión ─────────────────────────────────────────────────────────────
ALTER TABLE finn.sms_recibidos
  ADD CONSTRAINT ck_sms_texto     CHECK (char_length(texto) BETWEEN 1 AND 2000),
  ADD CONSTRAINT ck_sms_remitente CHECK (remitente <> '');

ALTER TABLE finn.sms_procesamientos
  ADD CONSTRAINT ck_procesamientos_intento     CHECK (intento >= 1),
  ADD CONSTRAINT ck_procesamientos_error       CHECK ((resultado = 'error') = (error_detalle IS NOT NULL)),
  ADD CONSTRAINT ck_procesamientos_formato     CHECK (
        (formato_id IS NULL AND cardinality(formatos_coincidentes) <> 1)
     OR (formato_id IS NOT NULL AND cardinality(formatos_coincidentes) = 1 AND formato_id = formatos_coincidentes[1])),
  ADD CONSTRAINT ck_procesamientos_varios      CHECK (cardinality(formatos_coincidentes) <= 1 OR resultado = 'no_reconocido'),
  ADD CONSTRAINT ck_procesamientos_tipo        CHECK (formato_id IS NULL OR tipo_movimiento IS NOT NULL),
  ADD CONSTRAINT ck_procesamientos_ultimos4    CHECK (ultimos4 ~ '^[0-9]{4}$'),
  ADD CONSTRAINT ck_procesamientos_monto       CHECK (monto > 0),
  ADD CONSTRAINT ck_procesamientos_esperada    CHECK ((esperada_programada_id IS NULL) = (esperada_fecha IS NULL)),
  ADD CONSTRAINT ck_procesamientos_duplicado   CHECK (num_nonnulls(duplicado_transaccion_id, duplicado_movimiento_id) <= 1);

ALTER TABLE finn.movimientos
  ADD CONSTRAINT ck_movimientos_aprobado      CHECK ((estado = 'aprobado') = (transaccion_id IS NOT NULL)),
  ADD CONSTRAINT ck_movimientos_coincidencia  CHECK (estado <> 'con_coincidencia' OR esperada_programada_id IS NOT NULL),
  ADD CONSTRAINT ck_movimientos_dup_estado    CHECK (estado <> 'posible_duplicado' OR num_nonnulls(duplicado_transaccion_id, duplicado_movimiento_id) = 1),
  ADD CONSTRAINT ck_movimientos_duplicado     CHECK (num_nonnulls(duplicado_transaccion_id, duplicado_movimiento_id) <= 1),
  ADD CONSTRAINT ck_movimientos_esperada      CHECK ((esperada_programada_id IS NULL) = (esperada_fecha IS NULL)),
  ADD CONSTRAINT ck_movimientos_monto         CHECK (monto > 0);

ALTER TABLE finn.movimiento_lineas
  ADD CONSTRAINT ck_movimiento_lineas_orden   CHECK (orden >= 1),
  ADD CONSTRAINT ck_movimiento_lineas_monto   CHECK (monto > 0),
  ADD CONSTRAINT ck_movimiento_lineas_destino CHECK (num_nonnulls(categoria_id, deudor_id, linea_original_id) <= 1);

ALTER TABLE finn.formatos_bancarios
  ADD CONSTRAINT ck_formatos_nombre      CHECK (nombre = btrim(nombre) AND nombre <> ''),
  -- Dos CHECK separados: un BETWEEN dentro de un AND se reescribe distinto tras pg_restore (10.5).
  ADD CONSTRAINT ck_formatos_patron      CHECK (char_length(patron) BETWEEN 1 AND 1000),
  ADD CONSTRAINT ck_formatos_grupos      CHECK (position('(?<ultimos4>' IN patron) > 0 AND position('(?<monto>' IN patron) > 0),
  ADD CONSTRAINT ck_formatos_banderas    CHECK (banderas ~ '^i?m?s?u?$'),
  ADD CONSTRAINT ck_formatos_miles       CHECK (monto_separador_miles IN (',', '.', '')),
  ADD CONSTRAINT ck_formatos_decimal     CHECK (monto_separador_decimal IN ('.', ',')),
  ADD CONSTRAINT ck_formatos_separadores CHECK (monto_separador_miles <> monto_separador_decimal),
  ADD CONSTRAINT ck_formatos_fecha       CHECK (formatos_fecha <@ ARRAY['AAAA/MM/DD', 'AAAAMMDD', 'AAAA-MM-DD', 'DD/MM/AAAA']::text[]),
  ADD CONSTRAINT ck_formatos_fecha_grupo CHECK ((position('(?<fecha>' IN patron) > 0) = (cardinality(formatos_fecha) > 0));

ALTER TABLE finn.reglas_comercio
  ADD CONSTRAINT ck_reglas_patron CHECK (patron = btrim(patron) AND patron <> '');
CREATE UNIQUE INDEX ux_reglas_patron ON finn.reglas_comercio (lower(patron));

-- ── Programadas ──────────────────────────────────────────────────────────
ALTER TABLE finn.programadas
  ADD CONSTRAINT ck_programadas_comercio        CHECK (comercio = btrim(comercio) AND comercio <> ''),
  ADD CONSTRAINT ck_programadas_monto           CHECK (monto > 0),
  ADD CONSTRAINT ck_programadas_tolerancia      CHECK (tolerancia >= 0),
  ADD CONSTRAINT ck_programadas_frecuencia      CHECK ((frecuencia = 'cada_n_dias') = (frecuencia_dias IS NOT NULL)),
  ADD CONSTRAINT ck_programadas_frecuencia_dias CHECK (frecuencia_dias > 0),
  ADD CONSTRAINT ck_programadas_fecha_fin       CHECK (fecha_fin >= primera_fecha),
  ADD CONSTRAINT ck_programadas_destino         CHECK ((tipo = 'gasto') = (cuenta_destino_id IS NULL)),
  ADD CONSTRAINT ck_programadas_destino_distinto CHECK (cuenta_destino_id <> cuenta_id);

ALTER TABLE finn.programada_lineas
  ADD CONSTRAINT ck_programada_lineas_orden CHECK (orden >= 1),
  ADD CONSTRAINT ck_programada_lineas_monto CHECK (monto > 0);

ALTER TABLE finn.ocurrencias_resueltas
  ADD CONSTRAINT ck_ocurrencias_transaccion CHECK ((estado = 'omitida') = (transaccion_id IS NULL));

-- ── Conciliación ─────────────────────────────────────────────────────────
ALTER TABLE finn.cambios_posteriores
  ADD CONSTRAINT ck_cambios_motivos CHECK (cardinality(motivos) >= 1),
  ADD CONSTRAINT ck_cambios_monto   CHECK (monto_efecto <> 0);

-- ── Técnicas ─────────────────────────────────────────────────────────────
ALTER TABLE finn.revision
  ADD CONSTRAINT ck_revision_fila  CHECK (id = 1),
  ADD CONSTRAINT ck_revision_valor CHECK (valor >= 0);
ALTER TABLE finn.estado_respaldo
  ADD CONSTRAINT ck_estado_respaldo_fila CHECK (id = 1);
ALTER TABLE finn.token_webhook
  ADD CONSTRAINT ck_token_fila CHECK (id = 1),
  ADD CONSTRAINT ck_token_hash CHECK (hash_sha256 ~ '^[0-9a-f]{64}$');
ALTER TABLE finn.suscripciones_push
  ADD CONSTRAINT ck_suscripciones_endpoint CHECK (endpoint LIKE 'https://%');
ALTER TABLE finn.notificaciones
  ADD CONSTRAINT ck_notificaciones_aviso  CHECK (aviso ~ '^AV-[0-9]{2}$'),
  ADD CONSTRAINT ck_notificaciones_motivo CHECK (motivo = btrim(motivo) AND motivo <> '');
ALTER TABLE finn.eventos_sistema
  ADD CONSTRAINT ck_eventos_origen CHECK (origen IN ('webhook', 'tarea_diaria', 'motor', 'respaldo', 'app'));

-- ── Clase de cada tabla (0.4). La leen las verificaciones de catálogo (11.6) ──
COMMENT ON TABLE finn.vigencias_ciclo        IS 'finn:clase=M';
COMMENT ON TABLE finn.cuentas                IS 'finn:clase=M';
COMMENT ON TABLE finn.tarjetas               IS 'finn:clase=M';
COMMENT ON TABLE finn.prestamos              IS 'finn:clase=M';
COMMENT ON TABLE finn.inversiones            IS 'finn:clase=M';
COMMENT ON TABLE finn.grupos                 IS 'finn:clase=M';
COMMENT ON TABLE finn.categorias             IS 'finn:clase=M';
COMMENT ON TABLE finn.asignaciones           IS 'finn:clase=M';
COMMENT ON TABLE finn.deudores               IS 'finn:clase=M';
COMMENT ON TABLE finn.transacciones          IS 'finn:clase=M';
COMMENT ON TABLE finn.efectos                IS 'finn:clase=M';
COMMENT ON TABLE finn.lineas                 IS 'finn:clase=M';
COMMENT ON TABLE finn.condonaciones          IS 'finn:clase=M';
COMMENT ON TABLE finn.metas                  IS 'finn:clase=M';
COMMENT ON TABLE finn.programadas            IS 'finn:clase=M';
COMMENT ON TABLE finn.programada_lineas      IS 'finn:clase=M';
COMMENT ON TABLE finn.ocurrencias_resueltas  IS 'finn:clase=M';
COMMENT ON TABLE finn.conciliaciones         IS 'finn:clase=M';
COMMENT ON TABLE finn.instituciones          IS 'finn:clase=H';
COMMENT ON TABLE finn.movimientos            IS 'finn:clase=H';
COMMENT ON TABLE finn.movimiento_lineas      IS 'finn:clase=H';
COMMENT ON TABLE finn.formatos_bancarios     IS 'finn:clase=H';
COMMENT ON TABLE finn.reglas_comercio        IS 'finn:clase=H';
COMMENT ON TABLE finn.cambios_posteriores    IS 'finn:clase=H';
COMMENT ON TABLE finn.sms_recibidos          IS 'finn:clase=I';
COMMENT ON TABLE finn.sms_procesamientos     IS 'finn:clase=I';
COMMENT ON TABLE finn.revision               IS 'finn:clase=T';
COMMENT ON TABLE finn.eliminaciones          IS 'finn:clase=T';
COMMENT ON TABLE finn.suscripciones_push     IS 'finn:clase=T';
COMMENT ON TABLE finn.notificaciones         IS 'finn:clase=T';
COMMENT ON TABLE finn.eventos_sistema        IS 'finn:clase=T';
COMMENT ON TABLE finn.estado_respaldo        IS 'finn:clase=T';
COMMENT ON TABLE finn.token_webhook          IS 'finn:clase=T';

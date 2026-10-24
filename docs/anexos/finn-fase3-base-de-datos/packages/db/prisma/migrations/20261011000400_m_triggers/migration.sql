-- prisma/migrations/20261011000400_m_triggers/migration.sql
-- finn:manual
-- Catálogo de triggers de 4.3. El prefijo fija el orden entre triggers del mismo evento.

-- Fila única de revisión, antes de crear los triggers que la usan (9.1).
INSERT INTO finn.revision (id, valor, ultima_transaccion, revision_minima_incremental)
VALUES (1, 0, NULL, 0)
ON CONFLICT (id) DO NOTHING;

-- ── Concurrencia y revisión (5.2, 5.3, 5.5) ──────────────────────────────
DO $$
DECLARE
  -- [M] tabla → columna de clave primaria
  m CONSTANT text[][] := ARRAY[
    ['vigencias_ciclo', 'id'], ['cuentas', 'id'], ['tarjetas', 'cuenta_id'], ['prestamos', 'cuenta_id'],
    ['inversiones', 'cuenta_id'], ['grupos', 'id'], ['categorias', 'id'], ['asignaciones', 'id'],
    ['deudores', 'id'], ['transacciones', 'id'], ['efectos', 'id'], ['lineas', 'id'],
    ['condonaciones', 'id'], ['metas', 'id'], ['programadas', 'id'], ['programada_lineas', 'id'],
    ['ocurrencias_resueltas', 'id'], ['conciliaciones', 'id']];
  h CONSTANT text[] := ARRAY['instituciones', 'movimientos', 'movimiento_lineas', 'formatos_bancarios',
                             'reglas_comercio', 'cambios_posteriores'];
  i int;
  t text;
BEGIN
  FOR i IN 1 .. array_length(m, 1) LOOP
    t := m[i][1];
    EXECUTE format('CREATE TRIGGER a_exigir_bloqueo BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON finn.%I
                    FOR EACH STATEMENT EXECUTE FUNCTION finn.tg_exigir_bloqueo()', t);
    EXECUTE format('CREATE TRIGGER b_avanzar_revision BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON finn.%I
                    FOR EACH STATEMENT EXECUTE FUNCTION finn.tg_avanzar_revision()', t);
    EXECUTE format('CREATE TRIGGER c_estampar_revision BEFORE INSERT OR UPDATE ON finn.%I
                    FOR EACH ROW EXECUTE FUNCTION finn.tg_estampar_revision()', t);
    EXECUTE format('CREATE TRIGGER y_registrar_eliminacion AFTER DELETE ON finn.%I
                    FOR EACH ROW EXECUTE FUNCTION finn.tg_registrar_eliminacion(%L)', t, m[i][2]);
  END LOOP;
  FOREACH t IN ARRAY h LOOP
    EXECUTE format('CREATE TRIGGER a_exigir_bloqueo BEFORE INSERT OR UPDATE OR DELETE OR TRUNCATE ON finn.%I
                    FOR EACH STATEMENT EXECUTE FUNCTION finn.tg_exigir_bloqueo()', t);
  END LOOP;
END $$;

-- ── Secuencia de creación (5.4) ──────────────────────────────────────────
CREATE TRIGGER c_asignar_secuencia BEFORE INSERT ON finn.transacciones FOR EACH ROW EXECUTE FUNCTION finn.tg_asignar_secuencia();
CREATE TRIGGER c_asignar_secuencia BEFORE INSERT ON finn.condonaciones FOR EACH ROW EXECUTE FUNCTION finn.tg_asignar_secuencia();

-- ── Inmutables (4.5.5) ───────────────────────────────────────────────────
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.cuentas               FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('tipo');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.tarjetas              FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('cuenta_id', 'tipo');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.prestamos             FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('cuenta_id', 'tipo');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.inversiones           FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('cuenta_id', 'tipo');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.grupos                FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('clave_sistema');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.categorias            FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('clase', 'tarjeta_id');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.transacciones         FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('tipo', 'hora_registro', 'secuencia');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.efectos               FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('transaccion_id');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.lineas                FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('transaccion_id');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.condonaciones         FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('linea_id', 'fecha', 'monto', 'clave_orden', 'secuencia');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.metas                 FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('categoria_id', 'fecha_creacion');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.programadas           FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('tipo');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.ocurrencias_resueltas FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('programada_id', 'fecha_esperada');
CREATE TRIGGER d_inmutables BEFORE UPDATE ON finn.movimientos           FOR EACH ROW EXECUTE FUNCTION finn.tg_inmutables('sms_id');

-- ── Solo inserción (4.5.6; HZ-1) ─────────────────────────────────────────
CREATE TRIGGER e_solo_insercion BEFORE UPDATE OR DELETE ON finn.sms_recibidos       FOR EACH ROW EXECUTE FUNCTION finn.tg_solo_insercion();
CREATE TRIGGER e_solo_insercion BEFORE UPDATE OR DELETE ON finn.sms_procesamientos  FOR EACH ROW EXECUTE FUNCTION finn.tg_solo_insercion('cuenta_id', 'duplicado_transaccion_id', 'duplicado_movimiento_id', 'categoria_sugerida_id');
CREATE TRIGGER e_solo_insercion BEFORE UPDATE OR DELETE ON finn.cambios_posteriores FOR EACH ROW EXECUTE FUNCTION finn.tg_solo_insercion('transaccion_id');
CREATE TRIGGER e_solo_insercion BEFORE UPDATE OR DELETE ON finn.conciliaciones      FOR EACH ROW EXECUTE FUNCTION finn.tg_solo_insercion();

-- ── Fechas frente a hoy (inv. 12; S3-5) ──────────────────────────────────
CREATE TRIGGER f_fechas_hoy BEFORE INSERT OR UPDATE OF fecha, clave_orden ON finn.transacciones FOR EACH ROW EXECUTE FUNCTION finn.tg_fechas_hoy();
CREATE TRIGGER f_fechas_hoy BEFORE INSERT ON finn.condonaciones                               FOR EACH ROW EXECUTE FUNCTION finn.tg_fechas_hoy();
CREATE TRIGGER f_fechas_hoy BEFORE INSERT OR UPDATE OF fecha_apertura ON finn.cuentas         FOR EACH ROW EXECUTE FUNCTION finn.tg_fechas_hoy();
CREATE TRIGGER f_fechas_hoy BEFORE INSERT ON finn.metas                                       FOR EACH ROW EXECUTE FUNCTION finn.tg_fechas_hoy();

-- ── Reglas inmediatas (g_) ───────────────────────────────────────────────
CREATE TRIGGER g_asignacion BEFORE INSERT OR UPDATE OR DELETE ON finn.asignaciones    FOR EACH ROW EXECUTE FUNCTION finn.tg_asignacion();
CREATE TRIGGER g_vigencia   BEFORE INSERT OR UPDATE OR DELETE ON finn.vigencias_ciclo FOR EACH ROW EXECUTE FUNCTION finn.tg_vigencia();

CREATE TRIGGER g_destino_activo BEFORE INSERT OR UPDATE OF categoria_id ON finn.lineas            FOR EACH ROW EXECUTE FUNCTION finn.tg_destino_activo();
CREATE TRIGGER g_destino_activo BEFORE INSERT OR UPDATE OF categoria_id ON finn.condonaciones     FOR EACH ROW EXECUTE FUNCTION finn.tg_destino_activo();
CREATE TRIGGER g_destino_activo BEFORE INSERT OR UPDATE OF categoria_id ON finn.programada_lineas FOR EACH ROW EXECUTE FUNCTION finn.tg_destino_activo();
CREATE TRIGGER g_destino_activo BEFORE INSERT OR UPDATE OF categoria_id ON finn.reglas_comercio   FOR EACH ROW EXECUTE FUNCTION finn.tg_destino_activo();
CREATE TRIGGER g_destino_activo BEFORE INSERT OR UPDATE OF categoria_id ON finn.metas             FOR EACH ROW EXECUTE FUNCTION finn.tg_destino_activo();

CREATE TRIGGER g_efecto_cuenta_archivada BEFORE INSERT OR UPDATE OF monto, cuenta_id OR DELETE ON finn.efectos
  FOR EACH ROW EXECUTE FUNCTION finn.tg_efecto_cuenta_archivada();
CREATE TRIGGER g_linea_con_eventos BEFORE UPDATE OF categoria_id, deudor_id ON finn.lineas
  FOR EACH ROW EXECUTE FUNCTION finn.tg_linea_con_eventos();
CREATE TRIGGER g_programada_calendario BEFORE UPDATE OF primera_fecha, frecuencia, frecuencia_dias ON finn.programadas
  FOR EACH ROW EXECUTE FUNCTION finn.tg_programada_calendario();

-- ── Ciclos de vida (h_) ──────────────────────────────────────────────────
CREATE TRIGGER h_transicion_movimiento BEFORE INSERT OR UPDATE OF estado ON finn.movimientos
  FOR EACH ROW EXECUTE FUNCTION finn.tg_transicion_movimiento();
CREATE TRIGGER h_transicion_estado_bancario BEFORE INSERT OR UPDATE OF estado_bancario, conciliacion_id ON finn.transacciones
  FOR EACH ROW EXECUTE FUNCTION finn.tg_transicion_estado_bancario();
CREATE TRIGGER h_transicion_ocurrencia BEFORE UPDATE ON finn.ocurrencias_resueltas
  FOR EACH ROW EXECUTE FUNCTION finn.tg_transicion_ocurrencia();

-- ── Restricciones diferidas (x_), evaluadas al confirmar (DB-06) ─────────
CREATE CONSTRAINT TRIGGER x_verificar_transaccion AFTER INSERT OR UPDATE OF tipo, total, linea_cobrada_id ON finn.transacciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_transaccion();
CREATE CONSTRAINT TRIGGER x_verificar_transaccion AFTER INSERT OR UPDATE OR DELETE ON finn.efectos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_transaccion();
CREATE CONSTRAINT TRIGGER x_verificar_transaccion AFTER INSERT OR UPDATE OR DELETE ON finn.lineas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_transaccion();

CREATE CONSTRAINT TRIGGER x_verificar_limites_linea AFTER INSERT OR UPDATE OR DELETE ON finn.lineas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_limites();
CREATE CONSTRAINT TRIGGER x_verificar_limites_linea AFTER INSERT OR DELETE ON finn.condonaciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_limites();
CREATE CONSTRAINT TRIGGER x_verificar_limites_linea AFTER INSERT OR UPDATE OF fecha, linea_cobrada_id OR DELETE ON finn.transacciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_limites();

CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER INSERT OR UPDATE ON finn.cuentas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER INSERT OR UPDATE OR DELETE ON finn.tarjetas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER INSERT OR UPDATE OR DELETE ON finn.prestamos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER INSERT OR UPDATE OR DELETE ON finn.inversiones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER INSERT OR UPDATE OR DELETE ON finn.efectos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER INSERT OR UPDATE OF tarjeta_id, archivada OR DELETE ON finn.categorias
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_cuenta AFTER UPDATE OF fecha ON finn.transacciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_cuenta();

CREATE CONSTRAINT TRIGGER x_verificar_categoria AFTER INSERT OR UPDATE ON finn.categorias
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_categoria();
CREATE CONSTRAINT TRIGGER x_verificar_categoria AFTER INSERT OR UPDATE ON finn.grupos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_categoria();
CREATE CONSTRAINT TRIGGER x_verificar_categoria AFTER INSERT OR UPDATE OR DELETE ON finn.asignaciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_categoria();
CREATE CONSTRAINT TRIGGER x_verificar_categoria AFTER INSERT OR UPDATE OF activa ON finn.programadas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_categoria();
CREATE CONSTRAINT TRIGGER x_verificar_categoria AFTER INSERT OR UPDATE ON finn.programada_lineas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_categoria();

CREATE CONSTRAINT TRIGGER x_verificar_programada AFTER INSERT OR UPDATE ON finn.programadas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_programada();
CREATE CONSTRAINT TRIGGER x_verificar_programada AFTER INSERT OR UPDATE OR DELETE ON finn.programada_lineas
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_programada();

CREATE CONSTRAINT TRIGGER x_verificar_conciliacion AFTER UPDATE OR DELETE ON finn.transacciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_conciliacion();
CREATE CONSTRAINT TRIGGER x_verificar_conciliacion AFTER INSERT OR UPDATE OR DELETE ON finn.efectos
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_conciliacion();

CREATE CONSTRAINT TRIGGER x_verificar_eliminacion_cuenta AFTER DELETE ON finn.asignaciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_eliminacion_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_eliminacion_cuenta AFTER DELETE ON finn.conciliaciones
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_eliminacion_cuenta();
CREATE CONSTRAINT TRIGGER x_verificar_eliminacion_cuenta AFTER DELETE ON finn.cambios_posteriores
  DEFERRABLE INITIALLY DEFERRED FOR EACH ROW EXECUTE FUNCTION finn.tg_x_eliminacion_cuenta();

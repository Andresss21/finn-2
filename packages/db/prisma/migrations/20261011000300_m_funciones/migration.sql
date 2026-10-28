-- prisma/migrations/20261011000300_m_funciones/migration.sql
-- finn:manual
-- Funciones auxiliares (4.1), de verificación (4.5) y de trigger (4.3).
-- Todas: propiedad de finn_migraciones, search_path fijo, SECURITY DEFINER
-- salvo las puramente de cálculo (DB-11). Ninguna usa bloques EXCEPTION
-- (subtransacciones), porque es_de_esta_transaccion compara xmin (10.4).
-- Códigos SQLSTATE propios: clase FN (10.4).

-- ═════════════════════════ 1. Auxiliares ═════════════════════════

CREATE FUNCTION finn.rechazar(p_codigo text, p_mensaje text) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  RAISE EXCEPTION USING ERRCODE = p_codigo, MESSAGE = 'finn: ' || p_mensaje;
END $$;

CREATE FUNCTION finn.clave_bloqueo() RETURNS bigint
LANGUAGE sql IMMUTABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT 1179209294::bigint   -- bytes de "FINN"
$$;

CREATE FUNCTION finn.tomar_bloqueo() RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  PERFORM set_config('lock_timeout', '10s', true);
  PERFORM pg_advisory_xact_lock(finn.clave_bloqueo());
END $$;

CREATE FUNCTION finn.tiene_bloqueo() RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT EXISTS (
    SELECT 1
    FROM pg_locks l
    WHERE l.locktype = 'advisory'
      AND l.pid = pg_backend_pid()
      AND l.granted
      AND l.database = (SELECT oid FROM pg_database WHERE datname = current_database())
      AND l.classid = 0::oid
      AND l.objid = finn.clave_bloqueo()::oid
      AND l.objsubid = 1)
$$;

CREATE FUNCTION finn.hoy() RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  v text;
BEGIN
  -- DB-08: el reloj simulado solo existe si la BASE tiene el parámetro
  -- (ALTER DATABASE ... SET finn.reloj_simulado = 'on'); una sesión no puede activarlo.
  IF EXISTS (
       SELECT 1
       FROM pg_db_role_setting s
       JOIN pg_database d ON d.oid = s.setdatabase
       WHERE d.datname = current_database()
         AND s.setrole = 0
         AND 'finn.reloj_simulado=on' = ANY (s.setconfig)) THEN
    v := current_setting('finn.hoy', true);
    IF v IS NOT NULL AND v <> '' THEN
      RETURN v::date;
    END IF;
  END IF;
  RETURN (now() AT TIME ZONE 'America/El_Salvador')::date;
END $$;

CREATE FUNCTION finn.operacion() RETURNS text
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT nullif(current_setting('finn.operacion', true), '')
$$;

CREATE FUNCTION finn.xid_actual() RETURNS bigint
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT pg_current_xact_id()::text::bigint % 4294967296
$$;

CREATE FUNCTION finn.es_de_esta_transaccion(p_xmin xid) RETURNS boolean
LANGUAGE sql VOLATILE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT p_xmin::text::bigint = finn.xid_actual()
$$;

-- §4.2 puntos 1 a 3 (única réplica en la base; P3-2)
CREATE FUNCTION finn.es_inicio_de_periodo(f date, ignorar_desde date DEFAULT NULL) RETURNS boolean
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  v_dia   smallint;
  v_desde date;
  v_dias  int;
BEGIN
  SELECT dia_inicio, rige_desde INTO v_dia, v_desde
  FROM finn.vigencias_ciclo
  WHERE (rige_desde IS NULL OR rige_desde <= f)
    AND (ignorar_desde IS NULL OR rige_desde IS NULL OR rige_desde < ignorar_desde)
  ORDER BY rige_desde DESC NULLS LAST
  LIMIT 1;
  IF NOT FOUND THEN
    PERFORM finn.rechazar('FN002', 'no existe ninguna vigencia del ciclo');
  END IF;
  IF v_desde IS NOT NULL AND f = v_desde THEN
    RETURN true;
  END IF;
  v_dias := extract(day FROM (date_trunc('month', f) + interval '1 month - 1 day'))::int;
  RETURN extract(day FROM f)::int = least(v_dia, v_dias);
END $$;

CREATE FUNCTION finn.inicio_del_periodo(f date) RETURNS date
LANGUAGE plpgsql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  d date := f;
BEGIN
  FOR i IN 0..62 LOOP
    IF finn.es_inicio_de_periodo(d) THEN
      RETURN d;
    END IF;
    d := d - 1;
  END LOOP;
  PERFORM finn.rechazar('FN002', format('no se encontró el inicio del período de %s', f));
  RETURN NULL;
END $$;

CREATE FUNCTION finn.hay_efecto(p_tx uuid, p_tipos finn.tipo_cuenta[], p_monto bigint) RETURNS boolean
LANGUAGE sql STABLE SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
  SELECT EXISTS (
    SELECT 1
    FROM finn.efectos e
    JOIN finn.cuentas c ON c.id = e.cuenta_id
    WHERE e.transaccion_id = p_tx
      AND c.tipo = ANY (p_tipos)
      AND e.monto = p_monto
      AND e.interes IS NULL)
$$;

-- ═════════════════════════ 2. Verificaciones (4.5) ═════════════════════════

-- 4.5.1 Forma de la transacción, inv. 6 y 8
CREATE FUNCTION finn.verificar_transaccion(p_id uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  t          finn.transacciones;
  tot        bigint;
  n_ef       int;
  n_lin      int;
  suma_lin   bigint;
  n_desglose int;
  ok         boolean;
  v_tarjeta  uuid;
  E   CONSTANT finn.tipo_cuenta[] := '{efectivo}';
  TJ  CONSTANT finn.tipo_cuenta[] := '{tarjeta}';
  ETJ CONSTANT finn.tipo_cuenta[] := '{efectivo,tarjeta}';
  P   CONSTANT finn.tipo_cuenta[] := '{prestamo}';
  I   CONSTANT finn.tipo_cuenta[] := '{inversion}';
  PI  CONSTANT finn.tipo_cuenta[] := '{prestamo,inversion}';
BEGIN
  SELECT * INTO t FROM finn.transacciones WHERE id = p_id;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  tot := t.total;

  SELECT count(*) INTO n_ef FROM finn.efectos WHERE transaccion_id = p_id;
  SELECT count(*), coalesce(sum(monto), 0) INTO n_lin, suma_lin FROM finn.lineas WHERE transaccion_id = p_id;
  SELECT count(*) INTO n_desglose FROM finn.efectos WHERE transaccion_id = p_id AND interes IS NOT NULL;

  -- 1. Líneas (inv. 6)
  IF t.tipo IN ('gasto', 'devolucion', 'pago_tarjeta', 'cuota_prestamo', 'abono_capital', 'aporte_inversion') THEN
    IF n_lin = 0 OR suma_lin <> tot THEN
      PERFORM finn.rechazar('FN003', format('transacción %s: la suma de las líneas (%s) no es igual al total (%s) (inv. 6)', p_id, suma_lin, tot));
    END IF;
  ELSIF n_lin > 0 THEN
    PERFORM finn.rechazar('FN003', format('transacción %s: el tipo %s no tiene líneas (inv. 6)', p_id, t.tipo));
  END IF;

  -- 3. Desglose de préstamo solo en la cuota
  IF n_desglose <> (CASE WHEN t.tipo = 'cuota_prestamo' THEN 1 ELSE 0 END) THEN
    PERFORM finn.rechazar('FN003', format('transacción %s: el desglose de interés y seguro solo existe en el efecto sobre el préstamo de una cuota', p_id));
  END IF;

  -- 2. Efectos por tipo (tabla de 4.5.1)
  ok := CASE t.tipo
    WHEN 'gasto'                  THEN n_ef = 1 AND finn.hay_efecto(p_id, ETJ, -tot)
    WHEN 'ingreso'                THEN n_ef = 1 AND finn.hay_efecto(p_id, E, tot)
    WHEN 'saldo_inicial'          THEN n_ef = 1 AND (finn.hay_efecto(p_id, ETJ || PI, tot) OR finn.hay_efecto(p_id, ETJ, -tot))
    WHEN 'transferencia'          THEN n_ef = 2 AND finn.hay_efecto(p_id, E, -tot) AND finn.hay_efecto(p_id, E, tot)
    WHEN 'pago_tarjeta'           THEN n_ef = 2 AND finn.hay_efecto(p_id, E, -tot) AND finn.hay_efecto(p_id, TJ, tot)
    WHEN 'cuota_prestamo'         THEN n_ef = 2 AND finn.hay_efecto(p_id, ETJ, -tot) AND EXISTS (
                                         SELECT 1 FROM finn.efectos e JOIN finn.cuentas c ON c.id = e.cuenta_id
                                         WHERE e.transaccion_id = p_id AND c.tipo = 'prestamo' AND e.interes IS NOT NULL
                                           AND e.monto <= 0 AND (-e.monto)::bigint + e.interes + e.seguro = tot)
    WHEN 'abono_capital'          THEN n_ef = 2 AND finn.hay_efecto(p_id, ETJ, -tot) AND finn.hay_efecto(p_id, P, -tot)
    WHEN 'aporte_inversion'       THEN n_ef = 2 AND finn.hay_efecto(p_id, E, -tot) AND finn.hay_efecto(p_id, I, tot)
    WHEN 'desembolso_prestamo'    THEN n_ef = 2 AND finn.hay_efecto(p_id, P, tot) AND finn.hay_efecto(p_id, E, tot)
    WHEN 'retiro_inversion'       THEN n_ef = 2 AND finn.hay_efecto(p_id, I, -tot) AND finn.hay_efecto(p_id, E, tot)
    WHEN 'avance_efectivo'        THEN n_ef = 2 AND finn.hay_efecto(p_id, TJ, -tot) AND finn.hay_efecto(p_id, E, tot)
    WHEN 'entrada_tarjeta'        THEN n_ef = 1 AND finn.hay_efecto(p_id, TJ, tot)
    WHEN 'transferencia_tarjetas' THEN n_ef = 2 AND finn.hay_efecto(p_id, TJ, -tot) AND finn.hay_efecto(p_id, TJ, tot)
    WHEN 'cobro'                  THEN n_ef = 1 AND finn.hay_efecto(p_id, ETJ, tot)
    WHEN 'devolucion'             THEN n_ef = 1 AND finn.hay_efecto(p_id, ETJ, tot)
    WHEN 'ajuste_inversion'       THEN n_ef = 1 AND (finn.hay_efecto(p_id, I, tot) OR finn.hay_efecto(p_id, I, -tot))
  END;
  IF NOT coalesce(ok, false) THEN
    PERFORM finn.rechazar('FN003', format('transacción %s: los efectos en cuentas no corresponden al tipo %s (2.2.9)', p_id, t.tipo));
  END IF;

  -- 4. Destinos de las líneas por tipo (inv. 8)
  IF t.tipo = 'gasto' THEN
    IF EXISTS (SELECT 1 FROM finn.lineas l LEFT JOIN finn.categorias c ON c.id = l.categoria_id
               WHERE l.transaccion_id = p_id
                 AND (l.linea_original_id IS NOT NULL OR (l.categoria_id IS NOT NULL AND c.clase <> 'normal'))) THEN
      PERFORM finn.rechazar('FN003', format('transacción %s: un gasto solo tiene líneas a categorías normales o por cobrar (inv. 8)', p_id));
    END IF;
  ELSIF t.tipo = 'pago_tarjeta' THEN
    SELECT e.cuenta_id INTO v_tarjeta
    FROM finn.efectos e JOIN finn.cuentas c ON c.id = e.cuenta_id
    WHERE e.transaccion_id = p_id AND c.tipo = 'tarjeta';
    IF n_lin <> 1 OR NOT EXISTS (SELECT 1 FROM finn.lineas l JOIN finn.categorias c ON c.id = l.categoria_id
                                 WHERE l.transaccion_id = p_id AND c.tarjeta_id = v_tarjeta) THEN
      PERFORM finn.rechazar('FN003', format('transacción %s: el pago lleva una sola línea, a la categoría de pago de su tarjeta (inv. 8)', p_id));
    END IF;
  ELSIF t.tipo IN ('cuota_prestamo', 'abono_capital', 'aporte_inversion') THEN
    IF n_lin <> 1 OR NOT EXISTS (SELECT 1 FROM finn.lineas l JOIN finn.categorias c ON c.id = l.categoria_id
                                 WHERE l.transaccion_id = p_id AND c.clase = 'normal') THEN
      PERFORM finn.rechazar('FN003', format('transacción %s: %s lleva una sola línea, a una categoría normal (2.2.9)', p_id, t.tipo));
    END IF;
  ELSIF t.tipo = 'devolucion' THEN
    IF EXISTS (SELECT 1 FROM finn.lineas WHERE transaccion_id = p_id AND linea_original_id IS NOT NULL) THEN
      IF EXISTS (SELECT 1 FROM finn.lineas WHERE transaccion_id = p_id AND linea_original_id IS NULL)
         OR (SELECT count(DISTINCT o.transaccion_id) FROM finn.lineas d JOIN finn.lineas o ON o.id = d.linea_original_id
             WHERE d.transaccion_id = p_id) <> 1
         OR EXISTS (SELECT 1 FROM finn.lineas d JOIN finn.lineas o ON o.id = d.linea_original_id
                    JOIN finn.transacciones ot ON ot.id = o.transaccion_id
                    WHERE d.transaccion_id = p_id AND ot.tipo <> 'gasto') THEN
        PERFORM finn.rechazar('FN003', format('transacción %s: una devolución vinculada apunta solo a líneas de un mismo gasto (OP-33a, C-3)', p_id));
      END IF;
    ELSIF n_lin <> 1 OR NOT EXISTS (SELECT 1 FROM finn.lineas l JOIN finn.categorias c ON c.id = l.categoria_id
                                    WHERE l.transaccion_id = p_id AND c.clase = 'normal') THEN
      PERFORM finn.rechazar('FN003', format('transacción %s: una devolución sin compra original lleva una línea a una categoría normal (OP-33b)', p_id));
    END IF;
  END IF;
END $$;

-- 4.5.2 Límites de devoluciones y cobros: inv. 9 (condición necesaria), 10, 11 y fechas
CREATE FUNCTION finn.verificar_limites_linea(p_linea uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  l       finn.lineas;
  t       finn.transacciones;
  dev     bigint;
  cond    bigint;
  n_cobro int;
BEGIN
  SELECT * INTO l FROM finn.lineas WHERE id = p_linea;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  SELECT * INTO t FROM finn.transacciones WHERE id = l.transaccion_id;

  SELECT coalesce(sum(monto), 0) INTO dev  FROM finn.lineas        WHERE linea_original_id = p_linea;
  SELECT coalesce(sum(monto), 0) INTO cond FROM finn.condonaciones WHERE linea_id = p_linea;
  SELECT count(*)                INTO n_cobro FROM finn.transacciones WHERE linea_cobrada_id = p_linea;

  IF l.linea_original_id IS NOT NULL AND (dev > 0 OR cond > 0 OR n_cobro > 0) THEN
    PERFORM finn.rechazar('FN004', format('línea %s: una línea de devolución no recibe eventos', p_linea));
  END IF;
  IF l.deudor_id IS NULL AND (cond > 0 OR n_cobro > 0) THEN
    PERFORM finn.rechazar('FN004', format('línea %s: cobros y condonaciones solo se aplican a líneas por cobrar (P9)', p_linea));
  END IF;
  IF (dev > 0 OR cond > 0 OR n_cobro > 0) AND t.tipo <> 'gasto' THEN
    PERFORM finn.rechazar('FN004', format('línea %s: solo las líneas de un gasto admiten eventos (C-3)', p_linea));
  END IF;
  IF l.categoria_id IS NOT NULL AND dev > l.monto THEN
    PERFORM finn.rechazar('FN004', format('línea %s: las devoluciones (%s) superan el monto de la línea (%s) (inv. 10)', p_linea, dev, l.monto));
  END IF;
  IF l.deudor_id IS NOT NULL AND cond + dev > l.monto THEN
    PERFORM finn.rechazar('FN004', format('línea %s: condonado + devuelto (%s) supera el monto de la línea (%s) (inv. 9)', p_linea, cond + dev, l.monto));
  END IF;
  IF (SELECT coalesce(sum(d.monto), 0) FROM finn.lineas d JOIN finn.lineas o ON o.id = d.linea_original_id
      WHERE o.transaccion_id = t.id) > t.total THEN
    PERFORM finn.rechazar('FN004', format('transacción %s: las devoluciones superan su total (inv. 11)', t.id));
  END IF;
  IF EXISTS (SELECT 1 FROM finn.lineas d JOIN finn.transacciones td ON td.id = d.transaccion_id
             WHERE d.linea_original_id = p_linea AND td.fecha < t.fecha)
     OR EXISTS (SELECT 1 FROM finn.transacciones c WHERE c.linea_cobrada_id = p_linea AND c.fecha < t.fecha)
     OR EXISTS (SELECT 1 FROM finn.condonaciones k WHERE k.linea_id = p_linea AND k.fecha < t.fecha) THEN
    PERFORM finn.rechazar('FN002', format('línea %s: un evento no puede ser anterior a su transacción original (inv. 12)', p_linea));
  END IF;
END $$;

-- 4.5.4 Cuenta
CREATE FUNCTION finn.verificar_cuenta(p_cuenta uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  c    finn.cuentas;
  n    int;
  suma bigint;
BEGIN
  SELECT * INTO c FROM finn.cuentas WHERE id = p_cuenta;
  IF NOT FOUND THEN
    RETURN;
  END IF;

  IF (c.tipo = 'tarjeta')   <> EXISTS (SELECT 1 FROM finn.tarjetas    WHERE cuenta_id = c.id)
  OR (c.tipo = 'prestamo')  <> EXISTS (SELECT 1 FROM finn.prestamos   WHERE cuenta_id = c.id)
  OR (c.tipo = 'inversion') <> EXISTS (SELECT 1 FROM finn.inversiones WHERE cuenta_id = c.id) THEN
    PERFORM finn.rechazar('FN005', format('cuenta %s: falta o sobra la fila de su subtipo (DB-04)', c.id));
  END IF;

  IF c.tipo = 'tarjeta' AND (SELECT count(*) FROM finn.categorias WHERE tarjeta_id = c.id) <> 1 THEN
    PERFORM finn.rechazar('FN005', format('tarjeta %s: debe tener exactamente una categoría de pago (inv. 22)', c.id));
  END IF;

  SELECT count(*) INTO n
  FROM finn.efectos e JOIN finn.transacciones t ON t.id = e.transaccion_id
  WHERE e.cuenta_id = c.id AND t.tipo = 'saldo_inicial';
  IF n > 1 OR EXISTS (SELECT 1 FROM finn.efectos e JOIN finn.transacciones t ON t.id = e.transaccion_id
                      WHERE e.cuenta_id = c.id AND t.tipo = 'saldo_inicial' AND t.fecha <> c.fecha_apertura) THEN
    PERFORM finn.rechazar('FN005', format('cuenta %s: a lo sumo un saldo inicial, con la fecha de apertura (OP-01, OP-02)', c.id));
  END IF;

  IF EXISTS (SELECT 1 FROM finn.efectos e JOIN finn.transacciones t ON t.id = e.transaccion_id
             WHERE e.cuenta_id = c.id AND t.fecha < c.fecha_apertura) THEN
    PERFORM finn.rechazar('FN002', format('cuenta %s: hay transacciones anteriores a su fecha de apertura (inv. 12)', c.id));
  END IF;

  SELECT coalesce(sum(monto), 0) INTO suma FROM finn.efectos WHERE cuenta_id = c.id;
  IF c.tipo IN ('prestamo', 'inversion') AND suma < 0 THEN
    PERFORM finn.rechazar('FN005', format('cuenta %s: el capital pendiente o el valor no puede ser negativo (§0.4)', c.id));
  END IF;
  IF c.archivada AND suma <> 0 THEN
    PERFORM finn.rechazar('FN005', format('cuenta %s: una cuenta archivada tiene saldo cero (inv. 24)', c.id));
  END IF;
  IF c.tipo = 'tarjeta' AND EXISTS (SELECT 1 FROM finn.categorias WHERE tarjeta_id = c.id AND archivada <> c.archivada) THEN
    PERFORM finn.rechazar('FN005', format('tarjeta %s: se archiva y desarchiva junto con su categoría de pago (OP-04, OP-05)', c.id));
  END IF;
END $$;

-- 4.5.4 Categoría
CREATE FUNCTION finn.verificar_categoria(p_categoria uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  c      finn.categorias;
  g      finn.grupos;
  activo date;
BEGIN
  SELECT * INTO c FROM finn.categorias WHERE id = p_categoria;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  SELECT * INTO g FROM finn.grupos WHERE id = c.grupo_id;

  IF (c.clase = 'pago') <> coalesce(g.clave_sistema = 'pagos_tarjeta', false) THEN
    PERFORM finn.rechazar('FN006', format('categoría %s: las de pago viven en "Pagos de tarjeta", y solo ellas (S3-9)', c.id));
  END IF;
  IF g.archivado AND NOT c.archivada THEN
    PERFORM finn.rechazar('FN006', format('categoría %s: un grupo archivado solo contiene categorías archivadas (supuesto 18)', c.id));
  END IF;
  IF c.archivada AND finn.operacion() IS DISTINCT FROM 'eliminar_cuenta' THEN
    activo := finn.inicio_del_periodo(finn.hoy());
    IF EXISTS (SELECT 1 FROM finn.asignaciones WHERE categoria_id = c.id AND periodo_inicio > activo) THEN
      PERFORM finn.rechazar('FN006', format('categoría %s: una categoría archivada no tiene asignaciones futuras (H10)', c.id));
    END IF;
    IF EXISTS (SELECT 1 FROM finn.programada_lineas pl JOIN finn.programadas p ON p.id = pl.programada_id
               WHERE pl.categoria_id = c.id AND p.activa) THEN
      PERFORM finn.rechazar('FN006', format('categoría %s: una categoría archivada no tiene programadas activas (M3)', c.id));
    END IF;
  END IF;
END $$;

CREATE FUNCTION finn.verificar_grupo(p_grupo uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  g finn.grupos;
BEGIN
  SELECT * INTO g FROM finn.grupos WHERE id = p_grupo;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  IF g.clave_sistema IS NOT NULL AND g.archivado THEN
    PERFORM finn.rechazar('FN006', 'el grupo "Pagos de tarjeta" no se archiva (S3-9)');
  END IF;
  IF g.archivado AND EXISTS (SELECT 1 FROM finn.categorias WHERE grupo_id = g.id AND NOT archivada) THEN
    PERFORM finn.rechazar('FN006', format('grupo %s: se archiva solo si todas sus categorías están archivadas (supuesto 18)', g.id));
  END IF;
END $$;

-- 4.5.4 Programada
CREATE FUNCTION finn.verificar_programada(p_programada uuid) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  p      finn.programadas;
  t_orig finn.tipo_cuenta;
  t_dest finn.tipo_cuenta;
  n      int;
  suma   bigint;
  ok     boolean;
BEGIN
  SELECT * INTO p FROM finn.programadas WHERE id = p_programada;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  SELECT tipo INTO t_orig FROM finn.cuentas WHERE id = p.cuenta_id;
  SELECT tipo INTO t_dest FROM finn.cuentas WHERE id = p.cuenta_destino_id;
  SELECT count(*), coalesce(sum(monto), 0) INTO n, suma FROM finn.programada_lineas WHERE programada_id = p.id;

  ok := CASE p.tipo
    WHEN 'gasto'            THEN t_orig IN ('efectivo', 'tarjeta') AND n >= 1
    WHEN 'pago_tarjeta'     THEN t_orig = 'efectivo' AND t_dest = 'tarjeta' AND n = 0
    WHEN 'cuota_prestamo'   THEN t_orig IN ('efectivo', 'tarjeta') AND t_dest = 'prestamo' AND n = 1
    WHEN 'aporte_inversion' THEN t_orig = 'efectivo' AND t_dest = 'inversion' AND n = 1
  END;
  IF NOT coalesce(ok, false) OR (n > 0 AND suma <> p.monto) THEN
    PERFORM finn.rechazar('FN009', format('programada %s: cuentas o líneas no corresponden a su tipo %s, o las líneas no suman el monto (P3-6, DB-16)', p.id, p.tipo));
  END IF;
END $$;

-- 4.6.2 Estado bancario y cambios posteriores (P12, N6)
CREATE FUNCTION finn.verificar_conciliacion(p_tx uuid, p_estado_ant finn.estado_bancario, p_conc_ant uuid, p_sensible boolean) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  v_estado finn.estado_bancario;
  v_conc   uuid;
BEGIN
  SELECT estado_bancario, conciliacion_id INTO v_estado, v_conc FROM finn.transacciones WHERE id = p_tx;
  IF NOT FOUND THEN
    RETURN;
  END IF;
  IF p_sensible AND v_estado = 'conciliada'
     AND NOT EXISTS (SELECT 1 FROM finn.conciliaciones k WHERE k.id = v_conc AND finn.es_de_esta_transaccion(k.xmin)) THEN
    PERFORM finn.rechazar('FN010', format('transacción %s: cambió su monto, fecha o cuenta y sigue conciliada; debe pasar a confirmada (P12)', p_tx));
  END IF;
  IF p_estado_ant = 'conciliada' AND (v_estado <> 'conciliada' OR v_conc IS DISTINCT FROM p_conc_ant)
     AND NOT EXISTS (SELECT 1 FROM finn.cambios_posteriores cp
                     WHERE cp.conciliacion_id = p_conc_ant AND cp.transaccion_id = p_tx
                       AND finn.es_de_esta_transaccion(cp.xmin)) THEN
    PERFORM finn.rechazar('FN010', format('transacción %s: dejó de estar conciliada sin registrar el cambio posterior (P12)', p_tx));
  END IF;
END $$;

CREATE FUNCTION finn.verificar_eliminacion_conciliada(p_conc uuid, p_fecha date) RETURNS void
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  -- OP-06 (HZ-1): la conciliación se elimina junto con la cuenta en la misma operación
  IF finn.operacion() = 'eliminar_cuenta' AND NOT EXISTS (SELECT 1 FROM finn.conciliaciones WHERE id = p_conc) THEN
    RETURN;
  END IF;
  IF NOT EXISTS (SELECT 1 FROM finn.cambios_posteriores cp
                 WHERE cp.conciliacion_id = p_conc AND 'eliminacion' = ANY (cp.motivos)
                   AND cp.fecha = p_fecha AND finn.es_de_esta_transaccion(cp.xmin)) THEN
    PERFORM finn.rechazar('FN010', 'se eliminó una transacción conciliada sin registrar el cambio posterior (N6)');
  END IF;
END $$;

-- ═════════════════════ 3. Eliminación de conciliaciones (HZ-1) ═════════════════════

-- Única vía para eliminar conciliaciones y sus cambios posteriores: dentro de OP-06,
-- después de eliminar el saldo inicial de la cuenta. finn_app no tiene DELETE sobre
-- esas tablas (8.3); esta función corre como su dueño.
CREATE FUNCTION finn.eliminar_conciliaciones_de_cuenta(p_cuenta uuid) RETURNS integer
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  n integer;
BEGIN
  IF NOT finn.tiene_bloqueo() THEN
    PERFORM finn.rechazar('FN001', 'escritura de hechos sin el bloqueo global (ADR-06)');
  END IF;
  IF finn.operacion() IS DISTINCT FROM 'eliminar_cuenta' THEN
    PERFORM finn.rechazar('FN012', 'las conciliaciones solo se eliminan dentro de OP-06 (finn.operacion = eliminar_cuenta)');
  END IF;
  IF EXISTS (SELECT 1 FROM finn.efectos WHERE cuenta_id = p_cuenta) THEN
    PERFORM finn.rechazar('FN012', format('cuenta %s: todavía tiene transacciones; se elimina primero su saldo inicial (OP-06)', p_cuenta));
  END IF;
  DELETE FROM finn.cambios_posteriores
  WHERE conciliacion_id IN (SELECT id FROM finn.conciliaciones WHERE cuenta_id = p_cuenta);
  DELETE FROM finn.conciliaciones WHERE cuenta_id = p_cuenta;
  GET DIAGNOSTICS n = ROW_COUNT;
  RETURN n;
END $$;

-- ═════════════════════════ 4. Funciones de trigger (4.3) ═════════════════════════

CREATE FUNCTION finn.tg_exigir_bloqueo() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF NOT finn.tiene_bloqueo() THEN
    PERFORM finn.rechazar('FN001', format('escritura en %s sin el bloqueo global (ADR-06)', TG_TABLE_NAME));
  END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION finn.tg_avanzar_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  x bigint := pg_current_xact_id()::text::bigint;
BEGIN
  UPDATE finn.revision
     SET valor = valor + 1, ultima_transaccion = x
   WHERE id = 1 AND ultima_transaccion IS DISTINCT FROM x;
  IF TG_OP = 'TRUNCATE' THEN
    UPDATE finn.revision SET revision_minima_incremental = valor WHERE id = 1;
  END IF;
  RETURN NULL;
END $$;

-- 5.4: la secuencia la asigna la base, nunca la app (sin DEFAULT de columna; DB-21)
CREATE FUNCTION finn.tg_asignar_secuencia() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  NEW.secuencia := nextval('finn.secuencia_creacion');
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_estampar_revision() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  NEW.revision := (SELECT valor FROM finn.revision WHERE id = 1);
  RETURN NEW;
END $$;

-- TG_ARGV[0]: columna de clave primaria ('id' o 'cuenta_id')
CREATE FUNCTION finn.tg_registrar_eliminacion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  INSERT INTO finn.eliminaciones (tabla, fila_id, revision)
  VALUES (TG_TABLE_NAME, (to_jsonb(OLD) ->> TG_ARGV[0])::uuid, (SELECT valor FROM finn.revision WHERE id = 1));
  RETURN NULL;
END $$;

-- TG_ARGV: columnas inmutables
CREATE FUNCTION finn.tg_inmutables() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  col   text;
  nuevo jsonb := to_jsonb(NEW);
  viejo jsonb := to_jsonb(OLD);
BEGIN
  FOREACH col IN ARRAY TG_ARGV LOOP
    IF nuevo -> col IS DISTINCT FROM viejo -> col THEN
      PERFORM finn.rechazar('FN008', format('%s.%s es inmutable', TG_TABLE_NAME, col));
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

-- TG_ARGV: columnas con ON DELETE SET NULL que pueden pasar a nulo (4.5.6)
CREATE FUNCTION finn.tg_solo_insercion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  k     text;
  nuevo jsonb;
  viejo jsonb;
BEGIN
  IF TG_OP = 'DELETE' THEN
    -- Excepción de HZ-1: conciliaciones y cambios posteriores dentro de OP-06.
    -- x_verificar_eliminacion_cuenta comprueba al confirmar que la cuenta ya no existe.
    IF TG_TABLE_NAME IN ('conciliaciones', 'cambios_posteriores') AND finn.operacion() = 'eliminar_cuenta' THEN
      RETURN OLD;
    END IF;
    PERFORM finn.rechazar('FN008', format('%s solo admite inserciones (DM-7, DM-8)', TG_TABLE_NAME));
  END IF;
  nuevo := to_jsonb(NEW);
  viejo := to_jsonb(OLD);
  FOR k IN SELECT key FROM jsonb_each(nuevo) LOOP
    IF nuevo -> k IS DISTINCT FROM viejo -> k
       AND NOT (k = ANY (TG_ARGV) AND nuevo -> k = 'null'::jsonb) THEN
      PERFORM finn.rechazar('FN008', format('%s solo admite inserciones; %s no se modifica (DM-7, DM-8)', TG_TABLE_NAME, k));
    END IF;
  END LOOP;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_fechas_hoy() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  h date := finn.hoy();
BEGIN
  CASE TG_TABLE_NAME
  WHEN 'transacciones' THEN
    IF TG_OP = 'INSERT' THEN
      IF NEW.fecha > h THEN
        PERFORM finn.rechazar('FN002', format('la fecha %s es posterior a hoy (%s) (inv. 12)', NEW.fecha, h));
      END IF;
      IF NEW.clave_orden <> NEW.hora_registro THEN
        PERFORM finn.rechazar('FN008', 'al registrar, la clave de orden es la hora de registro (S3-5)');
      END IF;
    ELSIF NEW.fecha IS DISTINCT FROM OLD.fecha THEN
      IF NEW.fecha > h THEN
        PERFORM finn.rechazar('FN002', format('la fecha %s es posterior a hoy (%s) (inv. 12)', NEW.fecha, h));
      END IF;
      IF NEW.clave_orden <= OLD.clave_orden THEN
        PERFORM finn.rechazar('FN008', 'al cambiar la fecha, la clave de orden pasa al instante del cambio (supuesto 5)');
      END IF;
    ELSIF NEW.clave_orden IS DISTINCT FROM OLD.clave_orden THEN
      PERFORM finn.rechazar('FN008', 'la clave de orden solo cambia junto con la fecha (S3-5)');
    END IF;
  WHEN 'condonaciones' THEN
    IF NEW.fecha > h THEN
      PERFORM finn.rechazar('FN002', format('la fecha %s es posterior a hoy (%s) (inv. 12)', NEW.fecha, h));
    END IF;
  WHEN 'cuentas' THEN
    IF (TG_OP = 'INSERT' OR NEW.fecha_apertura IS DISTINCT FROM OLD.fecha_apertura) AND NEW.fecha_apertura > h THEN
      PERFORM finn.rechazar('FN002', 'la fecha de apertura no puede ser posterior a hoy (OP-01)');
    END IF;
  WHEN 'metas' THEN
    IF NEW.fecha_creacion > h THEN
      PERFORM finn.rechazar('FN002', 'la fecha de creación de una meta no puede ser posterior a hoy');
    END IF;
    IF NEW.tipo = 'para_fecha' AND NEW.fecha_objetivo < h THEN
      PERFORM finn.rechazar('FN002', 'una meta para una fecha se crea con fecha objetivo ≥ hoy (OP-18, CB-27)');
    END IF;
  ELSE
    NULL;
  END CASE;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_asignacion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  op       text := finn.operacion();
  activo   date := finn.inicio_del_periodo(finn.hoy());
  v_cat    uuid;
  v_clase  finn.clase_categoria;
  v_arch   boolean;
  v_delta  bigint;
  v_cerrado boolean;
  v_futuro  boolean;
BEGIN
  IF TG_OP IN ('INSERT', 'UPDATE') AND NOT finn.es_inicio_de_periodo(NEW.periodo_inicio) THEN
    PERFORM finn.rechazar('FN002', format('%s no es el inicio de un período (§4.2)', NEW.periodo_inicio));
  END IF;
  IF TG_OP = 'UPDATE' AND (NEW.periodo_inicio <> OLD.periodo_inicio OR NEW.categoria_id <> OLD.categoria_id)
     AND op IS DISTINCT FROM 'fusion' THEN
    PERFORM finn.rechazar('FN008', 'una asignación no cambia de categoría ni de período, salvo en una fusión (OP-12)');
  END IF;

  v_cat := CASE WHEN TG_OP = 'DELETE' THEN OLD.categoria_id ELSE NEW.categoria_id END;
  SELECT clase, archivada INTO v_clase, v_arch FROM finn.categorias WHERE id = v_cat;
  v_cerrado := (TG_OP <> 'INSERT' AND OLD.periodo_inicio < activo) OR (TG_OP <> 'DELETE' AND NEW.periodo_inicio < activo);
  v_futuro  := TG_OP <> 'DELETE' AND NEW.periodo_inicio > activo;
  v_delta   := (CASE WHEN TG_OP = 'DELETE' THEN 0 ELSE NEW.monto END) - (CASE WHEN TG_OP = 'INSERT' THEN 0 ELSE OLD.monto END);

  -- inv. 18 con sus dos excepciones (O4 fusión; F1 eliminar una tarjeta, dentro de OP-06)
  IF v_cerrado THEN
    IF op = 'fusion' THEN
      NULL;
    ELSIF op = 'eliminar_cuenta' AND TG_OP = 'DELETE' AND v_clase = 'pago' THEN
      NULL;  -- x_verificar_eliminacion_cuenta exige que la categoría ya no exista al confirmar
    ELSE
      PERFORM finn.rechazar('FN002', 'lo asignado en un período cerrado no cambia (inv. 18)');
    END IF;
  END IF;

  -- inv. 20
  IF v_arch AND op IS DISTINCT FROM 'fusion' AND op IS DISTINCT FROM 'eliminar_cuenta' THEN
    IF v_delta > 0 THEN
      PERFORM finn.rechazar('FN011', 'una categoría archivada no recibe asignaciones positivas (inv. 20)');
    END IF;
    IF v_futuro THEN
      PERFORM finn.rechazar('FN011', 'una categoría archivada no tiene asignaciones futuras (H10)');
    END IF;
  END IF;

  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE FUNCTION finn.tg_vigencia() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  h      date := finn.hoy();
  previo smallint;
BEGIN
  IF TG_OP = 'UPDATE' THEN
    PERFORM finn.rechazar('FN008', 'una vigencia no se modifica; se elimina y se crea otra (OP-19)');
  END IF;

  IF TG_OP = 'INSERT' THEN
    IF NEW.rige_desde IS NULL THEN
      IF EXISTS (SELECT 1 FROM finn.vigencias_ciclo WHERE rige_desde IS NULL) THEN
        PERFORM finn.rechazar('FN002', 'ya existe la primera vigencia del ciclo');
      END IF;
      RETURN NEW;
    END IF;
    IF NEW.rige_desde <= h THEN
      PERFORM finn.rechazar('FN002', 'una vigencia nueva rige desde un período futuro (M5)');
    END IF;
    IF NOT finn.es_inicio_de_periodo(NEW.rige_desde, NEW.rige_desde) THEN
      PERFORM finn.rechazar('FN002', format('%s no es un inicio de período del ciclo vigente (§4.2.9)', NEW.rige_desde));
    END IF;
    IF EXISTS (SELECT 1 FROM finn.asignaciones WHERE periodo_inicio >= NEW.rige_desde) THEN
      PERFORM finn.rechazar('FN002', 'la vigencia nueva redefiniría períodos con asignaciones (inv. 21)');
    END IF;
    SELECT dia_inicio INTO previo
    FROM finn.vigencias_ciclo
    WHERE rige_desde IS NULL OR rige_desde < NEW.rige_desde
    ORDER BY rige_desde DESC NULLS LAST
    LIMIT 1;
    IF previo = NEW.dia_inicio THEN
      PERFORM finn.rechazar('FN002', 'el día de inicio nuevo es igual al vigente (OP-19)');
    END IF;
    RETURN NEW;
  END IF;

  -- DELETE
  IF OLD.rige_desde IS NULL THEN
    PERFORM finn.rechazar('FN002', 'la primera vigencia del ciclo no se elimina');
  END IF;
  IF OLD.rige_desde <= h THEN
    PERFORM finn.rechazar('FN002', 'una vigencia que ya rige no se elimina');
  END IF;
  IF EXISTS (SELECT 1 FROM finn.asignaciones WHERE periodo_inicio >= OLD.rige_desde) THEN
    PERFORM finn.rechazar('FN002', 'eliminar la vigencia redefiniría períodos con asignaciones (inv. 21)');
  END IF;
  RETURN OLD;
END $$;

CREATE FUNCTION finn.tg_destino_activo() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  v_clase finn.clase_categoria;
  v_arch  boolean;
BEGIN
  IF NEW.categoria_id IS NULL THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'UPDATE' AND NEW.categoria_id IS NOT DISTINCT FROM OLD.categoria_id THEN
    RETURN NEW;
  END IF;
  SELECT clase, archivada INTO v_clase, v_arch FROM finn.categorias WHERE id = NEW.categoria_id;
  IF v_arch THEN
    PERFORM finn.rechazar('FN011', format('la categoría %s está archivada y no recibe usos nuevos (inv. 20)', NEW.categoria_id));
  END IF;
  -- En lineas, la clase la verifica verificar_transaccion (las de pago de tarjeta van a categorías de pago).
  IF TG_TABLE_NAME <> 'lineas' AND v_clase <> 'normal' THEN
    PERFORM finn.rechazar('FN011', format('%s solo admite categorías normales (inv. 23; OP-18, 32, 41, 42)', TG_TABLE_NAME));
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_efecto_cuenta_archivada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  cambia boolean;
BEGIN
  cambia := TG_OP IN ('INSERT', 'DELETE')
            OR NEW.monto IS DISTINCT FROM OLD.monto
            OR NEW.cuenta_id IS DISTINCT FROM OLD.cuenta_id;
  IF NOT cambia THEN
    RETURN NEW;
  END IF;
  IF (TG_OP <> 'INSERT' AND (SELECT archivada FROM finn.cuentas WHERE id = OLD.cuenta_id))
  OR (TG_OP <> 'DELETE' AND (SELECT archivada FROM finn.cuentas WHERE id = NEW.cuenta_id)) THEN
    PERFORM finn.rechazar('FN005', 'una cuenta archivada no cambia de saldo; primero se desarchiva (inv. 24, A-1)');
  END IF;
  RETURN CASE WHEN TG_OP = 'DELETE' THEN OLD ELSE NEW END;
END $$;

CREATE FUNCTION finn.tg_linea_con_eventos() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF ((NEW.categoria_id IS NULL) <> (OLD.categoria_id IS NULL) OR NEW.deudor_id IS DISTINCT FROM OLD.deudor_id)
     AND (EXISTS (SELECT 1 FROM finn.lineas        WHERE linea_original_id = OLD.id)
       OR EXISTS (SELECT 1 FROM finn.condonaciones WHERE linea_id = OLD.id)
       OR EXISTS (SELECT 1 FROM finn.transacciones WHERE linea_cobrada_id = OLD.id)) THEN
    PERFORM finn.rechazar('FN008', 'una línea con eventos no cambia entre categoría y por cobrar ni de deudor (OP-28)');
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_programada_calendario() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF (NEW.primera_fecha IS DISTINCT FROM OLD.primera_fecha
      OR NEW.frecuencia IS DISTINCT FROM OLD.frecuencia
      OR NEW.frecuencia_dias IS DISTINCT FROM OLD.frecuencia_dias)
     AND (EXISTS (SELECT 1 FROM finn.ocurrencias_resueltas WHERE programada_id = OLD.id)
       OR EXISTS (SELECT 1 FROM finn.movimientos WHERE esperada_programada_id = OLD.id AND estado = 'con_coincidencia')) THEN
    PERFORM finn.rechazar('FN009', 'el calendario de una programada con ocurrencias resueltas o propuestas no cambia; se termina y se crea otra (P3-6b)');
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_transicion_movimiento() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  permitido boolean;
  v_texto   text;
  v_t       timestamptz;
BEGIN
  IF TG_OP = 'UPDATE' AND NEW.estado = OLD.estado THEN
    RETURN NEW;
  END IF;
  IF TG_OP = 'INSERT' THEN
    permitido := NEW.estado IN ('pendiente', 'con_coincidencia', 'posible_duplicado', 'no_reconocido', 'autodescartado', 'error');
  ELSE
    permitido := CASE OLD.estado
      WHEN 'pendiente'         THEN NEW.estado IN ('aprobado', 'descartado')
      WHEN 'con_coincidencia'  THEN NEW.estado IN ('aprobado', 'pendiente', 'posible_duplicado')
      WHEN 'posible_duplicado' THEN NEW.estado IN ('pendiente', 'descartado')
      WHEN 'no_reconocido'     THEN NEW.estado IN ('aprobado', 'descartado')
      WHEN 'error'             THEN NEW.estado IN ('pendiente', 'con_coincidencia', 'posible_duplicado', 'no_reconocido',
                                                   'autodescartado', 'aprobado', 'descartado')
      WHEN 'descartado'        THEN NEW.estado IN ('pendiente', 'con_coincidencia', 'posible_duplicado')
      WHEN 'autodescartado'    THEN NEW.estado IN ('pendiente', 'con_coincidencia', 'posible_duplicado')
      WHEN 'aprobado'          THEN NEW.estado = 'descartado'
      ELSE false
    END;
  END IF;
  IF NOT permitido THEN
    PERFORM finn.rechazar('FN007', format('transición de movimiento no válida: %s → %s (§7.1)',
                          CASE WHEN TG_OP = 'INSERT' THEN '(alta)' ELSE OLD.estado::text END, NEW.estado));
  END IF;
  IF NEW.estado = 'autodescartado' THEN
    SELECT texto, recibido_en INTO v_texto, v_t FROM finn.sms_recibidos WHERE id = NEW.sms_id;
    IF NOT EXISTS (SELECT 1 FROM finn.sms_recibidos s
                   WHERE s.id <> NEW.sms_id AND s.texto = v_texto
                     AND s.recibido_en >= v_t - interval '10 minutes' AND s.recibido_en < v_t) THEN
      PERFORM finn.rechazar('FN007', 'solo se autodescarta un texto idéntico recibido en los 10 minutos anteriores (inv. 16)');
    END IF;
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_transicion_estado_bancario() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  permitido boolean;
BEGIN
  IF TG_OP = 'INSERT' THEN
    IF NEW.estado_bancario <> (CASE WHEN NEW.origen = 'importada' THEN 'confirmada' ELSE 'pendiente' END)::finn.estado_bancario THEN
      PERFORM finn.rechazar('FN007', 'estado bancario inicial: confirmada si es importada; pendiente en los demás orígenes (§7.2, A-3)');
    END IF;
    RETURN NEW;
  END IF;
  IF NEW.estado_bancario = OLD.estado_bancario THEN
    IF NEW.conciliacion_id IS DISTINCT FROM OLD.conciliacion_id THEN
      PERFORM finn.rechazar('FN007', 'una transacción conciliada no cambia de conciliación');
    END IF;
    RETURN NEW;
  END IF;
  permitido := CASE OLD.estado_bancario
    WHEN 'pendiente'  THEN NEW.estado_bancario IN ('confirmada', 'conciliada')
    WHEN 'confirmada' THEN NEW.estado_bancario IN ('pendiente', 'conciliada')
    WHEN 'conciliada' THEN NEW.estado_bancario = 'confirmada'
  END;
  IF NOT permitido THEN
    PERFORM finn.rechazar('FN007', format('transición de estado bancario no válida: %s → %s (§7.2)', OLD.estado_bancario, NEW.estado_bancario));
  END IF;
  IF NEW.estado_bancario = 'conciliada'
     AND NOT EXISTS (SELECT 1 FROM finn.conciliaciones k WHERE k.id = NEW.conciliacion_id AND finn.es_de_esta_transaccion(k.xmin)) THEN
    PERFORM finn.rechazar('FN010', 'una transacción se concilia solo al terminar su conciliación (OP-47)');
  END IF;
  RETURN NEW;
END $$;

CREATE FUNCTION finn.tg_transicion_ocurrencia() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF NEW.estado = OLD.estado AND NEW.transaccion_id IS NOT DISTINCT FROM OLD.transaccion_id THEN
    RETURN NEW;
  END IF;
  IF OLD.estado = 'registrada' AND NEW.estado = 'emparejada' AND NEW.transaccion_id = OLD.transaccion_id THEN
    RETURN NEW;
  END IF;
  PERFORM finn.rechazar('FN007', format('transición de ocurrencia no válida: %s → %s (§7.8)', OLD.estado, NEW.estado));
  RETURN NULL;
END $$;

-- ── Funciones de las restricciones diferidas (x_) ──

CREATE FUNCTION finn.tg_x_transaccion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME = 'transacciones' THEN
    IF TG_OP <> 'DELETE' THEN
      PERFORM finn.verificar_transaccion(NEW.id);
    END IF;
  ELSE
    PERFORM finn.verificar_transaccion(CASE WHEN TG_OP = 'DELETE' THEN OLD.transaccion_id ELSE NEW.transaccion_id END);
  END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION finn.tg_x_limites() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  r record;
BEGIN
  CASE TG_TABLE_NAME
  WHEN 'lineas' THEN
    IF TG_OP <> 'INSERT' AND OLD.linea_original_id IS NOT NULL THEN
      PERFORM finn.verificar_limites_linea(OLD.linea_original_id);
    END IF;
    IF TG_OP <> 'DELETE' THEN
      PERFORM finn.verificar_limites_linea(NEW.id);
      IF NEW.linea_original_id IS NOT NULL THEN
        PERFORM finn.verificar_limites_linea(NEW.linea_original_id);
      END IF;
    END IF;
  WHEN 'condonaciones' THEN
    PERFORM finn.verificar_limites_linea(CASE WHEN TG_OP = 'DELETE' THEN OLD.linea_id ELSE NEW.linea_id END);
  WHEN 'transacciones' THEN
    IF TG_OP <> 'INSERT' AND OLD.linea_cobrada_id IS NOT NULL THEN
      PERFORM finn.verificar_limites_linea(OLD.linea_cobrada_id);
    END IF;
    IF TG_OP <> 'DELETE' THEN
      IF NEW.linea_cobrada_id IS NOT NULL THEN
        PERFORM finn.verificar_limites_linea(NEW.linea_cobrada_id);
      END IF;
      IF TG_OP = 'UPDATE' AND NEW.fecha IS DISTINCT FROM OLD.fecha THEN
        FOR r IN SELECT id, linea_original_id FROM finn.lineas WHERE transaccion_id = NEW.id LOOP
          PERFORM finn.verificar_limites_linea(r.id);
          IF r.linea_original_id IS NOT NULL THEN
            PERFORM finn.verificar_limites_linea(r.linea_original_id);
          END IF;
        END LOOP;
      END IF;
    END IF;
  ELSE
    NULL;
  END CASE;
  RETURN NULL;
END $$;

CREATE FUNCTION finn.tg_x_cuenta() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  r record;
BEGIN
  CASE TG_TABLE_NAME
  WHEN 'cuentas' THEN
    IF TG_OP <> 'DELETE' THEN
      PERFORM finn.verificar_cuenta(NEW.id);
    END IF;
  WHEN 'tarjetas', 'prestamos', 'inversiones' THEN
    PERFORM finn.verificar_cuenta(CASE WHEN TG_OP = 'DELETE' THEN OLD.cuenta_id ELSE NEW.cuenta_id END);
  WHEN 'efectos' THEN
    IF TG_OP <> 'INSERT' THEN
      PERFORM finn.verificar_cuenta(OLD.cuenta_id);
    END IF;
    IF TG_OP <> 'DELETE' THEN
      PERFORM finn.verificar_cuenta(NEW.cuenta_id);
    END IF;
  WHEN 'categorias' THEN
    IF TG_OP <> 'INSERT' AND OLD.tarjeta_id IS NOT NULL THEN
      PERFORM finn.verificar_cuenta(OLD.tarjeta_id);
    END IF;
    IF TG_OP <> 'DELETE' AND NEW.tarjeta_id IS NOT NULL THEN
      PERFORM finn.verificar_cuenta(NEW.tarjeta_id);
    END IF;
  WHEN 'transacciones' THEN
    FOR r IN SELECT cuenta_id FROM finn.efectos WHERE transaccion_id = NEW.id LOOP
      PERFORM finn.verificar_cuenta(r.cuenta_id);
    END LOOP;
  ELSE
    NULL;
  END CASE;
  RETURN NULL;
END $$;

CREATE FUNCTION finn.tg_x_categoria() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  r record;
BEGIN
  CASE TG_TABLE_NAME
  WHEN 'categorias' THEN
    PERFORM finn.verificar_categoria(NEW.id);
    PERFORM finn.verificar_grupo(NEW.grupo_id);
    IF TG_OP = 'UPDATE' AND OLD.grupo_id <> NEW.grupo_id THEN
      PERFORM finn.verificar_grupo(OLD.grupo_id);
    END IF;
  WHEN 'grupos' THEN
    PERFORM finn.verificar_grupo(NEW.id);
  WHEN 'asignaciones' THEN
    PERFORM finn.verificar_categoria(CASE WHEN TG_OP = 'DELETE' THEN OLD.categoria_id ELSE NEW.categoria_id END);
  WHEN 'programadas' THEN
    FOR r IN SELECT categoria_id FROM finn.programada_lineas WHERE programada_id = NEW.id LOOP
      PERFORM finn.verificar_categoria(r.categoria_id);
    END LOOP;
  WHEN 'programada_lineas' THEN
    PERFORM finn.verificar_categoria(NEW.categoria_id);
  ELSE
    NULL;
  END CASE;
  RETURN NULL;
END $$;

CREATE FUNCTION finn.tg_x_programada() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME = 'programadas' THEN
    PERFORM finn.verificar_programada(NEW.id);
  ELSE
    PERFORM finn.verificar_programada(CASE WHEN TG_OP = 'DELETE' THEN OLD.programada_id ELSE NEW.programada_id END);
  END IF;
  RETURN NULL;
END $$;

CREATE FUNCTION finn.tg_x_conciliacion() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF TG_TABLE_NAME = 'transacciones' THEN
    IF TG_OP = 'UPDATE' THEN
      PERFORM finn.verificar_conciliacion(NEW.id, OLD.estado_bancario, OLD.conciliacion_id,
                                          NEW.fecha IS DISTINCT FROM OLD.fecha OR NEW.total IS DISTINCT FROM OLD.total);
    ELSIF TG_OP = 'DELETE' AND OLD.estado_bancario = 'conciliada' THEN
      PERFORM finn.verificar_eliminacion_conciliada(OLD.conciliacion_id, OLD.fecha);
    END IF;
  ELSIF TG_OP IN ('INSERT', 'DELETE') OR NEW.monto IS DISTINCT FROM OLD.monto OR NEW.cuenta_id IS DISTINCT FROM OLD.cuenta_id THEN
    PERFORM finn.verificar_conciliacion(CASE WHEN TG_OP = 'DELETE' THEN OLD.transaccion_id ELSE NEW.transaccion_id END,
                                        NULL, NULL, true);
  END IF;
  RETURN NULL;
END $$;

-- HZ-1: lo que se eliminó con la excepción eliminar_cuenta pertenece a una cuenta que ya no existe
CREATE FUNCTION finn.tg_x_eliminacion_cuenta() RETURNS trigger
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
BEGIN
  IF finn.operacion() IS DISTINCT FROM 'eliminar_cuenta' THEN
    RETURN NULL;
  END IF;
  CASE TG_TABLE_NAME
  WHEN 'asignaciones' THEN
    IF OLD.periodo_inicio < finn.inicio_del_periodo(finn.hoy())
       AND EXISTS (SELECT 1 FROM finn.categorias WHERE id = OLD.categoria_id) THEN
      PERFORM finn.rechazar('FN012', 'la excepción F1 solo aplica si la tarjeta y su categoría de pago se eliminan (OP-06)');
    END IF;
  WHEN 'conciliaciones' THEN
    IF EXISTS (SELECT 1 FROM finn.cuentas WHERE id = OLD.cuenta_id) THEN
      PERFORM finn.rechazar('FN012', 'una conciliación solo se elimina junto con su cuenta (OP-06, HZ-1)');
    END IF;
  WHEN 'cambios_posteriores' THEN
    IF EXISTS (SELECT 1 FROM finn.conciliaciones WHERE id = OLD.conciliacion_id) THEN
      PERFORM finn.rechazar('FN012', 'un cambio posterior solo se elimina junto con su conciliación (OP-06, HZ-1)');
    END IF;
  ELSE
    NULL;
  END CASE;
  RETURN NULL;
END $$;

-- ═════════════════════════ 5. Verificación completa (12, 11.5) ═════════════════════════

-- Ejecuta todas las verificaciones sobre todos los hechos. La usan la prueba de
-- restauración (los datos restaurados no pasan por los triggers) y la CI.
CREATE FUNCTION finn.verificar_todo() RETURNS bigint
LANGUAGE plpgsql SECURITY DEFINER SET search_path = finn, pg_catalog AS $$
DECLARE
  r record;
  n bigint := 0;
BEGIN
  FOR r IN SELECT id FROM finn.transacciones LOOP
    PERFORM finn.verificar_transaccion(r.id);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT id FROM finn.lineas LOOP
    PERFORM finn.verificar_limites_linea(r.id);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT id FROM finn.cuentas LOOP
    PERFORM finn.verificar_cuenta(r.id);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT id FROM finn.categorias LOOP
    PERFORM finn.verificar_categoria(r.id);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT id FROM finn.grupos LOOP
    PERFORM finn.verificar_grupo(r.id);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT id FROM finn.programadas LOOP
    PERFORM finn.verificar_programada(r.id);
    n := n + 1;
  END LOOP;
  FOR r IN SELECT periodo_inicio FROM finn.asignaciones LOOP
    IF NOT finn.es_inicio_de_periodo(r.periodo_inicio) THEN
      PERFORM finn.rechazar('FN002', format('asignación en %s, que no es un inicio de período', r.periodo_inicio));
    END IF;
    n := n + 1;
  END LOOP;
  IF (SELECT count(*) FROM finn.vigencias_ciclo WHERE rige_desde IS NULL) <> 1 THEN
    PERFORM finn.rechazar('FN002', 'debe existir exactamente una primera vigencia');
  END IF;
  RETURN n;
END $$;

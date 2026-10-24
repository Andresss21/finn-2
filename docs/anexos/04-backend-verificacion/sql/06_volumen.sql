-- Datos de volumen para V-13 y V-16: 50.000 transacciones, 60.000 líneas, 7.000 asignaciones.
-- Ejecutar después de 00_subconjunto.sql y antes de 01_secuencia.sql.
BEGIN;
SELECT finn.tomar_bloqueo();
-- Carga histórica: usa la excepción de la fusión para poder escribir asignaciones de períodos cerrados (solo datos de prueba).
SELECT set_config('finn.operacion', 'fusion', true);
INSERT INTO finn.transacciones (id, fecha, hora_registro, clave_orden, total, comercio)
SELECT gen_random_uuid(), d::date, d, d, 1000 + (g % 9000), CASE WHEN g % 50 = 0 THEN 'W' ELSE 'C' END || (g % 400)
FROM generate_series(1, 50000) g, LATERAL (SELECT timestamptz '2016-10-01 12:00Z' + (g * interval '105 minutes') AS d) x;
-- 40.000 con una línea; 10.000 con dos (60.000 líneas en total)
WITH t AS (SELECT id, total, row_number() OVER (ORDER BY clave_orden) n FROM finn.transacciones)
INSERT INTO finn.lineas (transaccion_id, orden, monto)
SELECT id, 1, CASE WHEN n % 5 = 0 THEN total - 500 ELSE total END FROM t
UNION ALL
SELECT id, 2, 500 FROM t WHERE n % 5 = 0;
INSERT INTO finn.asignaciones (categoria_id, periodo_inicio, monto)
SELECT c.id, (date '2016-10-21' + (p * interval '1 month'))::date, 5000 + p
FROM (SELECT gen_random_uuid() id FROM generate_series(1, 70)) c, generate_series(0, 99) p;
COMMIT;

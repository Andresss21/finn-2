-- tools/db/reinicio-primera-vez.sql — [CH-220] Deja `finn` como recién sembrada (03 §9), conservando el usuario de Auth.
-- Lo ejecuta el usuario en el editor SQL de Supabase, con el rol `postgres`, siguiendo PRU-MAN-OPER-004 y después de
-- un respaldo manual en verde. Excepción explícita a DP-30 (07): no corrige hechos, borra todos los del usuario antes
-- de empezar el uso real (CH-220). Ningún agente lo ejecuta contra la base real.
--
-- Vacía (28): las 18 [M] (vigencias_ciclo, cuentas, tarjetas, prestamos, inversiones, grupos, categorias,
--   asignaciones, deudores, transacciones, efectos, lineas, condonaciones, metas, programadas, programada_lineas,
--   ocurrencias_resueltas, conciliaciones); las [H] del usuario (movimientos, movimiento_lineas, reglas_comercio,
--   cambios_posteriores); las [I] (sms_recibidos, sms_procesamientos); y las [T] del usuario (notificaciones,
--   suscripciones_push, token_webhook, eliminaciones).
-- Conserva (6): instituciones y formatos_bancarios (catálogo, DB-17); estado_respaldo (FT-76, ADR-22);
--   eventos_sistema (registro del sistema: auditoría de formatos EN-1, idempotencia de la tarea diaria BE-50,
--   primer hecho CH-47; se purga a los 90 días); revision (avanza: ver abajo); _prisma_migrations. También el
--   esquema, los privilegios y la secuencia finn.secuencia_creacion (monótona, 03 §5.4).
--
-- Por qué TRUNCATE y no DELETE: `e_solo_insercion` (03 §4.5.6) rechaza el DELETE de SMS, procesamientos,
-- conciliaciones y cambios posteriores, y es por fila; TRUNCATE no dispara triggers de fila ni las verificaciones
-- diferidas, pero sí `a_exigir_bloqueo` (por eso se toma el bloqueo) y `b_avanzar_revision`, que en TRUNCATE fija
-- `revision_minima_incremental` = `valor`: toda instancia con memoria vuelve a cargar todo (03 §5.3). Solo el dueño
-- puede hacer TRUNCATE (03 §5.2), así que se actúa como finn_migraciones con la concesión temporal de CH-53
-- (tools/db/bootstrap.sql). Sin CASCADE: si una tabla conservada apuntara a una vaciada, falla sin tocar nada.
-- Una sola transacción: si algo falla, no cambia nada. Se puede repetir.
BEGIN;
GRANT finn_migraciones TO CURRENT_USER WITH SET TRUE, INHERIT FALSE;
SET LOCAL ROLE finn_migraciones;
SELECT finn.tomar_bloqueo();

TRUNCATE
  finn.vigencias_ciclo, finn.cuentas, finn.tarjetas, finn.prestamos, finn.inversiones, finn.grupos, finn.categorias,
  finn.asignaciones, finn.deudores, finn.transacciones, finn.efectos, finn.lineas, finn.condonaciones, finn.metas,
  finn.programadas, finn.programada_lineas, finn.ocurrencias_resueltas, finn.conciliaciones,
  finn.movimientos, finn.movimiento_lineas, finn.reglas_comercio, finn.cambios_posteriores,
  finn.sms_recibidos, finn.sms_procesamientos,
  finn.notificaciones, finn.suscripciones_push, finn.token_webhook, finn.eliminaciones;

-- 03 §9.2 y §9.3: las filas de la migración de datos iniciales (20261011000600_m_datos_iniciales)
INSERT INTO finn.vigencias_ciclo (dia_inicio, rige_desde) VALUES (21, NULL);
INSERT INTO finn.grupos (nombre, orden, archivado, clave_sistema)
VALUES ('Pagos de tarjeta', 0, false, 'pagos_tarjeta');

RESET ROLE;
REVOKE finn_migraciones FROM CURRENT_USER;
COMMIT;

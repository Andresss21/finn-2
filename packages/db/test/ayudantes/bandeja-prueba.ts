// Filas [H] y [T] para las pruebas de las consultas (TA-169): cuatro movimientos de la bandeja (dos pendientes, un
// error, un no reconocido) y dos notificaciones sin leer (una de AV-01). Ninguna es de las 18 tablas [M], así que
// no cambian `finn.revision`. Se escriben como administrador: la prueba no tiene operaciones para estas tablas.
import pg from 'pg';
import type { BasePrueba } from './base.ts';

export async function sembrarBandejaYNotificaciones(base: BasePrueba): Promise<void> {
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    await admin.query(`
      BEGIN;
      SELECT finn.tomar_bloqueo();
      WITH s AS (INSERT INTO finn.sms_recibidos (texto, remitente)
                 VALUES ('1', 'banco'), ('2', 'banco'), ('3', 'banco'), ('4', 'banco')
                 RETURNING id, texto)
      INSERT INTO finn.movimientos (sms_id, estado)
      SELECT id, CASE texto WHEN '3' THEN 'error' WHEN '4' THEN 'no_reconocido'
                            ELSE 'pendiente' END::finn.estado_movimiento FROM s;
      INSERT INTO finn.notificaciones (aviso, motivo, titulo, cuerpo) VALUES
        ('AV-01', 'cambio_retroactivo', 'Cambió un período', 'Resumen'),
        ('AV-23', 'bandeja', 'Movimiento nuevo', 'Resumen');
      COMMIT;`);
  } finally {
    await admin.end();
  }
}

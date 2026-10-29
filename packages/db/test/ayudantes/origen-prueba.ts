// Filas [H] e [I] para las pruebas de las consultas de cuentas y actividad (TA-171): el SMS aprobado que originó la
// transacción 4 y un cambio posterior de la conciliación 15. Ninguna es de las 18 tablas [M], así que no cambian
// `finn.revision`. Se escriben como administrador: la prueba no tiene operaciones para estas tablas.
import pg from 'pg';
import type { BasePrueba } from './base.ts';

export async function sembrarOrigenYCambios(
  base: BasePrueba,
  transaccionId: string,
  conciliacionId: string,
): Promise<void> {
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    await admin.query('BEGIN; SELECT finn.tomar_bloqueo();');
    // El alta es pendiente; la aprobación liga el movimiento a su transacción (§7.1)
    await admin.query(
      `WITH s AS (INSERT INTO finn.sms_recibidos (texto, remitente, recibido_en)
                  VALUES ('Compra Super $12.50', 'banco', '2027-01-22T15:00:00.000Z') RETURNING id)
       INSERT INTO finn.movimientos (sms_id, estado) SELECT id, 'pendiente' FROM s`,
    );
    await admin.query(`UPDATE finn.movimientos SET estado = 'aprobado', transaccion_id = $1`, [
      transaccionId,
    ]);
    await admin.query(
      `INSERT INTO finn.cambios_posteriores (conciliacion_id, motivos, fecha, monto_efecto, comercio)
       VALUES ($1, ARRAY['monto']::finn.motivo_cambio[], '2027-01-30', -1000, 'Pago')`,
      [conciliacionId],
    );
    await admin.query('COMMIT;');
  } finally {
    await admin.end();
  }
}

// 52 notificaciones [T] para la consulta del centro (TA-197; 04 §6.12.5): destinos válidos con la entidad presente y
// ausente, un destino que no valida, uno sin destino, una leída y 46 más para cruzar la página de 50. Ninguna es de las
// 18 tablas [M], así que no cambian `finn.revision`. `n<k>` es el título; `k` crece con la fecha de creación.
import pg from 'pg';
import type { BasePrueba } from './base.ts';
import { MOVIMIENTOS } from './ajustes-prueba.ts';

export const INEXISTENTE = '00000000-0000-4000-8000-0000000fffff';
const TX_SUPER = '00000000-0000-4000-8000-000000000104';

export async function sembrarNotificacionesDelCentro(base: BasePrueba): Promise<void> {
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    const fila = (n: number, motivo: string, destino: unknown, leida: boolean) =>
      admin.query(
        `INSERT INTO finn.notificaciones (id, creada_en, aviso, motivo, titulo, cuerpo, datos, leida_en)
         VALUES ($1, timestamptz '2027-02-04T12:00:00Z' + ($2 || ' minutes')::interval, NULL, $3, $4, 'cuerpo', $5::jsonb,
                 CASE WHEN $6::boolean THEN timestamptz '2027-02-04T13:00:00Z' END)`,
        [
          `00000000-0000-4000-8000-0000000a00${String(n).padStart(2, '0')}`,
          n,
          motivo,
          `n${n}`,
          destino === undefined ? null : JSON.stringify({ destino }),
          leida,
        ],
      );
    await fila(
      1,
      'sms_nuevo',
      { pantalla: 'movimiento', movimientoId: MOVIMIENTOS.pendiente },
      false,
    );
    await fila(2, 'sms_nuevo', { pantalla: 'movimiento', movimientoId: INEXISTENTE }, false);
    await fila(
      3,
      'registro_automatico',
      { pantalla: 'transaccion', transaccionId: TX_SUPER },
      true,
    );
    await fila(
      4,
      'registro_automatico',
      { pantalla: 'transaccion', transaccionId: INEXISTENTE },
      false,
    );
    await fila(5, 'tarea_fallida', { pantalla: 'no_existe' }, false);
    await fila(6, 'cambio_retroactivo', undefined, false);
    for (let n = 7; n <= 52; n++) await fila(n, 'cierre_periodo', { pantalla: 'inicio' }, false);
  } finally {
    await admin.end();
  }
}

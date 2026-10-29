// Filas [H], [I] y [T] para las pruebas de la bandeja y de Ajustes (TA-172): los ocho estados de movimiento de 01 §7.1
// con sus SMS, líneas y procesamientos, dos formatos bancarios, y por separado el token, la suscripción push, los
// eventos y el respaldo. Ninguna es de las 18 tablas [M], así que no cambian `finn.revision`. Se escriben como
// administrador: la prueba no tiene operaciones para estas tablas. Los ids son fijos para comparar.
import pg from 'pg';
import type { BasePrueba } from './base.ts';

const m = (n: number): string => `00000000-0000-4000-8000-0000000009${String(n).padStart(2, '0')}`;
/** Los movimientos sembrados: pendiente, coincidencia, duplicado, no reconocido, error, descartado, autodescartado. */
export const MOVIMIENTOS = {
  pendiente: m(1),
  conCoincidencia: m(2),
  posibleDuplicado: m(3),
  noReconocido: m(4),
  error: m(5),
  descartado: m(6),
  autodescartado: m(7),
} as const;
export const FORMATO_ACTIVO = '00000000-0000-4000-8000-000000000801';
export const FORMATO_INACTIVO = '00000000-0000-4000-8000-000000000802';

async function comoAdmin(base: BasePrueba, sql: string): Promise<void> {
  const admin = new pg.Client({ connectionString: base.urlAdmin });
  await admin.connect();
  try {
    await admin.query(`BEGIN; SELECT finn.tomar_bloqueo(); ${sql} COMMIT;`);
  } finally {
    await admin.end();
  }
}

const PATRON = String.raw`(?<ultimos4>\d{4}) (?<monto>\d+)`;

/**
 * Siete movimientos con la cuenta, la fecha y el monto de la base de `hechos-prueba` (Efectivo, gasto "Super" de
 * la transacción 104 y Netflix programada 17). Los SMS llegan en minutos consecutivos del 2027-02-04.
 */
export async function sembrarBandejaCompleta(base: BasePrueba): Promise<void> {
  const cuenta = '00000000-0000-4000-8000-000000000001';
  const comida = '00000000-0000-4000-8000-000000000011';
  const sms = [1, 2, 3, 4, 5, 6, 7]
    .map(
      (n) =>
        `('${m(n + 50)}', '${n === 7 ? 'compra super' : n === 1 ? 'compra super' : `sms ${n}`}', 'banco', timestamptz '2027-02-04T10:00:00Z' + interval '${n} minutes')`,
    )
    .join(', ');
  const mov = (n: number, estado: string, resto: string): string =>
    `INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto ${resto.split('|')[0]})
     VALUES ('${m(n)}', '${m(n + 50)}', '${estado}', ${resto.split('|')[1]});`;
  await comoAdmin(
    base,
    `
    INSERT INTO finn.instituciones (nombre) VALUES ('Institución de prueba');
    INSERT INTO finn.formatos_bancarios (id, institucion_id, nombre, tipo_movimiento, patron, activo)
      SELECT '${FORMATO_ACTIVO}', id, 'Compra', 'compra', '${PATRON}', true
      FROM finn.instituciones WHERE nombre = 'Institución de prueba';
    INSERT INTO finn.formatos_bancarios (id, institucion_id, nombre, tipo_movimiento, patron, activo)
      SELECT '${FORMATO_INACTIVO}', id, 'Depósito', 'deposito', '${PATRON}', false
      FROM finn.instituciones WHERE nombre = 'Institución de prueba';
    INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en) VALUES ${sms};
    ${mov(1, 'pendiente', `|'${cuenta}', date '2027-02-04', 1250, 'Super', 'gasto'`)}
    ${mov(2, 'con_coincidencia', `, esperada_programada_id, esperada_fecha|'${cuenta}', date '2027-02-25', 1500, 'Netflix', 'gasto', '00000000-0000-4000-8000-000000000017', date '2027-02-25'`)}
    ${mov(3, 'posible_duplicado', `, duplicado_transaccion_id|'${cuenta}', date '2027-01-22', 1250, 'Super', 'gasto', '00000000-0000-4000-8000-000000000104'`)}
    ${mov(4, 'no_reconocido', `|NULL, NULL, NULL, NULL, NULL`)}
    ${mov(5, 'error', `|NULL, NULL, NULL, NULL, NULL`)}
    ${mov(6, 'pendiente', `|'${cuenta}', date '2027-02-01', 500, 'Otro', 'gasto'`)}
    UPDATE finn.movimientos SET estado = 'descartado' WHERE id = '${m(6)}';
    ${mov(7, 'autodescartado', `|NULL, NULL, NULL, NULL, NULL`)}
    INSERT INTO finn.movimiento_lineas (movimiento_id, orden, monto, categoria_id)
      VALUES ('${m(1)}', 1, 1250, '${comida}');
    INSERT INTO finn.sms_procesamientos (sms_id, intento, resultado, error_detalle)
      VALUES ('${m(51)}', 1, 'error', 'intento viejo');
    INSERT INTO finn.sms_procesamientos (sms_id, intento, resultado, formato_id, formatos_coincidentes, tipo_movimiento)
      VALUES ('${m(51)}', 2, 'pendiente', '${FORMATO_ACTIVO}', ARRAY['${FORMATO_ACTIVO}']::uuid[], 'compra');
    INSERT INTO finn.sms_procesamientos (sms_id, intento, resultado, formatos_coincidentes)
      VALUES ('${m(54)}', 1, 'no_reconocido', ARRAY['${FORMATO_ACTIVO}', '${FORMATO_INACTIVO}']::uuid[]);
    INSERT INTO finn.sms_procesamientos (sms_id, intento, resultado, error_detalle)
      VALUES ('${m(55)}', 1, 'error', 'formato no reconocido');
    `,
  );
}

/** Token, suscripción push, eventos del sistema y un uso más del formato activo (la tabla [T] y [I] de Ajustes). */
export async function sembrarAjustesTecnicos(base: BasePrueba): Promise<void> {
  await comoAdmin(
    base,
    `
    INSERT INTO finn.token_webhook (id, hash_sha256, creado_en)
      VALUES (1, repeat('ab', 32), timestamptz '2027-02-01T12:00:00Z');
    INSERT INTO finn.suscripciones_push (endpoint, clave_p256dh, clave_auth, agente, renovada_en)
      VALUES ('https://push.ejemplo.test/send/abcdefgh12345678', 'clave-secreta-1', 'clave-secreta-2', 'Pixel',
              timestamptz '2027-02-03T08:00:00Z');
    INSERT INTO finn.eventos_sistema (ocurrido_en, nivel, origen, mensaje, datos) VALUES
      (timestamptz '2027-02-01T00:00:00Z', 'info', 'app', 'arranque', NULL),
      (timestamptz '2027-02-02T00:00:00Z', 'aviso', 'tarea_diaria', 'respaldo atrasado', NULL),
      (timestamptz '2027-02-03T00:00:00Z', 'error', 'app', 'INTERNO interno inicio', '{"idError":"E-ABC123"}');
    INSERT INTO finn.sms_procesamientos (sms_id, intento, resultado, formato_id, formatos_coincidentes, tipo_movimiento)
      VALUES ('${m(52)}', 1, 'pendiente', '${FORMATO_ACTIVO}', ARRAY['${FORMATO_ACTIVO}']::uuid[], 'compra');
    `,
  );
}

/** El estado del respaldo, con las edades como intervalos de la base (`'40 hours'`): independiente del reloj de pared. */
export async function fijarRespaldo(
  base: BasePrueba,
  respaldoHace: string,
  restauracionHace: string,
): Promise<void> {
  await comoAdmin(
    base,
    `INSERT INTO finn.estado_respaldo (id, ultimo_respaldo_en, ultima_restauracion_en)
       VALUES (1, now() - interval '${respaldoHace}', now() - interval '${restauracionHace}')
       ON CONFLICT (id) DO UPDATE SET ultimo_respaldo_en = EXCLUDED.ultimo_respaldo_en,
                                      ultima_restauracion_en = EXCLUDED.ultima_restauracion_en;`,
  );
}

/** El movimiento pendiente que propone una devolución (CH-30): Efectivo, 2027-02-05, 100 centavos, "Super". */
export const MOVIMIENTO_DEVOLUCION = '00000000-0000-4000-8000-000000000990';

export async function sembrarMovimientoDeDevolucion(base: BasePrueba): Promise<void> {
  const sms = '00000000-0000-4000-8000-000000000991';
  await comoAdmin(
    base,
    `INSERT INTO finn.sms_recibidos (id, texto, remitente, recibido_en)
       VALUES ('${sms}', 'devolucion super', 'banco', timestamptz '2027-02-05T10:00:00Z');
     INSERT INTO finn.movimientos (id, sms_id, estado, cuenta_id, fecha, monto, comercio, tipo_propuesto)
       VALUES ('${MOVIMIENTO_DEVOLUCION}', '${sms}', 'pendiente', '00000000-0000-4000-8000-000000000001',
               date '2027-02-05', 100, 'Super', 'devolucion');`,
  );
}

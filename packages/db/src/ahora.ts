// Respaldo b) de P7-12 (07 §32.1; CT-02, CH-24; TA-157). Las 9 columnas de instantes técnicos conservan su
// `DEFAULT now()` de producción, porque C4 no queda vacío con `dbgenerated("finn.ahora()")`, y la aplicación
// las escribe siempre con `finn.ahora()`: así el reloj simulado de las bases de prueba (07 §4.1) llega también
// a ellas. La regla L21 (tools/lint/l21.mjs) rechaza en @finn/db una inserción en esas tablas sin la columna.
// `eliminaciones.eliminada_en` la escribe el trigger `tg_registrar_eliminacion` (m_eliminaciones_ahora).
import { txPrismaT, type EscritorTecnicoTx, type LectorTx } from './transacciones.ts';

/** Modelo de Prisma → sus columnas de instante técnico (03 §3.17–§3.28; las 9 de CT-02). */
export const COLUMNAS_AHORA = {
  smsRecibido: ['recibidoEn'],
  smsProcesamiento: ['procesadoEn'],
  cambioPosterior: ['registradoEn'],
  eliminacion: ['eliminadaEn'],
  suscripcionPush: ['creadaEn', 'renovadaEn'],
  notificacion: ['creadaEn'],
  eventoSistema: ['ocurridoEn'],
  tokenWebhook: ['creadoEn'],
} as const satisfies Record<string, readonly string[]>;

export type ModeloConAhora = keyof typeof COLUMNAS_AHORA;

// Un valor por transacción: `finn.ahora()` es STABLE (now() + desfase), igual en toda la transacción
const deTransaccion = new WeakMap<LectorTx | EscritorTecnicoTx, Promise<Date>>();

/**
 * `finn.ahora()` de la transacción de `tx`, truncado al milisegundo: el `Date` de JavaScript no tiene
 * microsegundos, y así lo que se escribe es exactamente el valor leído (como el `instante` de 04 §4.2).
 */
export function ahoraDb(tx: LectorTx | EscritorTecnicoTx): Promise<Date> {
  let ahora = deTransaccion.get(tx);
  if (!ahora) {
    ahora = txPrismaT(tx).$queryRaw<
      { ahora: Date }[]
    >`SELECT date_trunc('milliseconds', finn.ahora()) AS ahora`.then(([f]) => {
      if (!(f?.ahora instanceof Date)) throw new Error('finn.ahora() no devolvió un instante');
      return f.ahora;
    });
    deTransaccion.set(tx, ahora);
  }
  return ahora;
}

/**
 * La fila de `modelo` con sus columnas de instante técnico en `ahora` (de `ahoraDb()`). Para un modelo sin
 * esas columnas devuelve la fila igual: el traductor puede pasar por aquí todas sus inserciones.
 */
export function conAhora<F extends object>(modelo: string, fila: F, ahora: Date): F {
  const columnas: readonly string[] = Object.hasOwn(COLUMNAS_AHORA, modelo)
    ? COLUMNAS_AHORA[modelo as ModeloConAhora]
    : [];
  if (columnas.length === 0) return fila;
  return { ...fila, ...Object.fromEntries(columnas.map((c) => [c, ahora])) };
}

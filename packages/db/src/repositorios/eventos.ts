// Repositorio de `eventos_sistema` [T] y reglas de saneamiento de 04 §7.8 y §15.3 (BE-26).
// El registro de un error no guarda entrada del usuario, textos de SMS, contenido de CSV, tokens ni el mensaje
// original de la base: `sanearMensaje()` y `sanearDatos()` son lo único que escribe `datos`.
import { ahoraDb, conAhora } from '../ahora.ts';
import { txPrisma, txPrismaT, type EscritorTablasT, type LectorTx } from '../transacciones.ts';

const UUID = '[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}';
// Un texto entre comillas, un UUID (se conserva) o un número con separadores decimales
const PIEZA = new RegExp(
  `(["'\`])(?:(?!\\1)[^])*\\1|${UUID}|(?<![\\w])\\d+(?:[.,]\\d+)*(?![\\w])`,
  'g',
);
// Un nombre entre comillas tras estas palabras es de la base (restricción, índice, tabla…), no un dato
const NOMBRE_DE_LA_BASE =
  /(?:constraint|restricci[oó]n|[ií]ndice|index|relaci[oó]n|relation|tabla|table|columna|column)\s+$/i;

/** El mensaje de la base con cada número y cada texto entre comillas en `#`; conserva UUID y nombres (7.8). */
export function sanearMensaje(mensaje: string): string {
  return mensaje.replace(PIEZA, (pieza: string, comilla: string | undefined, desde: number) => {
    if (comilla === undefined) return /^[0-9a-f]{8}-/i.test(pieza) ? pieza : '#';
    const nombre = pieza.slice(1, -1);
    const esNombre =
      /^[a-z_][a-z0-9_.]*$/.test(nombre) && NOMBRE_DE_LA_BASE.test(mensaje.slice(0, desde));
    return esNombre ? pieza : '#';
  });
}

// Claves que nunca van en `datos` (04 §15.3), comparadas sin mayúsculas ni guiones bajos
const PROHIBIDAS = new Set([
  'token',
  'cookie',
  'cookies',
  'authorization',
  'cabeceras',
  'headers',
  'texto',
  'sms',
  'cuerpo',
  'body',
  'csv',
  'contenido',
  'monto',
  'montos',
  'importe',
  'comercio',
  'nota',
  'notas',
  'deudor',
  'nombre',
  'nombres',
  'mensajeoriginal',
  'password',
  'clave',
  'secreto',
  'entrada',
]);

export type DatosEvento = { readonly [clave: string]: DatoJson };
export type DatoJson = string | number | boolean | null | readonly DatoJson[] | DatosEvento;

/** `datos` sin las claves prohibidas, a cualquier profundidad, y con `mensajeSaneado` pasado por `sanearMensaje`. */
export function sanearDatos(datos: DatoJson): DatoJson {
  if (Array.isArray(datos)) return datos.map((d: DatoJson) => sanearDatos(d));
  if (datos === null || typeof datos !== 'object') return datos;
  const salida: Record<string, DatoJson> = {};
  for (const [clave, valor] of Object.entries(datos as DatosEvento)) {
    if (PROHIBIDAS.has(clave.replace(/_/g, '').toLowerCase())) continue;
    salida[clave] =
      clave === 'mensajeSaneado' && typeof valor === 'string'
        ? sanearMensaje(valor)
        : sanearDatos(valor);
  }
  return salida;
}

export type OrigenEvento = 'webhook' | 'tarea_diaria' | 'motor' | 'respaldo' | 'app';
export type NuevoEvento = {
  nivel: 'info' | 'aviso' | 'error';
  origen: OrigenEvento;
  /** `<categoria> <codigo> <operacion>` u otro mensaje del catálogo (04 §15.2); no se sanea. */
  mensaje: string;
  datos?: DatosEvento;
};

/**
 * Inserta una fila. El llamador la hace en una transacción propia, sin bloqueo y después del `ROLLBACK`
 * (04 §7.8); si falla, queda solo la línea de la consola.
 */
export async function registrarEvento(tx: EscritorTablasT, e: NuevoEvento): Promise<bigint> {
  const ahora = await ahoraDb(tx);
  const fila = {
    nivel: e.nivel,
    origen: e.origen,
    mensaje: e.mensaje,
    ...(e.datos ? { datos: sanearDatos(e.datos) as never } : {}),
  };
  const creada = await txPrismaT(tx).eventoSistema.create({
    data: conAhora('eventoSistema', fila, ahora),
    select: { id: true },
  });
  return creada.id;
}

/** Diagnóstico (04 §15.4): los eventos más recientes de nivel `aviso` o `error`. */
export function eventosRecientes(tx: LectorTx, limite = 50) {
  return txPrisma(tx).eventoSistema.findMany({
    where: { nivel: { in: ['aviso', 'error'] } },
    orderBy: { id: 'desc' },
    take: limite,
  });
}

/** El evento con ese `idError` (04 §15.4, paso 3). */
export function eventoPorIdError(tx: LectorTx, idError: string) {
  return txPrisma(tx).eventoSistema.findFirst({
    where: { datos: { path: ['idError'], equals: idError } },
  });
}

/** Retención de 90 días (04 §15.1): borra lo anterior a `antesDe`, salvo la auditoría de formatos (EN-1). */
export async function purgarEventos(tx: EscritorTablasT, antesDe: Date): Promise<number> {
  const r = await txPrismaT(tx).eventoSistema.deleteMany({
    where: { ocurridoEn: { lt: antesDe }, NOT: { mensaje: { startsWith: 'auditoria_formato' } } },
  });
  return r.count;
}

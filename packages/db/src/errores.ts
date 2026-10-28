// Extracción del SQLSTATE de un error de la base (04 §7.3; V-01, V-03, V-06, V-10; DB-23). Reconoce por forma, sin
// importar clases de Prisma: el error puede venir de una operación de modelo (P2039), de una consulta cruda
// (P2010), de una unicidad o clave foránea (P2002, P2003) o del COMMIT (DriverAdapterError, restricciones
// diferidas). El mensaje de la base nunca decide nada.

export interface SqlstateDe {
  readonly sqlstate: string;
  /** Nombre del índice o restricción (`P2002`: `cause.constraint.index`). */
  readonly restriccion?: string;
  readonly tabla?: string;
  /** El código de Prisma (`P2039`, `P2002`…), ausente en un `DriverAdapterError`. */
  readonly codigoPrisma?: string;
}

const esObjeto = (x: unknown): x is Record<string, unknown> => typeof x === 'object' && x !== null;
const texto = (x: unknown): string | undefined =>
  typeof x === 'string' && x !== '' ? x : undefined;

/** El SQLSTATE de `error` y lo que lo acompaña, o `null` si el error no viene de la base (04 §7.3). */
export function sqlstateDe(error: unknown): SqlstateDe | null {
  if (!esObjeto(error)) return null;
  const codigoPrisma = texto(error['code']);
  const esPrisma = codigoPrisma !== undefined && /^P\d{4}$/.test(codigoPrisma);
  // Prisma lleva la causa del adaptador en meta; el DriverAdapterError, directamente en `cause`
  const meta = esObjeto(error['meta']) ? error['meta'] : undefined;
  const adaptador = esObjeto(meta?.['driverAdapterError']) ? meta['driverAdapterError'] : undefined;
  const causa = esPrisma ? adaptador?.['cause'] : error['cause'];
  if (!esObjeto(causa)) return null;
  const sqlstate = texto(causa['originalCode']);
  if (sqlstate === undefined) return null;
  const restriccion = esObjeto(causa['constraint'])
    ? texto(causa['constraint']['index'])
    : undefined;
  const tabla = texto(causa['table']);
  return {
    sqlstate,
    ...(restriccion === undefined ? {} : { restriccion }),
    ...(tabla === undefined ? {} : { tabla }),
    ...(esPrisma ? { codigoPrisma } : {}),
  };
}

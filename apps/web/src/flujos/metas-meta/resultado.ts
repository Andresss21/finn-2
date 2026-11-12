// E4-18, E6-14 [CH-248]: editar una meta deja su resultado en la lista de Metas, en el lugar del aviso de la meta vencida. Lo lleva
// `?resultado=` en la URL de `/metas`: un código, el id de la meta y la fecha que escribió la persona; la lista busca el nombre de la
// categoría en lo que ya trae el servidor, así que la URL no lleva nombres ni montos (PF-3). Se valida al leer.

export type ResultadoMeta =
  | { readonly tipo: 'extendida'; readonly metaId: string; readonly fecha: string }
  | { readonly tipo: 'ajustada'; readonly metaId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const FECHA = /^\d{4}-\d{2}-\d{2}$/;

export const PARAMETRO_RESULTADO = 'resultado';

/** La ruta de la lista con el resultado a la vista. */
export function rutaMetasConResultado(r: ResultadoMeta): string {
  const valor =
    r.tipo === 'extendida' ? `extendida:${r.metaId}:${r.fecha}` : `ajustada:${r.metaId}`;
  return `/metas?${new URLSearchParams({ [PARAMETRO_RESULTADO]: valor }).toString()}`;
}

/** Lo contrario: `undefined` si el valor no es uno de los dos resultados con sus datos bien formados. */
export function leerResultadoMeta(valor: string | undefined): ResultadoMeta | undefined {
  const [tipo, metaId, fecha, resto] = (valor ?? '').split(':');
  if (resto !== undefined || metaId === undefined || !UUID.test(metaId)) return undefined;
  if (tipo === 'ajustada' && fecha === undefined) return { tipo, metaId };
  if (tipo === 'extendida' && fecha !== undefined && FECHA.test(fecha))
    return { tipo, metaId, fecha };
  return undefined;
}

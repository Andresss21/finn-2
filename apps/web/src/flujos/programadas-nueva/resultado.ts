// E6-14 [CH-248]: eliminar o guardar los cambios de una programada deja su resultado en la lista de Programadas, sin pantalla propia.
// Lo lleva `?resultado=` en la URL de `/programadas`: `eliminada`, o `ajustada:<id>`; la lista busca el nombre en lo que ya trae el
// servidor, así que la URL no lleva nombres ni montos (PF-3). Se valida al leer. Ninguno de los dos tiene operación inversa (05 §4.14).

export type ResultadoProgramada =
  { readonly tipo: 'eliminada' } | { readonly tipo: 'ajustada'; readonly programadaId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

export const PARAMETRO_RESULTADO = 'resultado';

/** La ruta de la lista con el resultado a la vista. */
export function rutaProgramadasConResultado(r: ResultadoProgramada): string {
  const valor = r.tipo === 'eliminada' ? 'eliminada' : `ajustada:${r.programadaId}`;
  return `/programadas?${new URLSearchParams({ [PARAMETRO_RESULTADO]: valor }).toString()}`;
}

/** Lo contrario: `undefined` si el valor no es uno de los dos resultados con sus datos bien formados. */
export function leerResultadoProgramada(
  valor: string | undefined,
): ResultadoProgramada | undefined {
  const [tipo, id, resto] = (valor ?? '').split(':');
  if (resto !== undefined) return undefined;
  if (tipo === 'eliminada' && id === undefined) return { tipo };
  if (tipo === 'ajustada' && id !== undefined && UUID.test(id)) return { tipo, programadaId: id };
  return undefined;
}

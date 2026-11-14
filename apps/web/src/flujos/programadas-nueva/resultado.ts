// E6-14 [CH-248]: eliminar o guardar los cambios de una programada deja su resultado en la lista de Programadas, sin pantalla propia.
// Lo lleva `?resultado=` en la URL de `/programadas`: `ajustada:<id>` o `desactivada:<id>`, y la lista busca el nombre en lo que ya
// trae el servidor (PF-3). [CH-281] `eliminada` lleva además `?nombre=`, porque la programada ya no está en la lista (como
// `?quitado=` de Seguridad, E2-8); nunca montos. Se valida al leer. Ninguno tiene operación inversa (05 §4.14).

export type ResultadoProgramada =
  | { readonly tipo: 'eliminada'; readonly nombre: string }
  | { readonly tipo: 'ajustada' | 'desactivada'; readonly programadaId: string };

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;
const NOMBRE_MAXIMO = 60;

export const PARAMETRO_RESULTADO = 'resultado';
export const PARAMETRO_NOMBRE = 'nombre';

/** La ruta de la lista con el resultado a la vista. */
export function rutaProgramadasConResultado(r: ResultadoProgramada): string {
  const q =
    r.tipo === 'eliminada'
      ? { [PARAMETRO_RESULTADO]: 'eliminada', [PARAMETRO_NOMBRE]: r.nombre }
      : { [PARAMETRO_RESULTADO]: `${r.tipo}:${r.programadaId}` };
  return `/programadas?${new URLSearchParams(q).toString()}`;
}

/** Lo contrario: `undefined` si el valor no es uno de los resultados con sus datos bien formados. */
export function leerResultadoProgramada(
  valor: string | undefined,
  nombre?: string,
): ResultadoProgramada | undefined {
  const [tipo, id, resto] = (valor ?? '').split(':');
  if (resto !== undefined) return undefined;
  const limpio = nombre?.trim().slice(0, NOMBRE_MAXIMO) ?? '';
  if (tipo === 'eliminada' && id === undefined && limpio !== '') return { tipo, nombre: limpio };
  if ((tipo === 'ajustada' || tipo === 'desactivada') && id !== undefined && UUID.test(id))
    return { tipo, programadaId: id };
  return undefined;
}

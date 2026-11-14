// [CH-270] Crear un grupo o una categoría cierra el panel y deja el resultado en la lista de la estructura (C-42, principio 5). Lo
// lleva `?resultado=` en la URL de `/presupuesto/estructura`: el tipo y el id creado; la lista busca el nombre en lo que ya trae
// `estructura()`, así que la URL no lleva nombres. Se valida al leer.

export interface ResultadoEstructura {
  readonly tipo: 'grupo' | 'categoria';
  readonly id: string;
}

const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

/** La ruta de la lista con el resultado a la vista. */
export function rutaEstructuraConResultado(r: ResultadoEstructura): string {
  return `/presupuesto/estructura?${new URLSearchParams({ resultado: `${r.tipo}:${r.id}` }).toString()}`;
}

/** Lo contrario: `undefined` si el valor no es `grupo:<Uuid>` ni `categoria:<Uuid>`. */
export function leerResultadoEstructura(
  valor: string | undefined,
): ResultadoEstructura | undefined {
  const [tipo, id, resto] = (valor ?? '').split(':');
  if (resto !== undefined || id === undefined || !UUID.test(id)) return undefined;
  return tipo === 'grupo' || tipo === 'categoria' ? { tipo, id } : undefined;
}

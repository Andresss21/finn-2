// Parámetros de búsqueda (05 §2.2, FE-27): la conversión mecánica de la URL a los parámetros de la consulta. El saneado de
// `?volver=` es `rutaInterna` de `@finn/aplicacion/autenticacion` (05 §3.6). Funciones puras, sin Next.

/** Lo que Next entrega como `searchParams` ya resuelto. */
export type BusquedaDePagina = Readonly<Record<string, string | readonly string[] | undefined>>;

// Nombre de la URL → campo de la consulta, cuando no es el camelCase del nombre (tabla de 2.2).
const CAMPO_DISTINTO: Readonly<Record<string, string>> = {
  periodo: 'periodoInicio',
  historial: 'periodos',
  'tipo-cuenta': 'tipo',
  'tipo-evento': 'tipo',
  cuentas: 'cuentaIds',
  categorias: 'categoriaIds',
  archivadas: 'incluirArchivadas',
  cerrados: 'incluirCerrados',
  'no-leidas': 'soloNoLeidas',
};
const LISTAS = new Set(['cuentas', 'categorias']);
const BANDERAS = new Set(['archivadas', 'cerrados', 'no-leidas']);
// Enumerados con guiones en la URL y guiones bajos en el contrato.
const ENUMERADOS = new Set([
  'filtro',
  'ventana',
  'tipo',
  'tipo-evento',
  'origen',
  'estado',
  'modalidad',
]);
// Los usa la interfaz: no llegan a ninguna consulta.
const SOLO_INTERFAZ = new Set(['volver', 'notificacion']);

const camel = (nombre: string): string =>
  nombre.replace(/-([a-z])/g, (_, letra: string) => letra.toUpperCase());

/** El campo de la consulta que corresponde a un parámetro de la URL. */
export const campoDeConsulta = (parametro: string): string =>
  CAMPO_DISTINTO[parametro] ?? camel(parametro);

/**
 * `?monto-desde=1` → `{ montoDesde: '1' }`, `?filtro=sin-fondos` → `{ filtro: 'sin_fondos' }`,
 * `?cuentas=a,b` → `{ cuentaIds: ['a', 'b'] }`, `?archivadas=1` → `{ incluirArchivadas: true }`. Un valor vacío cuenta
 * como ausente. Las fechas, los montos y los ids pasan como texto: los valida el contrato de la consulta.
 */
export function aParametrosDeConsulta(busqueda: BusquedaDePagina): Record<string, unknown> {
  const salida: Record<string, unknown> = {};
  for (const [nombre, crudo] of Object.entries(busqueda)) {
    const valor: string | undefined = typeof crudo === 'string' ? crudo : crudo?.[0];
    if (typeof valor !== 'string' || valor === '' || SOLO_INTERFAZ.has(nombre)) continue;
    if (BANDERAS.has(nombre)) {
      if (valor === '1') salida[campoDeConsulta(nombre)] = true;
    } else if (LISTAS.has(nombre)) {
      salida[campoDeConsulta(nombre)] = valor.split(',').filter((id) => id !== '');
    } else {
      salida[campoDeConsulta(nombre)] = ENUMERADOS.has(nombre) ? valor.replaceAll('-', '_') : valor;
    }
  }
  return salida;
}

/**
 * La misma ruta sin los parámetros cuyo campo de consulta figura en `campos` (las claves de `ErrorFinn.campos`, que
 * pueden ir con ruta de puntos: se toma el primer tramo). Si no quita ninguno, devuelve `null`: redirigir a la misma
 * URL sería un bucle.
 */
export function rutaSinParametros(ruta: string, campos: readonly string[]): string | null {
  const [camino = '', busqueda = ''] = ruta.split('?', 2);
  const invalidos = new Set(campos.map((c) => c.split('.')[0]));
  const quedan = new URLSearchParams();
  let quitados = 0;
  for (const [nombre, valor] of new URLSearchParams(busqueda)) {
    if (invalidos.has(campoDeConsulta(nombre))) quitados += 1;
    else quedan.append(nombre, valor);
  }
  if (quitados === 0) return null;
  const resto = quedan.toString();
  return resto === '' ? camino : `${camino}?${resto}`;
}

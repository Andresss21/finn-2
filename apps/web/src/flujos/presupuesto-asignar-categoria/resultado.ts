// E2-13 [CH-248]: Asignar y Mover dejan su resultado en el detalle de la categoría desde la que se abrieron, bajo sus botones. Lo
// lleva `?resultado=` en la URL del detalle: un código y los datos que ya vio o escribió la persona, nunca un monto calculado
// (PF-3). El detalle lo valida con este mismo módulo; un valor que no encaja no se muestra. `?volver=` (la ruta del detalle) lo agrega
// el detalle a los enlaces de los dos flujos: sin él (Presupuesto, Cuentas, reportes) el flujo vuelve a donde estaba.

export type ResultadoPresupuesto =
  | { readonly tipo: 'asignado'; readonly nuevo?: string; readonly anterior?: string }
  | { readonly tipo: 'movido'; readonly monto: string };

const MONTO = /^-?\d{1,12}(\.\d{1,2})?$/;
const MONTO_POSITIVO = /^\d{1,12}(\.\d{1,2})?$/;

export const PARAMETRO_RESULTADO = 'resultado';
export const PARAMETRO_VOLVER = 'volver';
const DETALLE = /^\/presupuesto\/categorias\/[0-9a-f-]{36}(\?periodo=\d{4}-\d{2}-\d{2})?$/;

/** El enlace del detalle a un flujo: `?volver=` (05 §2.2) con su propia ruta y el período si no es el activo. */
export function enlaceDeFlujo(
  ruta: string,
  detalle: string,
  periodoInicio: string | undefined,
): string {
  const params = new URLSearchParams();
  if (periodoInicio !== undefined) params.set('periodo', periodoInicio);
  params.set(PARAMETRO_VOLVER, detalle);
  return `${ruta}${ruta.includes('?') ? '&' : '?'}${params.toString()}`;
}

/** `?volver=` solo cuenta si es el detalle de una categoría: cualquier otro valor se ignora (se valida al leer). */
export function detalleDeVolver(valor: string | undefined): string | undefined {
  return valor !== undefined && DETALLE.test(valor) ? valor : undefined;
}

/** La ruta del detalle (con su `?periodo=` si lo hay) con el resultado a la vista. */
export function rutaConResultado(base: string, r: ResultadoPresupuesto): string {
  const valor =
    r.tipo === 'movido'
      ? `movido:${r.monto}`
      : r.nuevo !== undefined && r.anterior !== undefined
        ? `asignado:${r.nuevo}:${r.anterior}`
        : 'asignado';
  const parametros = new URLSearchParams({ [PARAMETRO_RESULTADO]: valor }).toString();
  return `${base}${base.includes('?') ? '&' : '?'}${parametros}`;
}

/** Lo contrario: `undefined` si el valor no es uno de los resultados con sus datos bien formados. */
export function leerResultadoPresupuesto(
  valor: string | undefined,
): ResultadoPresupuesto | undefined {
  const [tipo, a, b, resto] = (valor ?? '').split(':');
  if (resto !== undefined) return undefined;
  if (tipo === 'asignado' && a === undefined) return { tipo };
  if (tipo === 'asignado' && a !== undefined && b !== undefined && MONTO.test(a) && MONTO.test(b))
    return { tipo, nuevo: a, anterior: b };
  if (tipo === 'movido' && a !== undefined && b === undefined && MONTO_POSITIVO.test(a))
    return { tipo, monto: a };
  return undefined;
}

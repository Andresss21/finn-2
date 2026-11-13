// E2-13 [CH-248]: Asignar y Mover dejan su resultado en el detalle de la categoría desde la que se abrieron, bajo sus botones. Lo
// lleva `?resultado=` en la URL del detalle: un código y los datos que ya vio o escribió la persona, nunca un monto calculado
// (PF-3). El detalle lo valida con este mismo módulo; un valor que no encaja no se muestra. `?volver=` (la ruta del detalle) lo agrega
// el detalle a los enlaces de los dos flujos: sin él (Presupuesto, Cuentas, reportes) el flujo vuelve a donde estaba.
// [CH-254] Mover lleva además su inversa: el origen y el destino intercambiados y, como `esperado`, las dos asignaciones de
// después que devolvió OP-15 (`movido:<monto>:<origen>:<destino>:<asig. origen>:<asig. destino>`, ya intercambiados).

/** [CH-254] La OP-15 de «Deshacer»: el mismo monto, de `origenId` a `destinoId`, con `esperado` = estas asignaciones. */
export interface InversaMover {
  readonly origenId: string;
  readonly destinoId: string;
  readonly asignacionOrigen: string;
  readonly asignacionDestino: string;
}

export type ResultadoPresupuesto =
  | { readonly tipo: 'asignado'; readonly nuevo?: string; readonly anterior?: string }
  | { readonly tipo: 'movido'; readonly monto: string; readonly inversa?: InversaMover };

const MONTO = /^-?\d{1,12}(\.\d{1,2})?$/;
const MONTO_POSITIVO = /^\d{1,12}(\.\d{1,2})?$/;
const UUID = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/;

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
      ? [
          'movido',
          r.monto,
          ...(r.inversa === undefined
            ? []
            : [
                r.inversa.origenId,
                r.inversa.destinoId,
                r.inversa.asignacionOrigen,
                r.inversa.asignacionDestino,
              ]),
        ].join(':')
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
  const [tipo, a, b, ...resto] = (valor ?? '').split(':');
  if (tipo === 'movido') return leerMovido(a, b, resto);
  if (resto.length > 0) return undefined;
  if (tipo === 'asignado' && a === undefined) return { tipo };
  if (tipo === 'asignado' && a !== undefined && b !== undefined && MONTO.test(a) && MONTO.test(b))
    return { tipo, nuevo: a, anterior: b };
  return undefined;
}

/** `movido:<monto>` o, [CH-254] con su inversa, `movido:<monto>:<origen>:<destino>:<asig. origen>:<asig. destino>`. */
function leerMovido(
  monto: string | undefined,
  origenId: string | undefined,
  resto: readonly string[],
): ResultadoPresupuesto | undefined {
  if (monto === undefined || !MONTO_POSITIVO.test(monto)) return undefined;
  if (origenId === undefined && resto.length === 0) return { tipo: 'movido', monto };
  const [destinoId, asignacionOrigen, asignacionDestino, ...sobra] = resto;
  const valida =
    sobra.length === 0 &&
    origenId !== undefined &&
    destinoId !== undefined &&
    asignacionOrigen !== undefined &&
    asignacionDestino !== undefined &&
    UUID.test(origenId) &&
    UUID.test(destinoId) &&
    origenId !== destinoId &&
    MONTO.test(asignacionOrigen) &&
    MONTO.test(asignacionDestino);
  return valida
    ? {
        tipo: 'movido',
        monto,
        inversa: { origenId, destinoId, asignacionOrigen, asignacionDestino },
      }
    : undefined;
}

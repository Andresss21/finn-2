// E2-13 (CH-240): los flujos cortos de Cuentas que terminan sin un paso siguiente (verificar saldo sin diferencia, pagar tarjeta)
// no tienen pantalla de resultado propia: vuelven al detalle y el resultado queda bajo sus acciones. Lo que lo lleva es `?resultado=`
// en la URL del detalle: un código y los datos que ya vio la persona (fecha, cantidad, monto que escribió), nunca un monto calculado
// (PF-3). El detalle lo valida con este mismo módulo y dibuja el texto; un valor que no encaja no se muestra.

export type ResultadoDeFlujo =
  | { readonly tipo: 'verificado'; readonly fecha: string; readonly marcadas: number }
  | { readonly tipo: 'pagado'; readonly monto: string; readonly excedente: boolean };

const FECHA = /^\d{4}-\d{2}-\d{2}$/;
const ENTERO = /^\d{1,6}$/;
const MONTO = /^\d{1,12}(\.\d{1,2})?$/;

export const PARAMETRO_RESULTADO = 'resultado';

/** La ruta del detalle con el resultado a la vista. */
export function rutaConResultado(ruta: string, r: ResultadoDeFlujo): string {
  const valor =
    r.tipo === 'verificado'
      ? `verificado:${r.fecha}:${String(r.marcadas)}`
      : `pagado:${r.monto}:${r.excedente ? '1' : '0'}`;
  return `${ruta}?${new URLSearchParams({ [PARAMETRO_RESULTADO]: valor }).toString()}`;
}

/** Lo contrario: `undefined` si el valor no es uno de los dos resultados con sus datos bien formados. */
export function leerResultado(valor: string | undefined): ResultadoDeFlujo | undefined {
  const [tipo, a, b] = (valor ?? '').split(':');
  if (
    tipo === 'verificado' &&
    a !== undefined &&
    b !== undefined &&
    FECHA.test(a) &&
    ENTERO.test(b)
  )
    return { tipo, fecha: a, marcadas: Number(b) };
  if (tipo === 'pagado' && a !== undefined && MONTO.test(a) && (b === '0' || b === '1'))
    return { tipo, monto: a, excedente: b === '1' };
  return undefined;
}

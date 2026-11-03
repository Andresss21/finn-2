// Lo que aprobó el servidor y cómo se dice (05 §4.15, CP-15): la lista y el flujo muestran el mismo resultado, tomado de la
// respuesta de OP-37 y nunca de la fila que se veía.
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../../formato';
import { bandeja as t } from '../../textos/bandeja';

interface Ref {
  readonly nombre: string;
}
/** Lo que devuelve OP-37 (`SalidaAprobacion`, 04 §3.6). */
export interface ValorAprobado {
  readonly transaccionId: string;
  readonly aprobado?: {
    readonly total: number;
    readonly comercio: string | null;
    readonly cuenta: Ref;
    readonly destino:
      { readonly categoria: Ref } | { readonly deudor: Ref } | { readonly partes: number };
  };
}

/** «Aprobado: SUPER SELECTOS · $45.00 · Visa Oro · Supermercado», solo con lo que dijo el servidor. */
export function textoAprobado(v: ValorAprobado): string {
  const a = v.aprobado;
  if (a === undefined) return t.aprobadoSinDatos;
  const destino =
    'categoria' in a.destino
      ? a.destino.categoria.nombre
      : 'deudor' in a.destino
        ? t.porCobrarA(a.destino.deudor.nombre)
        : t.dividido(a.destino.partes);
  return t.aprobado(
    ...[a.comercio ?? '', formatearMonto(a.total as Centavos), a.cuenta.nombre, destino].filter(
      (x) => x !== '',
    ),
  );
}

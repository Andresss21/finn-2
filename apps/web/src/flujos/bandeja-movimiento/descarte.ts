// Descartar y restaurar (FT-37, OP-39, 05 §4.14): lo que se dice y lo que se puede revertir, tomado de la respuesta del servidor
// y de lo que se veía al tocar (comercio y monto). No calcula montos (PF-3): solo los formatea.
import type { Centavos } from '@finn/dominio/valores';
import { formatearMonto } from '../../formato';
import { bandeja as t } from '../../textos/bandeja';
import { cuentas } from '../../textos/cuentas';
import type { ValorAprobado } from './aprobado';

/** Lo que devuelven OP-39 y OP-40 (`SalidaMovimiento`, 04 §3.6). */
export interface ValorMovimiento {
  readonly movimientoId: string;
  readonly estado: string;
}

/** Lo que queda en el lugar de una fila de la lista: lo aprobado o lo descartado (05 §4.14, §4.15). */
export type ResultadoFila =
  { readonly tipo: 'aprobado'; readonly valor: ValorAprobado } | { readonly tipo: 'descartado' };

const nombre = (comercio: string | null, monto: number | null): string =>
  [comercio ?? cuentas.bandeja.sinComercio, monto === null ? '' : formatearMonto(monto as Centavos)]
    .filter((x) => x !== '')
    .join(' ');

/** «Descartaste SUPER SELECTOS $45.00.»; «Restaurar» lo pone el `Resultado` como salida. */
export const textoDescartado = (comercio: string | null, monto: number | null): string =>
  t.descartaste(nombre(comercio, monto));

export const textoRestaurado = (comercio: string | null, monto: number | null): string =>
  t.restauraste(nombre(comercio, monto));

/** Restaurar solo se puede volver a descartar si el estado resultante lo admite: no `con_coincidencia` (05 §4.14, 04 OP-39). */
export const sePuedeDescartar = (estado: string): boolean =>
  estado === 'pendiente' ||
  estado === 'posible_duplicado' ||
  estado === 'no_reconocido' ||
  estado === 'error';

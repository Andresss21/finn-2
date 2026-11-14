'use client';
// La casilla de AV-22 de `/por-cobrar/cobrar` (BE-36, O1): reservar lo cobrado para la tarjeta con que se pagó la compra. Viene
// marcada y se puede desmarcar. Dice el monto solo cuando coincide con el saldo abierto que trajo el servidor (PF-3: no calcula
// la parte que se restituye).
import { Casilla } from '../../componentes/base/controles-fila';
import { porCobrarCobrar as t } from '../../textos/por-cobrar-cobrar';

/** [C-45] Una fila v3 del grupo de datos (CAMPOS-V3 §8): toda la fila es el blanco, con la ayuda debajo del texto. */
export function CasillaReservar({
  marcada,
  alCambiar,
  tarjeta,
  monto,
}: {
  readonly marcada: boolean;
  readonly alCambiar: (marcada: boolean) => void;
  readonly tarjeta: string;
  /** El monto que se reserva, ya formateado, o `undefined` si no se sabe sin calcularlo. */
  readonly monto: string | undefined;
}) {
  return (
    <Casilla
      etiqueta={monto === undefined ? t.reservarLoCobrado(tarjeta) : t.reservar(monto, tarjeta)}
      descripcion={t.reservarAyuda}
      marcada={marcada}
      alCambiar={alCambiar}
    />
  );
}

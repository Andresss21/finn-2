'use client';
// La casilla de AV-22 de `/por-cobrar/cobrar` (BE-36, O1): reservar lo cobrado para la tarjeta con que se pagó la compra. Viene
// marcada y se puede desmarcar. Dice el monto solo cuando coincide con el saldo abierto que trajo el servidor (PF-3: no calcula
// la parte que se restituye).
import { useId } from 'react';
import { porCobrarCobrar as t } from '../../textos/por-cobrar-cobrar';

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
  const id = useId();
  const texto = monto === undefined ? t.reservarLoCobrado(tarjeta) : t.reservar(monto, tarjeta);
  return (
    <div className="flex items-start gap-3">
      <input
        id={id}
        type="checkbox"
        checked={marcada}
        onChange={(e) => {
          alCambiar(e.target.checked);
        }}
        aria-describedby={`${id}-ayuda`}
        className="size-11 shrink-0 accent-accion"
      />
      <div className="flex min-h-11 flex-col justify-center gap-0.5">
        <label htmlFor={id} className="text-cuerpo">
          {texto}
        </label>
        <p id={`${id}-ayuda`} className="text-cuerpo-pequeno text-texto-secundario">
          {t.reservarAyuda}
        </p>
      </div>
    </div>
  );
}

// «Dato fijo» (E4-16, 05 §4.14): un valor que se decidió al crear y ya no cambia (el tipo de una meta o de una programada, la
// frecuencia y la primera fecha de una programada con historial). No es un control deshabilitado: es texto con su rótulo, el
// candado de 16 px, el valor en negrita y, debajo, la línea que dice por qué no se cambia. Solo presenta.
import type { ReactNode } from 'react';
import { Icono } from '../base/icono';

export function DatoFijo({
  rotulo,
  valor,
  motivo,
  nombre,
}: {
  readonly rotulo: string;
  readonly valor: ReactNode;
  /** Por qué no se cambia: va debajo, en texto secundario. */
  readonly motivo?: string;
  /** Un nombre estable para ubicarlo (`data-dato-fijo`). */
  readonly nombre?: string;
}) {
  return (
    <div data-dato-fijo={nombre ?? rotulo} className="flex flex-col gap-1">
      <span className="text-etiqueta">{rotulo}</span>
      <span className="flex items-center gap-2 font-bold">
        <span aria-hidden="true" className="text-texto-secundario">
          <Icono nombre="lock" tamano={16} />
        </span>
        {valor}
      </span>
      {motivo === undefined ? null : (
        <span className="text-cuerpo-pequeno text-texto-secundario">{motivo}</span>
      )}
    </div>
  );
}

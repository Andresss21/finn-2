// Vacío (06-identidad-visual 2.19, 05 §7.2): círculo de 72 con el glifo, título, texto de 280 como máximo y la acción.
import type { ReactNode } from 'react';
import { Icono, type NombreIcono } from './icono';

export interface PropsVacio {
  readonly titulo: string;
  readonly texto: string;
  readonly icono?: NombreIcono;
  /** La acción para crear el primero, si existe. */
  readonly accion?: ReactNode;
}

export function Vacio({ titulo, texto, icono = 'positivo', accion }: PropsVacio) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <span className="flex size-18 items-center justify-center rounded-pastilla bg-positivo-fondo text-positivo-texto">
        <Icono nombre={icono} tamano={32} />
      </span>
      <h2 className="text-titulo-seccion text-texto">{titulo}</h2>
      <p className="text-cuerpo-pequeno max-w-70 text-texto-secundario">{texto}</p>
      {accion === undefined ? null : <div>{accion}</div>}
    </div>
  );
}

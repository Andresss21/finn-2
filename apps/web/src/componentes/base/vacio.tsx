// Vacío (06-identidad-visual 2.19, 05 §7.2): círculo de 72 con el glifo, título, texto de 280 como máximo y la acción. Un
// error («Esto ya no existe.», entrega 2 del diseño) va en el círculo neutro: el `positivo` es para lo que está al día.
import type { ReactNode } from 'react';
import { Icono, type NombreIcono } from './icono';

// Mapa de clases literales (L13).
const TONOS = {
  positivo:
    'flex size-18 items-center justify-center rounded-pastilla bg-positivo-fondo text-positivo-texto',
  neutro:
    'flex size-18 items-center justify-center rounded-pastilla bg-superficie-hundida text-texto',
} as const;

export interface PropsVacio {
  readonly titulo: string;
  readonly texto: string;
  readonly icono?: NombreIcono;
  readonly tono?: keyof typeof TONOS;
  /** La acción para crear el primero, si existe. */
  readonly accion?: ReactNode;
}

export function Vacio({
  titulo,
  texto,
  icono = 'positivo',
  tono = 'positivo',
  accion,
}: PropsVacio) {
  return (
    <div className="flex flex-col items-center gap-3 px-4 py-8 text-center">
      <span data-glifo={icono} className={TONOS[tono]}>
        <Icono nombre={icono} tamano={32} />
      </span>
      <h2 className="text-titulo-seccion text-texto">{titulo}</h2>
      <p className="text-cuerpo-pequeno max-w-70 text-texto-secundario">{texto}</p>
      {accion === undefined ? null : <div>{accion}</div>}
    </div>
  );
}

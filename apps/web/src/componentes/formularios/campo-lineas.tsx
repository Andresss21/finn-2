'use client';
// `CampoLineas` (05 §10.8, FE-22): las partes de un gasto, de 1 a `maximo`, sobre el `useFieldArray` del formulario (4.2). Agregar
// o quitar una parte anuncia la cantidad en una región `status`. La diferencia con el total la muestra quien lo usa: el
// servidor valida la suma y aquí solo se ve cuánto falta (PF-3, 05 §5.1). No calcula nada: recibe textos y cantidades.
import type { ReactNode } from 'react';
import { Boton } from '../base/boton';
import { MensajeError } from '../base/campo';

export interface PropsCampoLineas {
  readonly etiqueta: string;
  /** Una clave estable por parte (el `id` de `useFieldArray`). */
  readonly claves: readonly string[];
  readonly maximo: number;
  readonly textoAgregar: string;
  readonly textoParte: (numero: string) => string;
  readonly textoQuitar: (numero: string) => string;
  readonly textoCantidad: (cantidad: string) => string;
  readonly alAgregar: () => void;
  readonly alQuitar: (indice: number) => void;
  /** La ayuda visual de PF-3 ("Falta repartir $30.00"), que ya viene formateada. */
  readonly ayuda?: string | undefined;
  /** El mensaje del servidor o del contrato para el conjunto de partes, junto al campo. */
  readonly error?: string | undefined;
  readonly renderParte: (indice: number) => ReactNode;
}

export function CampoLineas({
  etiqueta,
  claves,
  maximo,
  textoAgregar,
  textoParte,
  textoQuitar,
  textoCantidad,
  alAgregar,
  alQuitar,
  ayuda,
  error,
  renderParte,
}: PropsCampoLineas) {
  return (
    <fieldset className="flex flex-col gap-4" data-campo-lineas>
      <legend className="text-etiqueta pb-1 font-bold">{etiqueta}</legend>
      <p role="status" className="sr-only">
        {textoCantidad(String(claves.length))}
      </p>
      {claves.map((clave, i) => (
        <div
          key={clave}
          data-parte={String(i + 1)}
          className="flex flex-col gap-3 rounded-contenedor bg-superficie p-3"
        >
          <div className="flex items-center justify-between gap-2">
            <h3 className="text-etiqueta font-bold">{textoParte(String(i + 1))}</h3>
            {claves.length > 1 ? (
              <Boton
                variante="discreta"
                onClick={() => {
                  alQuitar(i);
                }}
                aria-label={textoQuitar(String(i + 1))}
              >
                {textoQuitar(String(i + 1))}
              </Boton>
            ) : null}
          </div>
          {renderParte(i)}
        </div>
      ))}
      {ayuda === undefined ? null : (
        <p className="text-cuerpo-pequeno font-bold text-texto" data-testid="falta-repartir">
          {ayuda}
        </p>
      )}
      {error === undefined ? null : <MensajeError>{error}</MensajeError>}
      {claves.length < maximo ? (
        <Boton variante="secundaria" onClick={alAgregar}>
          {textoAgregar}
        </Boton>
      ) : null}
    </fieldset>
  );
}

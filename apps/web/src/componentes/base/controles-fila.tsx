'use client';
// [CH-274] Casilla, interruptor y opciones v3 (C-45, CAMPOS-V3 §8): toda la fila es el `<label>` y el blanco táctil (56 de
// alto); con foco se levanta como un campo. El control nativo cubre la fila sin verse, así el clic y el teclado son los del
// navegador; el dibujo va al lado, oculto a los lectores. Van dentro de `GrupoCampos` (`Opciones` es su propio grupo).
import { useId, type ReactNode } from 'react';

interface PropsFila {
  readonly etiqueta: string;
  readonly descripcion?: string | undefined;
  readonly deshabilitada?: boolean | undefined;
  /** Con nombre, el valor viaja en el formulario. */
  readonly nombre?: string | undefined;
}

/** Los 16 px del check y del guion de la casilla (CAMPOS-V3 §8). */
function Trazo({ d }: { readonly d: string }) {
  return (
    <svg
      aria-hidden="true"
      width="16"
      height="16"
      viewBox="0 0 24 24"
      fill="none"
      strokeWidth="2.4"
    >
      <path d={d} stroke="currentColor" strokeLinecap="square" strokeLinejoin="miter" />
    </svg>
  );
}

function Fila({
  id,
  etiqueta,
  descripcion,
  deshabilitada,
  antes,
  despues,
  children,
}: {
  readonly id: string;
  readonly etiqueta: string;
  readonly descripcion: string | undefined;
  readonly deshabilitada: boolean;
  readonly antes?: ReactNode;
  readonly despues?: ReactNode;
  readonly children: ReactNode;
}) {
  return (
    <label className="campo-fila control-fila" {...(deshabilitada ? { 'data-apagado': '' } : {})}>
      {children}
      {antes}
      <span className="control-texto">
        <span id={`${id}-n`} className="control-nombre">
          {etiqueta}
        </span>
        {descripcion === undefined ? null : (
          <span id={`${id}-d`} className="campo-detalle">
            {descripcion}
          </span>
        )}
      </span>
      {despues}
    </label>
  );
}

const nombrado = (id: string, descripcion: string | undefined, extra?: string) => ({
  id,
  'aria-labelledby': `${id}-n`,
  'aria-describedby':
    [descripcion === undefined ? '' : `${id}-d`, extra ?? ''].filter(Boolean).join(' ') ||
    undefined,
});

export function Casilla({
  etiqueta,
  descripcion,
  deshabilitada = false,
  nombre,
  marcada,
  alCambiar,
  cifra,
}: PropsFila & {
  readonly marcada: boolean | 'mixta';
  readonly alCambiar: (marcada: boolean) => void;
  /** La cifra de la fila, ya formateada (PF-3): va a la derecha. */
  readonly cifra?: string | undefined;
}) {
  const id = useId();
  const mixta = marcada === 'mixta';
  return (
    <Fila
      id={id}
      etiqueta={etiqueta}
      descripcion={descripcion}
      deshabilitada={deshabilitada}
      antes={
        <span
          aria-hidden="true"
          data-control="casilla"
          data-marcada={marcada === false ? undefined : ''}
        >
          {marcada === false ? null : <Trazo d={mixta ? 'M6.5 12h11' : 'M5 12.5l4.5 4.5L19 7.5'} />}
        </span>
      }
      despues={
        cifra === undefined ? null : (
          <span id={`${id}-c`} className="control-cifra">
            {cifra}
          </span>
        )
      }
    >
      <input
        type="checkbox"
        className="control-nativo"
        {...nombrado(id, descripcion, cifra === undefined ? undefined : `${id}-c`)}
        name={nombre}
        checked={marcada === true}
        {...(mixta ? { 'aria-checked': 'mixed' as const } : {})}
        ref={(n) => {
          if (n !== null) n.indeterminate = mixta;
        }}
        disabled={deshabilitada}
        onChange={(e) => {
          alCambiar(e.target.checked);
        }}
      />
    </Fila>
  );
}

export function Interruptor({
  etiqueta,
  descripcion,
  deshabilitada = false,
  nombre,
  encendido,
  alCambiar,
}: PropsFila & { readonly encendido: boolean; readonly alCambiar: (encendido: boolean) => void }) {
  const id = useId();
  return (
    <Fila
      id={id}
      etiqueta={etiqueta}
      descripcion={descripcion}
      deshabilitada={deshabilitada}
      despues={<span aria-hidden="true" data-control="interruptor" />}
    >
      <input
        type="checkbox"
        role="switch"
        className="control-nativo"
        {...nombrado(id, descripcion)}
        name={nombre}
        checked={encendido}
        disabled={deshabilitada}
        onChange={(e) => {
          alCambiar(e.target.checked);
        }}
      />
    </Fila>
  );
}

export interface OpcionRadio {
  readonly valor: string;
  readonly etiqueta: string;
  readonly descripcion?: string | undefined;
  readonly deshabilitada?: boolean | undefined;
}

/** Una sola elección entre 4 a 7 a la vista (CAMPOS-V3 §6 y §8): un `radiogroup` con nombre, una fila por opción. */
export function Opciones({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  nombre,
}: {
  readonly etiqueta: string;
  readonly opciones: readonly OpcionRadio[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
  readonly nombre?: string | undefined;
}) {
  const grupo = useId();
  return (
    <div role="radiogroup" aria-label={etiqueta} className="grupo-campos">
      {opciones.map((o) => (
        <Opcion
          key={o.valor}
          opcion={o}
          grupo={nombre ?? grupo}
          valor={valor}
          alCambiar={alCambiar}
        />
      ))}
    </div>
  );
}

function Opcion({
  opcion,
  grupo,
  valor,
  alCambiar,
}: {
  readonly opcion: OpcionRadio;
  readonly grupo: string;
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
}) {
  const id = useId();
  return (
    <Fila
      id={id}
      etiqueta={opcion.etiqueta}
      descripcion={opcion.descripcion}
      deshabilitada={opcion.deshabilitada === true}
      antes={<span aria-hidden="true" data-control="opcion" />}
    >
      <input
        type="radio"
        className="control-nativo"
        {...nombrado(id, opcion.descripcion)}
        name={grupo}
        value={opcion.valor}
        checked={opcion.valor === valor}
        disabled={opcion.deshabilitada === true}
        onChange={() => {
          alCambiar(opcion.valor);
        }}
      />
    </Fila>
  );
}

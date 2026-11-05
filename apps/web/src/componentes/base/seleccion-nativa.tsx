'use client';
// Selección con el aspecto de K2 y S5 del export (campo relleno, ícono, nombre, detalle y `chevD`) sobre un `<select>` nativo
// transparente: la lista abierta es la del sistema, sin Radix ni radios. El dibujo no entra en el árbol de accesibilidad; el
// nombre, el teclado y el valor son los del `<select>`. No reemplaza a `Seleccion` (Mover, Cuentas y Revisar movimiento).
import { Fragment } from 'react';
import { cn } from '../../components/ui/utils';
import { Campo } from './campo';
import { Icono, type NombreIcono } from './icono';

export interface OpcionNativa {
  readonly valor: string;
  readonly etiqueta: string;
  /** Segunda línea del campo cerrado, por ejemplo «Deuda $642.18». */
  readonly detalle?: string;
  readonly icono?: NombreIcono;
  /** Las opciones con el mismo grupo se agrupan en la lista. */
  readonly grupo?: string;
}

export interface PropsSeleccionNativa {
  readonly etiqueta: string;
  readonly opciones: readonly OpcionNativa[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
  /** Lo que dice el campo mientras no hay valor. */
  readonly marcador: string;
  readonly error?: string | undefined;
  /** 52 px con ícono y dos líneas (la cuenta) en lugar de 48 px (la línea de un gasto). */
  readonly alta?: boolean;
  readonly etiquetaOculta?: boolean;
  /** Sin edición (p. ej. el calendario con historial). */
  readonly deshabilitado?: boolean;
}

// Fuera del JSX por L15: el foco y el error los dan `has-*` del `<select>` que el campo contiene.
const CAJA =
  'relative flex w-full items-center justify-between gap-2 rounded-t-control rounded-b-sm border-b-2 border-borde-control bg-superficie px-3 text-base text-texto has-focus-visible:border-b-4 has-focus-visible:border-foco has-focus-visible:outline-3 has-focus-visible:outline-offset-2 has-focus-visible:outline-foco has-aria-invalid:border-2 has-aria-invalid:border-problema-borde';

export function SeleccionNativa({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  marcador,
  error,
  alta = false,
  etiquetaOculta = false,
  deshabilitado = false,
}: PropsSeleccionNativa) {
  const elegida = opciones.find((o) => o.valor === valor);
  const lista = (grupo: string | undefined) =>
    opciones
      .filter((o) => o.grupo === grupo)
      .map((o) => (
        <option key={o.valor} value={o.valor}>
          {o.etiqueta}
        </option>
      ));
  return (
    <Campo
      etiqueta={etiqueta}
      requerido
      etiquetaOculta={etiquetaOculta}
      {...(error === undefined ? {} : { error })}
    >
      {(control) => (
        <div className={cn(CAJA, alta ? 'min-h-13' : 'min-h-12')}>
          <span aria-hidden="true" className="flex min-w-0 items-center gap-2.5">
            {elegida?.icono === undefined ? null : <Icono nombre={elegida.icono} tamano={22} />}
            <span className="flex min-w-0 flex-col items-start">
              <span
                className={cn(
                  'max-w-full truncate',
                  elegida === undefined ? 'text-texto-terciario' : alta && 'font-semibold',
                )}
              >
                {elegida?.etiqueta ?? marcador}
              </span>
              <span className="text-cuerpo-pequeno text-texto-secundario">{elegida?.detalle}</span>
            </span>
          </span>
          <Icono nombre="chevD" tamano={20} className="shrink-0 text-texto-secundario" />
          <select
            {...control}
            value={valor}
            disabled={deshabilitado}
            className="absolute inset-0 size-full cursor-pointer appearance-none opacity-0"
            onChange={(e) => {
              alCambiar(e.target.value);
            }}
          >
            {elegida === undefined ? (
              <option value="" disabled>
                {marcador}
              </option>
            ) : null}
            {[...new Set(opciones.map((o) => o.grupo))].map((g) =>
              g === undefined ? (
                <Fragment key="sin-grupo">{lista(g)}</Fragment>
              ) : (
                <optgroup key={g} label={g}>
                  {lista(g)}
                </optgroup>
              ),
            )}
          </select>
        </div>
      )}
    </Campo>
  );
}

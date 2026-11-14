'use client';
// [CH-271] Selección v3 (C-45, CAMPOS-V3 §6): dentro de `GrupoCampos`, `Seleccion` y `SeleccionNativa` son una fila con un
// disparador y una lista propia en todos los navegadores, nunca el `<select>` del sistema. Patrón *listbox* de ARIA: el foco
// pasa a la lista, que marca la activa con `aria-activedescendant`, y vuelve al disparador al cerrar. Con 3 opciones o menos,
// segmentado.
import { Fragment, useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { Campo, MensajeError } from './campo';
import { Icono } from './icono';
import { SelectorSegmentado } from './selector-segmentado';

export interface OpcionFila {
  readonly valor: string;
  readonly etiqueta: string;
  /** Línea secundaria («Disponible $62.85»). */
  readonly detalle?: string | undefined;
  /** El detalle es un negativo: va en `--problema-texto`. Lo dice quien arma las opciones (PF-3). */
  readonly negativo?: boolean | undefined;
  /** Las opciones con el mismo grupo van juntas, bajo su rótulo. */
  readonly grupo?: string | undefined;
}

export interface PropsSeleccionFila {
  readonly etiqueta: string;
  readonly opciones: readonly OpcionFila[];
  readonly valor: string;
  readonly alCambiar: (valor: string) => void;
  /** Lo que dice la fila sin nada elegido, en terciario. */
  readonly marcador?: string | undefined;
  readonly descripcion?: string | undefined;
  readonly error?: string | undefined;
  readonly deshabilitada?: boolean | undefined;
  /** Con nombre, el valor viaja en el formulario. */
  readonly nombre?: string | undefined;
}

const MAXIMO_SEGMENTADO = 3;

/** Sin tildes ni mayúsculas, para saltar con letras. */
const llano = (t: string) => t.normalize('NFD').replace(/\p{M}/gu, '').toLowerCase();

export function SeleccionFila(props: PropsSeleccionFila) {
  if (props.opciones.length <= MAXIMO_SEGMENTADO) return <SegmentadoFila {...props} />;
  return <ListaFila {...props} />;
}

/** CAMPOS-V3 §6, pocas opciones: todas a la vista como segmentado, en su fila. */
function SegmentadoFila({ etiqueta, opciones, valor, alCambiar, error }: PropsSeleccionFila) {
  return (
    <div className="campo-fila" {...(error === undefined ? {} : { 'data-error': '' })}>
      <span aria-hidden="true" className="campo-rotulo">
        {etiqueta}
      </span>
      <SelectorSegmentado
        etiqueta={etiqueta}
        opciones={opciones}
        valor={valor}
        alCambiar={alCambiar}
        llena
      />
      {error === undefined ? null : (
        <div className="campo-error">
          <MensajeError>{error}</MensajeError>
        </div>
      )}
    </div>
  );
}

function ListaFila({
  etiqueta,
  opciones,
  valor,
  alCambiar,
  marcador,
  descripcion,
  error,
  deshabilitada = false,
  nombre,
}: PropsSeleccionFila) {
  const id = useId();
  const disparador = useRef<HTMLButtonElement>(null);
  const panel = useRef<HTMLDivElement>(null);
  const [abierta, setAbierta] = useState(false);
  const [activa, setActiva] = useState(0);
  // El orden de la lista es el de los grupos: el teclado recorre lo que se ve.
  const grupos = [...new Set(opciones.map((o) => o.grupo))];
  const orden = grupos.flatMap((g) => opciones.filter((o) => o.grupo === g));
  const elegida = orden.find((o) => o.valor === valor);
  const idOpcion = (k: number) => `${id}-o${String(k)}`;

  useEffect(() => {
    if (!abierta) return;
    panel.current?.focus();
    document.getElementById(idOpcion(activa))?.scrollIntoView({ block: 'nearest' });
  });

  const abrir = () => {
    setActiva(Math.max(0, orden.indexOf(elegida as OpcionFila)));
    setAbierta(true);
  };
  const cerrar = () => {
    setAbierta(false);
    disparador.current?.focus();
  };
  const elegir = (o: OpcionFila | undefined) => {
    if (o !== undefined && o.valor !== valor) alCambiar(o.valor);
    cerrar();
  };
  const alTeclear = (e: KeyboardEvent<HTMLDivElement>) => {
    const ultima = orden.length - 1;
    const destino: Record<string, number> = {
      ArrowDown: Math.min(activa + 1, ultima),
      ArrowUp: Math.max(activa - 1, 0),
      Home: 0,
      End: ultima,
    };
    if (e.key in destino) setActiva(destino[e.key] as number);
    else if (e.key === 'Enter') elegir(orden[activa]);
    else if (e.key === 'Escape') cerrar();
    else if (e.key === 'Tab') setAbierta(false);
    else if (e.key.length === 1 && !e.ctrlKey && !e.metaKey && !e.altKey) {
      // La siguiente opción que empieza con esa letra, dando la vuelta.
      const letra = llano(e.key);
      const siguiente = [...orden.keys()]
        .map((k) => (activa + 1 + k) % orden.length)
        .find((k) => llano(orden[k]?.etiqueta ?? '').startsWith(letra));
      if (siguiente !== undefined) setActiva(siguiente);
    } else return;
    if (e.key !== 'Tab') e.preventDefault();
  };

  return (
    <Campo
      etiqueta={etiqueta}
      requerido
      deshabilitado={deshabilitada}
      {...(descripcion === undefined ? {} : { descripcion })}
      {...(error === undefined ? {} : { error })}
    >
      {(control) => (
        <div
          className="contents"
          onBlur={(e) => {
            // Un clic afuera cierra sin cambiar ni mover el foco.
            if (!e.currentTarget.contains(e.relatedTarget)) setAbierta(false);
          }}
        >
          <button
            ref={disparador}
            type="button"
            id={control.id}
            aria-describedby={
              [control['aria-describedby'], elegida?.detalle === undefined ? '' : `${id}-d`]
                .filter(Boolean)
                .join(' ') || undefined
            }
            aria-haspopup="listbox"
            aria-expanded={abierta}
            aria-labelledby={`${control.id}-l ${id}-v`}
            disabled={deshabilitada}
            className="campo-disparador"
            onClick={() => {
              if (abierta) setAbierta(false);
              else abrir();
            }}
            onKeyDown={(e) => {
              if (e.key !== 'ArrowDown' && e.key !== 'ArrowUp') return;
              e.preventDefault();
              abrir();
            }}
          >
            <span
              id={`${id}-v`}
              className={
                elegida === undefined
                  ? 'campo-disparador-texto campo-marcador'
                  : 'campo-disparador-texto'
              }
            >
              {elegida?.etiqueta ?? marcador}
            </span>
            <Icono
              nombre="chevD"
              tamano={18}
              className={abierta ? 'shrink-0 rotate-180' : 'shrink-0'}
            />
          </button>
          {/* La línea secundaria va debajo del valor, fuera del botón (la referencia): describe, no nombra. */}
          {elegida?.detalle === undefined ? null : (
            <span
              id={`${id}-d`}
              className="campo-detalle"
              {...(elegida.negativo === true ? { 'data-negativo': '' } : {})}
            >
              {elegida.detalle}
            </span>
          )}
          {nombre === undefined ? null : <input type="hidden" name={nombre} value={valor} />}
          {abierta ? (
            <div
              ref={panel}
              role="listbox"
              tabIndex={-1}
              aria-labelledby={`${control.id}-l`}
              aria-activedescendant={idOpcion(activa)}
              className="campo-panel"
              onKeyDown={alTeclear}
            >
              {grupos.map((g, i) => {
                const filas = orden.map((o, k) =>
                  o.grupo !== g ? null : (
                    <div
                      key={o.valor}
                      id={idOpcion(k)}
                      role="option"
                      aria-selected={o === elegida}
                      {...(k === activa ? { 'data-activa': '' } : {})}
                      // Las teclas las maneja la lista; el puntero elige con mousedown, que deja el foco en ella.
                      tabIndex={-1}
                      className="campo-opcion"
                      onPointerMove={() => {
                        setActiva(k);
                      }}
                      onMouseDown={(e) => {
                        e.preventDefault();
                        elegir(o);
                      }}
                    >
                      <span className="flex min-w-0 flex-1 flex-col">
                        <span className="campo-opcion-nombre">{o.etiqueta}</span>
                        {o.detalle === undefined ? null : (
                          <span
                            className="campo-detalle"
                            {...(o.negativo === true ? { 'data-negativo': '' } : {})}
                          >
                            {o.detalle}
                          </span>
                        )}
                      </span>
                      {o === elegida ? <Icono nombre="check" tamano={18} /> : null}
                    </div>
                  ),
                );
                return g === undefined ? (
                  <Fragment key="sin-grupo">{filas}</Fragment>
                ) : (
                  <div key={g} role="group" aria-labelledby={`${id}-g${String(i)}`}>
                    <div
                      id={`${id}-g${String(i)}`}
                      role="presentation"
                      className="campo-panel-grupo"
                    >
                      {g}
                    </div>
                    {filas}
                  </div>
                );
              })}
            </div>
          ) : null}
        </div>
      )}
    </Campo>
  );
}

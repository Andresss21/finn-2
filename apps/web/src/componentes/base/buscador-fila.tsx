'use client';
// [CH-271] Buscador con sugerencias v3 (C-45, CAMPOS-V3 §7): la fila y el panel de la selección, con la lupa. Patrón
// *combobox* de ARIA. Busca después de 250 ms sin escribir, resalta lo escrito y anuncia la cantidad en una región `status`.
// Lo escrito se respeta: sin elegir nada, el valor es el texto. Va dentro de `GrupoCampos`; lo usa el Comercio de Registrar
// gasto (PR 4 de C-45), con la lectura interactiva que le pase la pantalla (4.12).
import { useEffect, useId, useRef, useState, type KeyboardEvent } from 'react';
import { base } from '../../textos/base';
import { Campo } from './campo';
import { Icono } from './icono';

export interface Sugerencia {
  readonly valor: string;
  readonly etiqueta: string;
  /** Línea secundaria («Suele ir a Supermercado»). */
  readonly detalle?: string;
}

export interface PropsBuscadorFila {
  readonly etiqueta: string;
  /** Lectura interactiva (4.12). */
  readonly buscar: (texto: string) => Promise<readonly Sugerencia[]>;
  /** Lo escrito. */
  readonly valor: string;
  readonly alCambiar: (texto: string) => void;
  readonly alElegir?: (sugerencia: Sugerencia) => void;
  readonly marcador?: string;
  readonly nombre?: string;
  readonly requerido?: boolean;
  readonly error?: string | undefined;
}

const ESPERA_MS = 250;

type Estado =
  | { readonly fase: 'quieto' | 'buscando' | 'error' }
  | { readonly fase: 'listo'; readonly sugerencias: readonly Sugerencia[] };

/** La parte que coincide con lo escrito en 700 y el resto en 500 (CAMPOS-V3 §7). */
function Resaltado({ texto, buscado }: { readonly texto: string; readonly buscado: string }) {
  const desde = texto.toLowerCase().indexOf(buscado.trim().toLowerCase());
  if (desde < 0 || buscado.trim() === '') return <span>{texto}</span>;
  const hasta = desde + buscado.trim().length;
  return (
    <>
      {desde > 0 ? <span>{texto.slice(0, desde)}</span> : null}
      <span className="font-bold">{texto.slice(desde, hasta)}</span>
      {hasta < texto.length ? <span>{texto.slice(hasta)}</span> : null}
    </>
  );
}

export function BuscadorFila({
  etiqueta,
  buscar,
  valor,
  alCambiar,
  alElegir,
  marcador,
  nombre,
  requerido = false,
  error,
}: PropsBuscadorFila) {
  const id = useId();
  const caja = useRef<HTMLInputElement>(null);
  const pedido = useRef(0);
  const espera = useRef<ReturnType<typeof setTimeout>>(undefined);
  const [estado, setEstado] = useState<Estado>({ fase: 'quieto' });
  const [abierto, setAbierto] = useState(false);
  const [activa, setActiva] = useState(-1);

  useEffect(
    () => () => {
      clearTimeout(espera.current);
    },
    [],
  );

  const consultar = (texto: string) => {
    const este = ++pedido.current;
    setEstado({ fase: 'buscando' });
    buscar(texto).then(
      (sugerencias) => {
        // Una respuesta que llega tarde, con una búsqueda más nueva en curso, no se muestra.
        if (este === pedido.current) setEstado({ fase: 'listo', sugerencias });
      },
      () => {
        if (este === pedido.current) setEstado({ fase: 'error' });
      },
    );
  };
  const escribir = (texto: string) => {
    alCambiar(texto);
    clearTimeout(espera.current);
    ++pedido.current;
    setActiva(-1);
    setAbierto(texto.trim() !== '');
    setEstado({ fase: 'quieto' });
    if (texto.trim() !== '')
      espera.current = setTimeout(() => {
        consultar(texto);
      }, ESPERA_MS);
  };
  const sugerencias = estado.fase === 'listo' ? estado.sugerencias : [];
  const elegir = (s: Sugerencia) => {
    ++pedido.current;
    alCambiar(s.etiqueta);
    alElegir?.(s);
    setAbierto(false);
    setActiva(-1);
  };
  const conLista = abierto && sugerencias.length > 0;
  const alTeclear = (e: KeyboardEvent<HTMLInputElement>) => {
    const n = sugerencias.length;
    if (e.key === 'Escape') setAbierto(false);
    else if ((e.key === 'ArrowDown' || e.key === 'ArrowUp') && n > 0) {
      e.preventDefault();
      setAbierto(true);
      setActiva((a) => (e.key === 'ArrowDown' ? (a + 1) % n : (a - 1 + n) % n));
    } else if (e.key === 'Enter' && conLista && sugerencias[activa] !== undefined) {
      e.preventDefault();
      elegir(sugerencias[activa]);
    }
  };
  const anuncio =
    estado.fase === 'buscando'
      ? base.buscando
      : estado.fase === 'error'
        ? base.noSePudoBuscar
        : estado.fase === 'listo'
          ? sugerencias.length === 0
            ? base.sinComercios(valor.trim())
            : base.comercios(sugerencias.length)
          : '';
  const panel = abierto && (estado.fase === 'listo' || estado.fase === 'error');

  return (
    <Campo etiqueta={etiqueta} requerido={requerido} {...(error === undefined ? {} : { error })}>
      {(control) => (
        <div
          className="campo-valor"
          onBlur={(e) => {
            if (!e.currentTarget.contains(e.relatedTarget)) setAbierto(false);
          }}
        >
          <input
            {...control}
            ref={caja}
            role="combobox"
            aria-expanded={conLista}
            aria-controls={`${id}-lista`}
            aria-autocomplete="list"
            {...(conLista && activa >= 0
              ? { 'aria-activedescendant': `${id}-o${String(activa)}` }
              : {})}
            autoComplete="off"
            className="campo-entrada"
            value={valor}
            {...(marcador === undefined ? {} : { placeholder: marcador })}
            {...(nombre === undefined ? {} : { name: nombre })}
            onChange={(e) => {
              escribir(e.target.value);
            }}
            onKeyDown={alTeclear}
          />
          {estado.fase === 'buscando' ? (
            <span aria-hidden="true" className="campo-detalle shrink-0">
              {base.buscando}
            </span>
          ) : (
            <Icono nombre="search" tamano={18} className="shrink-0" />
          )}
          <div className="campo-panel" hidden={!panel}>
            <div id={`${id}-lista`} role="listbox" aria-label={etiqueta} hidden={!conLista}>
              {sugerencias.map((s, k) => (
                // Las teclas las maneja el combobox; el puntero elige con mousedown, que no le quita el foco a la caja.
                <div
                  key={s.valor}
                  id={`${id}-o${String(k)}`}
                  role="option"
                  aria-selected={k === activa}
                  {...(k === activa ? { 'data-activa': '' } : {})}
                  className="campo-opcion"
                  onPointerMove={() => {
                    setActiva(k);
                  }}
                  onMouseDown={(e) => {
                    e.preventDefault();
                    elegir(s);
                  }}
                >
                  <span className="flex min-w-0 flex-1 flex-col">
                    <span className="campo-opcion-nombre">
                      <Resaltado texto={s.etiqueta} buscado={valor} />
                    </span>
                    {s.detalle === undefined ? null : (
                      <span className="campo-detalle">{s.detalle}</span>
                    )}
                  </span>
                </div>
              ))}
            </div>
            {estado.fase === 'listo' && sugerencias.length === 0 ? (
              <p className="campo-panel-mensaje">{anuncio}</p>
            ) : null}
            {estado.fase === 'error' ? (
              <div className="campo-panel-error">
                <Icono nombre="problema" tamano={16} />
                <span className="flex-1">{base.noSePudoBuscar}</span>
                <button
                  type="button"
                  className="campo-reintentar"
                  onClick={() => {
                    caja.current?.focus();
                    consultar(valor);
                  }}
                >
                  {base.reintentar}
                </button>
              </div>
            ) : null}
          </div>
          <p role="status" className="sr-only">
            {anuncio}
          </p>
        </div>
      )}
    </Campo>
  );
}

'use client';
// Búsqueda de `/actividad` (FT-24, CA-24.6; 05 §2.6): `?texto=` cambia la URL 300 ms después de la última tecla, una sola vez
// por ráfaga. Conserva los demás filtros y suelta el cursor (la lista empieza de nuevo). Sin JavaScript, el formulario GET hace lo
// mismo al enviarlo.
import { useEffect, useRef, useState } from 'react';
import { EntradaTexto } from '../../../componentes/base/campo';
import { Icono } from '../../../componentes/base/icono';
import { useReemplazarBusqueda } from '../../../componentes/navegacion/use-reemplazar-busqueda';
import { actividad as t } from '../../../textos/actividad';

const ESPERA_MS = 300;

export function Buscador({
  texto,
  resto,
}: {
  readonly texto: string;
  /** Los demás parámetros de la URL, sin `texto` ni `cursor`. */
  readonly resto: Readonly<Record<string, string | undefined>>;
}) {
  const reemplazar = useReemplazarBusqueda();
  const [valor, setValor] = useState(texto);
  const temporizador = useRef<ReturnType<typeof setTimeout> | undefined>(undefined);
  const ultimoRestoRef = useRef(resto);
  ultimoRestoRef.current = resto;
  useEffect(
    () => () => {
      clearTimeout(temporizador.current);
    },
    [],
  );

  const aplicar = (nuevo: string) => {
    const busqueda: Record<string, string> = {};
    for (const [k, v] of Object.entries(ultimoRestoRef.current))
      if (v !== undefined) busqueda[k] = v;
    if (nuevo !== '') busqueda['texto'] = nuevo;
    reemplazar(busqueda);
  };
  const cambiar = (nuevo: string) => {
    setValor(nuevo);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      aplicar(nuevo);
    }, ESPERA_MS);
  };
  const borrar = () => {
    setValor('');
    clearTimeout(temporizador.current);
    aplicar('');
  };

  return (
    <form method="get" action="/actividad" role="search" className="flex flex-col gap-2">
      {Object.entries(resto).map(([k, v]) =>
        v === undefined ? null : <input key={k} type="hidden" name={k} value={v} />,
      )}
      <div className="flex items-start gap-1">
        <div className="relative min-w-0 flex-1">
          <EntradaTexto
            etiqueta={t.buscar}
            etiquetaOculta
            type="search"
            name="texto"
            placeholder={t.buscarMarcador}
            value={valor}
            autoComplete="off"
            className="pl-10 [&::-webkit-search-cancel-button]:hidden"
            onChange={(e) => {
              cambiar(e.currentTarget.value);
            }}
          />
          <Icono
            nombre="search"
            tamano={20}
            className="pointer-events-none absolute top-3 left-3 text-texto-secundario"
          />
        </div>
        {valor === '' ? null : (
          <button
            type="button"
            aria-label={t.borrarBusqueda}
            onClick={borrar}
            className="flex size-12 shrink-0 items-center justify-center rounded-control text-texto focus-visible:outline-3 focus-visible:outline-offset-2 focus-visible:outline-foco"
          >
            <Icono nombre="x" tamano={20} />
          </button>
        )}
      </div>
    </form>
  );
}

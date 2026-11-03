'use client';
// Búsqueda de `/actividad` (FT-24, CA-24.6; 05 §2.6): `?texto=` cambia la URL 300 ms después de la última tecla, una sola vez
// por ráfaga. Conserva los demás filtros y suelta el cursor (la lista empieza de nuevo). Sin JavaScript, el formulario GET hace lo
// mismo al enviarlo.
import { useEffect, useRef, useState } from 'react';
import { EntradaTexto } from '../../../componentes/base/campo';
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

  const cambiar = (nuevo: string) => {
    setValor(nuevo);
    clearTimeout(temporizador.current);
    temporizador.current = setTimeout(() => {
      const busqueda: Record<string, string> = {};
      for (const [k, v] of Object.entries(ultimoRestoRef.current))
        if (v !== undefined) busqueda[k] = v;
      if (nuevo !== '') busqueda['texto'] = nuevo;
      reemplazar(busqueda);
    }, ESPERA_MS);
  };

  return (
    <form method="get" action="/actividad" role="search" className="flex flex-col gap-2">
      {Object.entries(resto).map(([k, v]) =>
        v === undefined ? null : <input key={k} type="hidden" name={k} value={v} />,
      )}
      <EntradaTexto
        etiqueta={t.buscar}
        descripcion={t.buscarAyuda}
        type="search"
        name="texto"
        value={valor}
        autoComplete="off"
        onChange={(e) => {
          cambiar(e.currentTarget.value);
        }}
      />
    </form>
  );
}

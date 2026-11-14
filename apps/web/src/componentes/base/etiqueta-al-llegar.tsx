'use client';
// [CH-281] C-50 (AVISO-DE-RESULTADO §3 y §8) en las listas que dibuja el servidor: Programadas, Metas, Reglas y Seguridad. El
// resultado llega en la URL al volver de un flujo, así que la etiqueta aparece al montar. `FilaConEtiqueta` es la fila que se
// queda (resaltada, con la etiqueta pegada arriba, sin tapar el monto); `FilaQueSeFue` es la que ya no está en la lista: una
// tarjeta de una fila con su nombre que se queda los ms de `--duracion-aviso` y se recoge. Solo la fila con resultado dibuja
// la región `role="status"` con la frase: hay una por pantalla.
import { useEffect, useState, type ReactNode } from 'react';
import { cn } from '../../components/ui/utils';
import { EtiquetaResultado, FilaQueSale, useEtiqueta } from './etiqueta-resultado';

/** Lo que dejó el flujo: la palabra de la etiqueta y la frase de la región de estado (§8). */
export interface Llegada {
  readonly palabra: string;
  readonly frase: string;
}

function useLlegada(id: string, llegada: Llegada | undefined, sale: boolean) {
  const [anuncio, setAnuncio] = useState('');
  const [fuera, setFuera] = useState(false);
  const api = useEtiqueta(setAnuncio);
  const { mostrar } = api;
  const palabra = llegada?.palabra;
  const frase = llegada?.frase;
  useEffect(() => {
    if (palabra === undefined || frase === undefined) return;
    mostrar({
      id,
      palabra,
      frase,
      ...(sale
        ? {
            alIrse: () => {
              setFuera(true);
            },
          }
        : {}),
    });
  }, [id, palabra, frase, sale, mostrar]);
  const region =
    llegada === undefined ? null : (
      <p role="status" data-anuncio={id} className="sr-only">
        {anuncio}
      </p>
    );
  return { api, fuera, region };
}

type Datos = { readonly [k: `data-${string}`]: string | undefined };

/** Un `li` de la lista; con `llegada`, resaltado y con la etiqueta arriba (posición 2 de §3). */
export function FilaConEtiqueta({
  id,
  llegada,
  className,
  children,
  ...datos
}: {
  readonly id: string;
  readonly llegada?: Llegada | undefined;
  readonly className?: string;
  readonly children: ReactNode;
} & Datos) {
  const { api, region } = useLlegada(id, llegada, false);
  if (llegada === undefined)
    return (
      <li {...datos} className={className}>
        {children}
      </li>
    );
  return (
    <li
      {...datos}
      {...(api.resaltada(id) ? { 'data-resaltada': '' } : {})}
      className={cn(className, 'fz-resaltable')}
    >
      {children}
      <EtiquetaResultado api={api} id={id} posicion="arriba" />
      {region}
    </li>
  );
}

/** La fila que ya salió de la lista (posición 4 de §3): se queda con la etiqueta y se recoge; después no queda nada. */
export function FilaQueSeFue({
  id,
  llegada,
  children,
}: {
  readonly id: string;
  readonly llegada: Llegada;
  readonly children: ReactNode;
}) {
  const { api, fuera, region } = useLlegada(id, llegada, true);
  if (fuera) return null;
  return (
    <>
      <ul
        data-fila-que-se-fue={id}
        className="fz-tarjeta-etiqueta rounded-contenedor bg-superficie shadow-elevacion-1"
      >
        <FilaQueSale api={api} id={id}>
          <div
            {...(api.resaltada(id) ? { 'data-resaltada': '' } : {})}
            className="fz-resaltable flex min-h-14 items-center gap-3 rounded-contenedor px-4 py-3 font-semibold"
          >
            {children}
            <EtiquetaResultado api={api} id={id} posicion="arriba" />
          </div>
        </FilaQueSale>
      </ul>
      {region}
    </>
  );
}

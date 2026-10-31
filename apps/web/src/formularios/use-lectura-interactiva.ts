'use client';
// `useLecturaInteractiva` (05 §4.12, FE-15, CP-3): las lecturas que responden mientras el usuario escribe. Espera de
// 300 ms tras la última pulsación, mínimo de 2 caracteres y cancelación del lado del cliente: a lo sumo una lectura en
// vuelo; si el texto cambia mientras tanto, solo queda el último texto pendiente y sale al terminar la que está en
// vuelo. Una respuesta que no corresponde al texto actual se descarta. Sus errores no son del formulario.
import { useCallback, useEffect, useRef, useState } from 'react';
import type { ResultadoAccion } from '@finn/aplicacion/errores';

export interface OpcionesLectura {
  readonly minimo?: number;
  readonly esperaMs?: number;
}

export function useLecturaInteractiva<Salida>(
  lectura: (entrada: { readonly texto: string }) => Promise<ResultadoAccion<Salida>>,
  { minimo = 2, esperaMs = 300 }: OpcionesLectura = {},
) {
  const [resultado, setResultado] = useState<Salida | null>(null);
  const enVuelo = useRef(false);
  const pendiente = useRef<string | null>(null);
  const actual = useRef('');
  const temporizador = useRef<ReturnType<typeof setTimeout> | null>(null);
  const montado = useRef(true);
  const funcion = useRef(lectura);

  useEffect(() => {
    funcion.current = lectura;
  }, [lectura]);
  useEffect(() => {
    montado.current = true;
    return () => {
      montado.current = false;
      if (temporizador.current !== null) clearTimeout(temporizador.current);
    };
  }, []);

  const ejecutar = useCallback(async (texto: string): Promise<void> => {
    enVuelo.current = true;
    let valor: Salida | null = null;
    try {
      const r = await funcion.current({ texto });
      valor = r.ok ? r.valor : null; // si falla, simplemente no hay resultado
    } catch {
      valor = null;
    } finally {
      enVuelo.current = false;
    }
    if (montado.current && texto === actual.current) setResultado(valor);
    const siguiente = pendiente.current;
    pendiente.current = null;
    if (montado.current && siguiente !== null && siguiente !== texto) await ejecutar(siguiente);
  }, []);

  /** Se llama en cada cambio del campo con el texto completo. */
  const consultar = useCallback(
    (texto: string): void => {
      const limpio = texto.trim();
      actual.current = limpio;
      if (temporizador.current !== null) clearTimeout(temporizador.current);
      temporizador.current = null;
      if (limpio.length < minimo) {
        pendiente.current = null;
        setResultado(null);
        return;
      }
      temporizador.current = setTimeout(() => {
        temporizador.current = null;
        if (enVuelo.current) pendiente.current = limpio;
        else void ejecutar(limpio);
      }, esperaMs);
    },
    [minimo, esperaMs, ejecutar],
  );

  return { resultado, consultar };
}

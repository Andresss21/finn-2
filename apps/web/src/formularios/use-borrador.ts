'use client';
// `useBorrador` (05 §4.11, FE-14): el borrador de un flujo largo en el `sessionStorage` de la pestaña. Se escribe 500 ms
// después del último cambio, se lee después de montar (en un efecto, para no romper la hidratación) y se borra al
// terminar con `ok: true`, al descartar y ante `NO_ENCONTRADO`. Conserva el id de creación y la copia de `esperado` de
// cuando se abrió, así que un cambio hecho en otra parte termina en `conflicto_desactualizado`. No calcula montos (PF-3).
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { almacen } from '../cliente/almacen';
import { instanteActual } from '../cliente/reloj';
import type { Operacion } from './use-operacion';

export const PREFIJO_BORRADOR = 'finn:borrador:';
const ESPERA_MS = 500;

interface Guardado {
  readonly version: 1;
  readonly guardadoEn: string;
  readonly campos: unknown;
  readonly id: string | null;
  readonly esperado: Readonly<Record<string, unknown>> | undefined;
  readonly revisionAlAbrir: string | null;
}

/** Clave de 4.11: la ruta sin parámetros de búsqueda y el id de la entidad, si la hay. */
export const claveDeBorrador = (ruta: string, entidad = ''): string =>
  `${PREFIJO_BORRADOR}v1:${ruta.split('?')[0] ?? ruta}:${entidad}`;

/** Al salir de la sesión (4.11): se borran todos los borradores de la pestaña. */
export const borrarBorradores = (): void => {
  almacen.borrarPrefijo(PREFIJO_BORRADOR);
};

function leerGuardado(clave: string): Guardado | null {
  const texto = almacen.leer(clave);
  if (texto === null) return null;
  try {
    const g = JSON.parse(texto) as Partial<Guardado> | null;
    return g?.version === 1 && g.campos !== undefined ? (g as Guardado) : null;
  } catch {
    return null;
  }
}

export interface OpcionesBorrador<Campos> {
  /** Ruta del flujo sin parámetros de búsqueda; por omisión, la de la pestaña. */
  readonly ruta?: string;
  /** Id de la entidad que se edita, si la hay. */
  readonly entidad?: string;
  /** Los campos actuales del formulario (`watch()`): serializables. */
  readonly campos: Campos;
  readonly operacion: Pick<Operacion, 'estado' | 'error' | 'paraBorrador' | 'restaurarBorrador'>;
  /** Pone los campos del borrador en el formulario (`reset(campos)`). */
  readonly restaurar: (campos: Campos) => void;
  /** Vuelve el formulario a sus valores iniciales (al descartar). */
  readonly alDescartar: () => void;
  readonly revisionAlAbrir?: string;
}

export function useBorrador<Campos>(opciones: OpcionesBorrador<Campos>) {
  const rutaActual = usePathname();
  const clave = claveDeBorrador(opciones.ruta ?? rutaActual, opciones.entidad);
  const { campos, operacion, restaurar, alDescartar, revisionAlAbrir } = opciones;
  const { paraBorrador, restaurarBorrador, estado, error } = operacion;
  const inicial = useRef<string>(JSON.stringify(campos));
  const leido = useRef<string | null>(null); // la clave ya leída
  const terminado = useRef(false);
  const [recuperado, setRecuperado] = useState(false);
  const serializado = JSON.stringify(campos);

  // Leer: después de montar. Hasta entonces no se escribe, para no pisar el borrador con los valores iniciales.
  useEffect(() => {
    if (leido.current === clave) return; // una vez por clave
    leido.current = clave;
    const guardado = leerGuardado(clave);
    if (guardado === null) return;
    restaurar(guardado.campos as Campos);
    restaurarBorrador({ id: guardado.id, esperado: guardado.esperado });
    setRecuperado(true);
  }, [clave, restaurar, restaurarBorrador]);

  // Escribir: 500 ms después del último cambio; sin cambios respecto de los valores iniciales, no hay borrador.
  useEffect(() => {
    if (leido.current !== clave || terminado.current) return undefined;
    const espera = setTimeout(() => {
      if (serializado === inicial.current && !recuperado) {
        almacen.borrar(clave);
        return;
      }
      const { id, esperado } = paraBorrador();
      const guardado: Guardado = {
        version: 1,
        guardadoEn: instanteActual(),
        campos: JSON.parse(serializado) as unknown,
        id,
        esperado,
        revisionAlAbrir: revisionAlAbrir ?? null,
      };
      almacen.escribir(clave, JSON.stringify(guardado));
    }, ESPERA_MS);
    return () => {
      clearTimeout(espera);
    };
  }, [serializado, clave, paraBorrador, recuperado, revisionAlAbrir]);

  const borrar = useCallback((): void => {
    almacen.borrar(clave);
  }, [clave]);

  // Borrar: al terminar con `ok: true` y ante `NO_ENCONTRADO`.
  useEffect(() => {
    if (estado === 'listo' || error?.categoria === 'NO_ENCONTRADO') {
      terminado.current = true;
      borrar();
      setRecuperado(false);
    } else if (estado === 'editando') {
      terminado.current = false;
    }
  }, [estado, error, borrar]);

  const descartar = useCallback((): void => {
    borrar();
    setRecuperado(false);
    alDescartar();
  }, [borrar, alDescartar]);

  return { recuperado, descartar, borrar };
}

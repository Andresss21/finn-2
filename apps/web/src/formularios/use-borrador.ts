'use client';
// `useBorrador` (05 §4.11, FE-14): el borrador de un flujo largo en el `sessionStorage` de la pestaña. Se escribe 500 ms
// después del último cambio, se lee después de montar (en un efecto, para no romper la hidratación) y se borra al
// terminar con `ok: true`, al descartar y ante `NO_ENCONTRADO`. Conserva el id de creación y la copia de `esperado` de
// cuando se abrió, así que un cambio hecho en otra parte termina en `conflicto_desactualizado`. No calcula montos (PF-3).
// [CH-286] C-51 (enmienda E3-17): el aviso «Recuperamos…» sale una sola vez por borrador. Al leerlo se marca `avisoVisto` en la
// misma clave (el formato no cambia de versión: el borrador guardado antes, sin la marca, avisa una vez y queda marcado); las
// escrituras siguientes la conservan, y un borrador nuevo (después de guardar o descartar) la empieza sin marcar.
import { usePathname } from 'next/navigation';
import { useCallback, useEffect, useRef, useState } from 'react';
import { almacen } from '../cliente/almacen';
import { instanteActual } from '../formato/instante';
import { formularios } from '../textos/formularios';
import { claveDeBorrador, PREFIJO_BORRADOR } from './clave-borrador';
import type { Operacion } from './use-operacion';

export { claveDeBorrador, PREFIJO_BORRADOR };
const ESPERA_MS = 500;

interface Guardado {
  readonly version: 1;
  readonly guardadoEn: string;
  readonly campos: unknown;
  readonly id: string | null;
  readonly esperado: Readonly<Record<string, unknown>> | undefined;
  readonly revisionAlAbrir: string | null;
  /** [CH-286] El aviso de borrador recuperado ya salió para este borrador. */
  readonly avisoVisto?: true;
}

/** Al salir de la sesión (4.11): se borran todos los borradores de la pestaña. */
export const borrarBorradores = (): void => {
  almacen.borrarPrefijo(PREFIJO_BORRADOR);
};

/** El borrador guardado en esa clave, si es válido (4.11). Lo usa también «Salir» (05 §9.6 [CH-242]). */
export function leerGuardado(clave: string): Guardado | null {
  const texto = almacen.leer(clave);
  if (texto === null) return null;
  try {
    const g = JSON.parse(texto) as Partial<Guardado> | null;
    return g?.version === 1 && g.campos !== undefined ? (g as Guardado) : null;
  } catch {
    return null;
  }
}

const esObjeto = (v: unknown): v is Readonly<Record<string, unknown>> =>
  typeof v === 'object' && v !== null && !Array.isArray(v);

/**
 * Los campos del borrador sobre los valores iniciales del formulario: la clave que el borrador no trae (un campo agregado
 * después de guardarlo) toma su valor inicial, en vez de quedar `undefined`.
 */
export function completarConIniciales(iniciales: unknown, guardados: unknown): unknown {
  return esObjeto(iniciales) && esObjeto(guardados) ? { ...iniciales, ...guardados } : guardados;
}

export interface OpcionesBorrador<Campos> {
  /** Ruta del flujo sin parámetros de búsqueda; por omisión, la de la pestaña. */
  readonly ruta?: string;
  /** Id de la entidad que se edita, si la hay. */
  readonly entidad?: string;
  /** Los campos actuales del formulario (`watch()`): serializables. */
  readonly campos: Campos;
  readonly operacion: Pick<Operacion, 'estado' | 'error' | 'paraBorrador' | 'restaurarBorrador'>;
  /**
   * Pone los campos del borrador en el formulario (`reset(campos)`). Recibe el borrador completado con los valores iniciales:
   * un borrador guardado antes de que el formulario tuviera un campo no trae esa clave, y el campo toma su valor inicial.
   */
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
  const visto = useRef(false); // el borrador de esta clave ya avisó
  const [avisar, setAvisar] = useState(false);
  const [anuncio, setAnuncio] = useState('');
  const serializado = JSON.stringify(campos);
  /** [CH-290] El id de creación y el `esperado` de la operación antes de restaurar: «Descartar borrador» vuelve a ellos. */
  const alAbrir = useRef<ReturnType<typeof paraBorrador> | null>(null);

  // Leer: después de montar. Hasta entonces no se escribe, para no pisar el borrador con los valores iniciales.
  useEffect(() => {
    if (leido.current === clave) return; // una vez por clave
    leido.current = clave;
    const guardado = leerGuardado(clave);
    if (guardado === null) return;
    alAbrir.current = paraBorrador();
    restaurar(completarConIniciales(JSON.parse(inicial.current), guardado.campos) as Campos);
    restaurarBorrador({ id: guardado.id, esperado: guardado.esperado });
    setRecuperado(true);
    visto.current = true;
    if (guardado.avisoVisto === true) return;
    almacen.escribir(clave, JSON.stringify({ ...guardado, avisoVisto: true }));
    setAvisar(true);
  }, [clave, restaurar, restaurarBorrador, paraBorrador]);

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
        ...(visto.current ? { avisoVisto: true as const } : {}),
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
      visto.current = false;
      setRecuperado(false);
      setAvisar(false);
    } else if (estado === 'editando') {
      terminado.current = false;
    }
  }, [estado, error, borrar]);

  const descartar = useCallback((): void => {
    borrar();
    // [CH-290] El id del borrador descartado pudo haberse enviado ya: el formulario vacío empieza con el de cuando se abrió.
    if (alAbrir.current !== null) restaurarBorrador(alAbrir.current);
    alAbrir.current = null;
    visto.current = false;
    setRecuperado(false);
    setAvisar(false);
    setAnuncio(formularios.descartasteBorrador);
    alDescartar();
  }, [borrar, alDescartar, restaurarBorrador]);

  /**
   * `recuperado`: hay un borrador restaurado («Descartar borrador» al pie). `avisar`: es la primera vez que se abre este borrador
   * (el aviso momentáneo). `anuncio`: lo que dice la región de estado del borrador.
   */
  return { recuperado, avisar, anuncio, descartar, borrar };
}

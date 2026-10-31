'use client';
// `ProveedorEncabezado` y `PublicarEncabezado` (05 §1.6, §6.4, FE-06): el layout no consulta nada, así que cada página
// publica el `Encabezado` de su consulta y el marco muestra de ahí sus contadores. Mientras ninguna página publicó,
// `encabezado` es `null` («sin dato», nunca un cero inventado). `revision` y `hoy` van a `<html>` (05 §14.3).
import type { Encabezado } from '@finn/aplicacion/consultas/comun';
import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from 'react';

export interface EncabezadoRecibido {
  readonly encabezado: Encabezado | null;
  /** Instante monotónico (`performance.now()`) en que llegó, para medir su antigüedad (6.7). */
  readonly recibidoEn: number | null;
}

interface ContextoEncabezado extends EncabezadoRecibido {
  readonly publicar: (encabezado: Encabezado) => void;
}

const Contexto = createContext<ContextoEncabezado | null>(null);

export function ProveedorEncabezado({ children }: { readonly children: ReactNode }) {
  const [recibido, setRecibido] = useState<EncabezadoRecibido>({
    encabezado: null,
    recibidoEn: null,
  });
  // Estable: `PublicarEncabezado` lo tiene en las dependencias de su efecto y, si cambiara, publicaría en bucle.
  const publicar = useCallback((encabezado: Encabezado) => {
    setRecibido({ encabezado, recibidoEn: performance.now() });
  }, []);
  const valor = useMemo<ContextoEncabezado>(
    () => ({ ...recibido, publicar }),
    [recibido, publicar],
  );
  useEffect(() => {
    const raiz = document.documentElement;
    if (recibido.encabezado === null) return;
    raiz.setAttribute('data-revision', recibido.encabezado.revision);
    raiz.setAttribute('data-hoy', recibido.encabezado.hoy);
  }, [recibido]);
  return <Contexto value={valor}>{children}</Contexto>;
}

/** `{ encabezado, recibidoEn }` para los contratos de navegación, el refresco y los formularios (6.4). */
export function useEncabezado(): EncabezadoRecibido {
  const contexto = useContext(Contexto);
  if (contexto === null) throw new Error('useEncabezado fuera de ProveedorEncabezado');
  return contexto;
}

/** Sin salida visible: la página lo renderiza con el `Encabezado` que devolvió su consulta (1.6). */
export function PublicarEncabezado({ encabezado }: { readonly encabezado: Encabezado }) {
  const contexto = useContext(Contexto);
  const publicar = contexto?.publicar;
  useEffect(() => {
    publicar?.(encabezado);
  }, [publicar, encabezado]);
  return null;
}

'use client';
// `useUnToque` (05 §4.14, FE-24): acciones sin datos que completar ni confirmación previa. Ejecuta con `useOperacion`
// (mismo envío, doble envío, reintentos y tabla de 4.7) y, después de `ok: true`, ofrece la salida para revertir cuando la
// tabla define una inversa. La salida se arma solo con la entrada y el resultado (nunca calcula montos, PF-3), dura
// mientras la pantalla siga montada, sin límite de tiempo, y desaparece al hacer otra acción o al usarla.
import { useCallback, useEffect, useRef, useState } from 'react';
import { useOperacion, type AccionEscritura } from './use-operacion';

export interface Inversa {
  /** Lo que se le muestra al usuario: "Descartaste SUPER SELECTOS $45.00" (regla 4). */
  readonly descripcion: string;
  /** Texto del botón: "Restaurar". */
  readonly etiqueta: string;
  /** La entrada de la operación inversa, con los valores intercambiados. */
  readonly entrada: unknown;
}

export interface OpcionesUnToque {
  readonly accion: AccionEscritura;
  /** La operación inversa de la tabla de 4.14; sin ella, la acción no ofrece salida. */
  readonly accionInversa?: AccionEscritura;
  /** Arma la salida solo con la entrada y el valor del resultado; `null` si ese caso no tiene inversa. */
  readonly inversa?: (entrada: unknown, valor: unknown) => Inversa | null;
  readonly creacion?: boolean;
}

export function useUnToque({ accion, accionInversa, inversa, creacion }: OpcionesUnToque) {
  const principal = useOperacion({ accion, ...(creacion === undefined ? {} : { creacion }) });
  const revertir = useOperacion({ accion: accionInversa ?? accion });
  const [salida, setSalida] = useState<Inversa | null>(null);
  const entrada = useRef<unknown>(undefined);
  const armar = useRef(inversa);
  useEffect(() => {
    armar.current = inversa;
  }, [inversa]);

  // Después de `ok: true` (y solo si hay inversa): la salida para revertir.
  const { exito, enviar } = principal;
  useEffect(() => {
    if (exito === undefined || accionInversa === undefined) return;
    setSalida(armar.current?.(entrada.current, exito.valor) ?? null);
  }, [exito, accionInversa]);

  // Usarla: desaparece cuando la inversa termina bien.
  const { estado: estadoInversa } = revertir;
  useEffect(() => {
    if (estadoInversa === 'listo') setSalida(null);
  }, [estadoInversa]);

  /** Hacer otra acción sobre el mismo elemento retira la salida anterior. */
  const tocar = useCallback(
    (nueva: unknown): Promise<void> => {
      setSalida(null);
      entrada.current = nueva;
      return enviar(nueva);
    },
    [enviar],
  );

  const { enviar: enviarInversa } = revertir;
  const deshacer = useCallback((): Promise<void> => {
    if (salida === null) return Promise.resolve();
    return enviarInversa(salida.entrada);
  }, [salida, enviarInversa]);

  return { ...principal, tocar, salida, deshacer, revertir };
}

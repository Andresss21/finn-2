'use client';
// Destello de un monto que cambió (CH-220 C3, FIXES §3): si el valor que trae el servidor no es el que se dibujó antes en la
// misma pantalla montada, el monto hace un destello de 600 ms: sube 4 px en `--positivo-texto` si aumentó y baja en
// `--problema-texto` si bajó. Solo compara el valor recibido con el anterior: no calcula ni guarda montos (PF-3).
import { useState, type ReactNode } from 'react';
import { useMovimientoReducido } from './use-movimiento-reducido';

const CLASE = { sube: 'fz-destello-sube', baja: 'fz-destello-baja' } as const;

export function Destello({
  valor,
  children,
}: {
  readonly valor: number;
  readonly children: ReactNode;
}) {
  const reducido = useMovimientoReducido();
  const [previo, setPrevio] = useState(valor);
  const [cambio, setCambio] = useState<{
    readonly hacia: keyof typeof CLASE;
    readonly n: number;
  } | null>(null);
  // Información del dibujo anterior (patrón de React): sin efecto ni reloj.
  if (valor !== previo) {
    setPrevio(valor);
    if (!reducido) setCambio({ hacia: valor > previo ? 'sube' : 'baja', n: (cambio?.n ?? 0) + 1 });
  }
  if (cambio === null) return <span className="inline-block">{children}</span>;
  return (
    <span
      key={cambio.n}
      data-destello={cambio.hacia}
      className={`inline-block ${CLASE[cambio.hacia]}`}
      onAnimationEnd={() => {
        setCambio(null);
      }}
    >
      {children}
    </span>
  );
}

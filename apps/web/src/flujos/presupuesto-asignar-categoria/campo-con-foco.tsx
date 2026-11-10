'use client';
// [A36] El campo del monto toma el foco al abrir Asignar. Va en el flujo y no en `EntradaMonto` para no sumar bytes a las otras
// rutas (05 §13.1); dentro de la hoja corre antes de que Radix elija el primer control.
import { useEffect, useRef, type ReactNode } from 'react';

export function CampoConFoco({ children }: { readonly children: ReactNode }) {
  const caja = useRef<HTMLDivElement>(null);
  useEffect(() => {
    caja.current?.querySelector('input')?.focus();
  }, []);
  return <div ref={caja}>{children}</div>;
}

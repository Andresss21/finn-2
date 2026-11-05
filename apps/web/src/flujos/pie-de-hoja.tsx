'use client';
// Pie de una hoja corta del presupuesto (07-flujos-del-presupuesto del export): «Cancelar» tonal y la acción principal en dos
// columnas. `cerrarFlujo()` es el de 05 §1.4. No calcula nada (PF-3).
import type { ReactNode } from 'react';
import { Boton } from '../componentes/base/boton';
import { useCerrarFlujo } from '../componentes/navegacion/flujo-de-ruta';
import { formularios } from '../textos/formularios';

export function PieDeHoja({
  rutaPadre,
  superpuesto,
  children,
}: {
  readonly rutaPadre: string;
  readonly superpuesto: boolean;
  /** La acción principal (un `Boton` de envío). */
  readonly children: ReactNode;
}) {
  const cerrar = useCerrarFlujo(rutaPadre, superpuesto);
  return (
    <div className="grid grid-cols-2 gap-2">
      <Boton variante="secundaria" onClick={cerrar}>
        {formularios.cancelar}
      </Boton>
      {children}
    </div>
  );
}

// Layout de `ingresar` (05 §1.2): fuera de `(finn)` porque se usa justamente sin sesión AAL2. Sus páginas
// (`page`, `verificar`, `inscribir`) las crea la tarea dueña de cada ruta (DT-23).
// ACC-06: en computadora, una tarjeta `--superficie` centrada; en teléfono, la columna sin tarjeta con 24 px laterales.
import type { ReactNode } from 'react';
import { Marca } from '../../componentes/marco/marca';

export default function LayoutIngresar({ children }: { readonly children: ReactNode }) {
  return (
    <main className="flex min-h-dvh flex-col bg-fondo text-texto md:items-center md:justify-center md:p-6">
      <div className="mx-auto flex w-full max-w-md flex-col gap-8 px-6 pb-10 pt-16 md:rounded-contenedor md:bg-superficie md:p-10 md:shadow-elevacion-2">
        <Marca />
        {children}
      </div>
    </main>
  );
}

// Layout de `ingresar` (05 §1.2): fuera de `(finn)` porque se usa justamente sin sesión AAL2. Sus páginas
// (`page`, `verificar`, `inscribir`) las crea la tarea dueña de cada ruta (DT-23).
import type { ReactNode } from 'react';
import { Marca } from '../../componentes/marco/marca';

export default function LayoutIngresar({ children }: { readonly children: ReactNode }) {
  return (
    <main className="mx-auto flex min-h-dvh max-w-md flex-col gap-8 bg-fondo px-5 py-10 text-texto">
      <Marca />
      {children}
    </main>
  );
}

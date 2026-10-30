// Layout de `ingresar` (05 §1.2): fuera de `(finn)` porque se usa justamente sin sesión AAL2. Sus páginas
// (`page`, `verificar`, `inscribir`) las crea la tarea dueña de cada ruta (DT-23).
import type { ReactNode } from 'react';

export default function LayoutIngresar({ children }: { readonly children: ReactNode }) {
  return <main>{children}</main>;
}

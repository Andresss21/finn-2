'use client';
// El formulario de la devolución se carga solo cuando se abre `/registrar/devolucion`: `/registrar/ingreso` comparte ruta y no lo
// necesita (05 §13.1).
import { lazy, Suspense } from 'react';
import type { PropsFormularioDevolucion } from './devolucion';

const Formulario = lazy(() =>
  import('./devolucion').then((m) => ({ default: m.FormularioDevolucion })),
);

export const FormularioDevolucion = (p: PropsFormularioDevolucion) => (
  <Suspense fallback={null}>
    <Formulario {...p} />
  </Suspense>
);

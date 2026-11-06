'use client';
// El formulario de FT-56 se carga solo cuando se abre `/registrar/desembolso`: las demás rutas de `[tipo]` no lo necesitan (05 §13.1).
import { lazy, Suspense } from 'react';
import type { PropsFormularioDesembolso } from './formulario-desembolso';

const Formulario = lazy(() =>
  import('./formulario-desembolso').then((m) => ({ default: m.FormularioDesembolso })),
);

export const FormularioDesembolso = (p: PropsFormularioDesembolso) => (
  <Suspense fallback={null}>
    <Formulario {...p} />
  </Suspense>
);

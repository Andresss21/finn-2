'use client';
// El formulario de FT-57 se carga solo cuando se abre uno de sus tres flujos: `/registrar/ingreso` comparte ruta y no lo necesita (05 §13.1).
import { lazy, Suspense } from 'react';
import type { PropsFormularioRegistrarInversion } from './inversion-formulario';

const Formulario = lazy(() =>
  import('./inversion-formulario').then((m) => ({ default: m.FormularioRegistrarInversion })),
);

export const FormularioRegistrarInversion = (p: PropsFormularioRegistrarInversion) => (
  <Suspense fallback={null}>
    <Formulario {...p} />
  </Suspense>
);

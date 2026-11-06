'use client';
// El formulario de FT-32 se carga solo cuando se abre uno de sus tres flujos: `/registrar/ingreso` comparte ruta y no lo necesita (05 §13.1).
import { lazy, Suspense } from 'react';
import type { PropsFormularioRegistrarTarjeta } from './formulario-tarjeta';

const Formulario = lazy(() =>
  import('./formulario-tarjeta').then((m) => ({ default: m.FormularioRegistrarTarjeta })),
);

export const FormularioRegistrarTarjeta = (p: PropsFormularioRegistrarTarjeta) => (
  <Suspense fallback={null}>
    <Formulario {...p} />
  </Suspense>
);

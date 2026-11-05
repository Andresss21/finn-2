'use client';
// `ConfirmacionImpacto` con el impacto de AV-01 (FT-27): las líneas salen de la previsualización del servidor (PF-3). Va en su
// propio módulo (CH-180) para que solo la carguen las pantallas que la usan (05 §13.1, CH-87).
import { ConfirmacionImpacto, type PropsConfirmacionImpacto } from './confirmacion-impacto';
import { lineasDeImpacto, type VistaDeImpacto } from './lineas-impacto';

export function ConfirmacionImpactoDeVista({
  vista,
  ...resto
}: Omit<PropsConfirmacionImpacto, 'impacto'> & { readonly vista: VistaDeImpacto }) {
  return <ConfirmacionImpacto impacto={lineasDeImpacto(vista)} {...resto} />;
}

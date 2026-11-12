'use client';
// GLO-23 (CTA-04): los flujos cortos de Cuentas (verificar saldo, archivar, eliminar y pagar tarjeta) se abren como hoja inferior
// en el teléfono y panel lateral en computadora cuando se llega desde la app (ruta interceptada, 05 §1.4); la ruta directa queda
// como página completa de respaldo. El contenido es el mismo en las dos formas.
import type { ReactNode } from 'react';
import { PaginaFlujoDeRuta, SuperpuestoDeRuta } from '../../componentes/navegacion/flujo-de-ruta';

export function MarcoCorto({
  superpuesto,
  titulo,
  rutaPadre,
  children,
}: {
  readonly superpuesto: boolean;
  readonly titulo: string;
  /** La pantalla a la que vuelve la página completa al cerrar. */
  readonly rutaPadre: string;
  readonly children: ReactNode;
}) {
  return superpuesto ? (
    <SuperpuestoDeRuta titulo={titulo}>{children}</SuperpuestoDeRuta>
  ) : (
    <PaginaFlujoDeRuta titulo={titulo} rutaPadre={rutaPadre}>
      {children}
    </PaginaFlujoDeRuta>
  );
}

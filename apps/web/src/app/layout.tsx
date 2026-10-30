// Layout raíz (05 §1.2, FE-02): `<html lang="es">`. No lee la sesión, para que `ingresar` y `sin-conexion` no
// dependan de ella. El proveedor de tema, las fuentes y el manifiesto los suman TA-201 y TA-223.
import type { Metadata } from 'next';
import type { ReactNode } from 'react';

export const metadata: Metadata = { title: 'Finn' };

export default function LayoutRaiz({ children }: { readonly children: ReactNode }) {
  return (
    <html lang="es">
      <body>{children}</body>
    </html>
  );
}

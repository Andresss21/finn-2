// Layout de `sin-conexion` (05 §1.2): página de respaldo estática del service worker, sin sesión ni datos.
// La página la crea TA-223 (DT-23).
import type { ReactNode } from 'react';

export default function LayoutSinConexion({ children }: { readonly children: ReactNode }) {
  return <main>{children}</main>;
}

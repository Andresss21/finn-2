// Destino de PRU-E2E-PWA-005 y -009 (TA-212): su título distinto al del origen es lo que lee el anunciador de rutas.
import type { Metadata } from 'next';
import { soloEnPruebas } from '../../solo-pruebas.ts';

export const metadata: Metadata = { title: 'Destino de navegación · Finn' };

// Sin prerender: `soloEnPruebas()` decide en cada petición, no con el entorno de la compilación (PRU-SEG-ACCESO-002).
export const dynamic = 'force-dynamic';

export default function DestinoDeNavegacion() {
  soloEnPruebas();
  return (
    <main>
      <h1>{'Destino de navegación'}</h1>
    </main>
  );
}

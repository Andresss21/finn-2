// Destino de PRU-E2E-PWA-004 y -006 (TA-213): un segmento propio con su `loading.tsx`. La prueba retiene su respuesta
// RSC para ver el estado de carga. Solo con FINN_ENTORNO=pruebas; textos fuera del catálogo.
import { soloEnPruebas } from '../../solo-pruebas';

// Sin prerender: `soloEnPruebas()` decide en cada petición, no con el entorno de la compilación (PRU-SEG-ACCESO-002).
export const dynamic = 'force-dynamic';

export default function PaginaLenta() {
  soloEnPruebas();
  return (
    <main>
      <h1>{'Página lenta'}</h1>
    </main>
  );
}

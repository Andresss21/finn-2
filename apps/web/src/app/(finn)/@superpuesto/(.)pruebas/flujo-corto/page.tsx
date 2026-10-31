// El mismo flujo, interceptado sobre la pantalla de origen cuando se llega desde otra pantalla de la app (05 §1.4).
import { SuperpuestoDeRuta } from '../../../../../componentes/navegacion/flujo-de-ruta.tsx';
import { soloEnPruebas } from '../../../pruebas/solo-pruebas.ts';

// Sin prerender: `soloEnPruebas()` decide en cada petición, no con el entorno de la compilación (PRU-SEG-ACCESO-002).
export const dynamic = 'force-dynamic';

export default function FlujoCortoInterceptado() {
  soloEnPruebas();
  return (
    <SuperpuestoDeRuta titulo="Flujo corto de prueba">
      <p>{'Contenido del flujo corto.'}</p>
    </SuperpuestoDeRuta>
  );
}

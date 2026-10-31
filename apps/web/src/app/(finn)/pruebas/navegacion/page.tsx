// Pantalla de origen de PRU-E2E-PWA-005 y -009 (TA-212): publica un `Encabezado` de prueba (FE-06) y tiene un enlace sin
// precarga a la pantalla de destino (el caso D-8 de 05 §7.1). Solo con FINN_ENTORNO=pruebas; textos fuera del catálogo.
import type { Encabezado } from '@finn/aplicacion/consultas/comun';
import type { Metadata } from 'next';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado.tsx';
import { EnlaceFinn } from '../../../../componentes/navegacion/enlace-finn.tsx';
import { soloEnPruebas } from '../solo-pruebas.ts';

export const metadata: Metadata = { title: 'Origen de navegación · Finn' };

// Solo los campos que usa el marco; el resto del `Encabezado` no se lee.
const ENCABEZADO = {
  revision: 'revision-de-prueba',
  hoy: '2026-10-30',
  notificacionesNoLeidas: 2,
  bandejaPorRevisar: 3,
} as unknown as Encabezado;

export default function OrigenDeNavegacion() {
  soloEnPruebas();
  return (
    <main>
      <PublicarEncabezado encabezado={ENCABEZADO} />
      <h1>{'Origen de navegación'}</h1>
      <EnlaceFinn href="/pruebas/navegacion/destino" prefetch={false}>
        {'Ir al destino de navegación'}
      </EnlaceFinn>
    </main>
  );
}

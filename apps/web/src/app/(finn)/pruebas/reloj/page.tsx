// Pantalla de origen de PRU-E2E-RELOJ-002 (TA-220): publica un `Encabezado` de prueba cuyo `hoy` es el del reloj de prueba
// del servidor (CT-01), para ver cómo la agenda de la medianoche (05 §6.7) pasa al día siguiente sin recargar. Solo con
// FINN_ENTORNO=pruebas; textos fuera del catálogo.
import { relojDePrueba } from '@finn/aplicacion';
import type { Encabezado } from '@finn/aplicacion/consultas/comun';
import type { Metadata } from 'next';
import { PublicarEncabezado } from '../../../../componentes/marco/proveedor-encabezado.tsx';
import { soloEnPruebas } from '../solo-pruebas.ts';

export const dynamic = 'force-dynamic';

export const metadata: Metadata = { title: 'Reloj de prueba · Finn' };

export default function RelojDePrueba() {
  soloEnPruebas();
  const hoy = relojDePrueba()?.hoy ?? '';
  // Solo los campos que usa el marco; el resto del `Encabezado` no se lee.
  const encabezado = {
    revision: `revision-${hoy}`,
    hoy,
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
  } as unknown as Encabezado;
  return (
    <main>
      <PublicarEncabezado encabezado={encabezado} />
      <h1>{'Reloj de prueba'}</h1>
      <p>{`Hoy es ${hoy}`}</p>
    </main>
  );
}

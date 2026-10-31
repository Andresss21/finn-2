// Pantalla de origen de PRU-E2E-PRES-001: debe seguir montada debajo del flujo corto interceptado. La prueba navega con
// `router.push` (05 §1.4); `next/link` queda para `enlace-finn.tsx` (L11). Los textos son de prueba, fuera del catálogo.
import { soloEnPruebas } from '../solo-pruebas.ts';

export default function OrigenDePrueba() {
  soloEnPruebas();
  return (
    <main>
      <h1>{'Origen de prueba'}</h1>
    </main>
  );
}

// Rutas de prueba del arnés E2E (PRU-E2E-PRES-001): existen solo con FINN_ENTORNO=pruebas, como `/api/pruebas/reloj`.
// En producción responden 404 igual que si no existieran. Las reemplaza el primer flujo corto real.
import { notFound } from 'next/navigation';
import { relojPermitido } from '@finn/aplicacion';

export function soloEnPruebas(): void {
  if (!relojPermitido()) notFound();
}

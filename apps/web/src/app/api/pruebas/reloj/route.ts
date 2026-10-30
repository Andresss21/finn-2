// Observa el reloj de prueba del servidor (TA-219; 07 §4.1, CT-01), como `/api/eco` en el prototipo de V7-07: PRU-E2E-RELOJ
// no tiene otra forma de ver lo que `next start` lee del archivo. Fuera de la lista de permitidos (P7-10), como en
// producción, responde 404 sin leer nada: es igual a que la ruta no exista. No expone datos.
import { relojDePrueba, relojPermitido } from '@finn/aplicacion';

export const dynamic = 'force-dynamic';

export function GET(): Response {
  if (!relojPermitido()) return new Response(null, { status: 404 });
  const reloj = relojDePrueba();
  return Response.json({
    hoy: reloj?.hoy ?? null,
    desfaseMs: reloj?.desfaseMs ?? null,
    nodeEnv: process.env.NODE_ENV,
  });
}

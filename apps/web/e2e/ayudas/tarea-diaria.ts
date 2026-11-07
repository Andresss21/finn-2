// Disparar la tarea diaria desde la E2E (04 §10.1): el servidor de prueba (`playwright.config.ts`) arranca con este secreto, que
// solo existe en el servidor local de la corrida (FINN_ENTORNO=pruebas) y nunca autentica nada real.
import { expect, type APIRequestContext } from '@playwright/test';

export const SECRETO_TAREA_E2E = 'secreto-local-de-la-e2e-solo-para-pruebas-0000';

/** Lo que Vercel Cron hace a la hora de la tarea: `GET /api/tareas/diaria` con el secreto; el reloj del servidor ya está fijo. */
export async function correrTareaDiaria(request: APIRequestContext): Promise<void> {
  const respuesta = await request.get('/api/tareas/diaria', {
    headers: { authorization: `Bearer ${SECRETO_TAREA_E2E}` },
  });
  expect(respuesta.status()).toBe(200);
}

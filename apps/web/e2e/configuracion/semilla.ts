// El punto de partida de cada prueba (TA-219): el `test` con la red bloqueada y `sembrar`. Las pruebas de páginas
// importan `test` y `expect` de aquí, no de @playwright/test.
import { test as base } from '@playwright/test';
import type { Escenario } from '../../../../packages/dominio/escenarios/tipos';

export { expect } from '@playwright/test';

const BASE_E2E = 'finn_e2e';
const PILA = new URL(process.env['NEXT_PUBLIC_SUPABASE_URL'] ?? 'http://127.0.0.1:54321').host;

/** 07 §7.1: toda petición que no vaya al servidor de la app o a la pila local se aborta. */
export const test = base.extend<{ redBloqueada: undefined }>({
  redBloqueada: [
    async ({ page, baseURL }, usar) => {
      const permitidos = new Set([new URL(baseURL ?? 'http://localhost').host, PILA]);
      await page.route('**/*', (ruta) => {
        const { protocol, host } = new URL(ruta.request().url());
        const local = protocol === 'data:' || protocol === 'blob:' || permitidos.has(host);
        return local ? ruta.fallback() : ruta.abort('blockedbyclient');
      });
      await usar(undefined);
    },
    { auto: true },
  ],
});

/**
 * DP-17, 07 §12.4: corre en el proceso de Playwright, antes de abrir el navegador, con el ejecutor `int`: solo
 * operaciones reales de @finn/aplicacion, así la base solo tiene estados alcanzables. Corre el estado inicial de una
 * semilla (`packages/dominio/escenarios/semillas/`) y deja el resultado en finn_e2e, la base a la que está conectada
 * la app; el pool del servidor se reconecta solo. Importa el ejecutor al usarse: una prueba sin semilla no carga Prisma.
 */
export async function sembrar(estado: Escenario, hoy: string): Promise<void> {
  const { copiarEstadoA, ejecutorInt } =
    await import('../../../../packages/aplicacion/test/escenarios/int.ts');
  const s = await ejecutorInt.iniciar(estado, hoy);
  await copiarEstadoA(s, BASE_E2E);
  await ejecutorInt.terminar(s);
}

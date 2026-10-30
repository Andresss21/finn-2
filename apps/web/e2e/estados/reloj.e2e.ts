// PRU-E2E-RELOJ-001 y 003 (TA-219; 07 §4.1, CT-01, P7-10; portadas del prototipo de V7-04 y V7-07).
// El reloj del servidor se observa en /api/pruebas/reloj, que solo responde con el reloj de prueba permitido.
import { expect, test } from '../configuracion/prueba.ts';
import { relojDeLaBase } from '../../../../tools/pruebas/e2e/pila.ts';
import { alinearRelojes, fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';

const RUTA = '/api/pruebas/reloj';
const UN_MINUTO = 60_000;

test.describe('PRU-E2E-RELOJ', () => {
  test('PRU-E2E-RELOJ-001 [V7-04, V7-07] el servidor sigue el archivo en cada petición, sin reiniciar, y los tres relojes dicen lo mismo', async ({
    page,
    request,
  }) => {
    fijarRelojServidor('2027-02-20T19:00:00-06:00');
    expect(await (await request.get(RUTA)).json()).toMatchObject({ hoy: '2027-02-20' });
    fijarRelojServidor('2027-02-21T08:00:00-06:00');
    expect(await (await request.get(RUTA)).json()).toMatchObject({ hoy: '2027-02-21' });

    // DP-04: archivo del servidor, desfase de la base y page.clock con el mismo instante
    const instante = '2027-03-05T10:00:00-06:00';
    const esperado = Date.parse(instante);
    await alinearRelojes(page, instante);
    const servidor = (await (await request.get(RUTA)).json()) as {
      hoy: string;
      desfaseMs: number;
    };
    expect(servidor.hoy).toBe('2027-03-05');

    const base = relojDeLaBase(servidor);
    expect(base.hoy).toBe('2027-03-05');
    expect(Math.abs(Date.parse(base.ahora) - esperado)).toBeLessThan(UN_MINUTO);

    const navegador = await page.evaluate<number>('Date.now()');
    expect(Math.abs(navegador - esperado)).toBeLessThan(UN_MINUTO);
  });

  test('PRU-E2E-RELOJ-003 [V7-04] next start corre con NODE_ENV=production y aun así el reloj de prueba está activo', async ({
    request,
  }) => {
    fijarRelojServidor('2027-02-20T12:00:00-06:00');
    expect(await (await request.get(RUTA)).json()).toMatchObject({
      nodeEnv: 'production',
      hoy: '2027-02-20',
    });
  });
});

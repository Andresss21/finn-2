// PRU-REN-INICIO-001 (V6-05; 06 §3.9.1, CA-04.9; 07 §6.6): el tiempo de aplicar la plantilla completa (47 elementos, 4 tandas, con 400 ms por escritura) en el
// perfil 4G de 05 §13.1. Corre solo en el job `ren` del nocturno (FINN_REN=1). Superar el presupuesto no falla la prueba: la medida
// va a test-results/ren/web.json y tools/pruebas/volumen/registrar.ts abre el aviso. Lo que aquí falla es no poder medir.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { setTimeout as esperar } from 'node:timers/promises';
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { mediana } from '../../../../tools/pruebas/rendimiento/clasificar.ts';
import { fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import { plantilla as t } from '../../src/textos/plantilla.ts';

const WEB_JSON = '../../test-results/ren/web.json';
const PRESUPUESTO_MS = 20_000; // CA-04.9
const CORRIDAS = 3;
const ESCRITURA_MS = 400; // CA-04.9: cada escritura del servidor tarda 400 ms (peor caso de V6-05)
const RUTA = '/presupuesto/estructura/plantilla';
const HOY = '2027-02-05';

test.describe('PRU-REN-INICIO', () => {
  test.describe.configure({ timeout: 600_000 });

  test('PRU-REN-INICIO-001 [V6-05, CA-04.9] aplicar los 47 elementos de la plantilla con el perfil 4G de 05 §13.1 termina dentro de 20 s, mediana de 3', async ({
    page,
    context,
    baseURL,
  }) => {
    test.skip(
      process.env['FINN_REN'] !== '1',
      'Presupuesto de tiempo: corre en el job `ren` del nocturno (07 §6.6)',
    );
    await entrarAal2(context, baseURL ?? '');
    const duraciones: number[] = [];
    for (let i = 0; i < CORRIDAS; i += 1) {
      fijarRelojServidor(`${HOY}T10:00:00-06:00`);
      await sembrar(
        { id: 'SEM-REN', titulo: 'Base vacía', refs: [], hoy: HOY, estadoInicial: [], pasos: [] },
        HOY,
      );
      await page.goto(RUTA);
      await esperarContenido(page);
      const cdp = await context.newCDPSession(page);
      await cdp.send('Network.enable');
      await cdp.send('Network.emulateNetworkConditions', {
        offline: false,
        latency: 150,
        downloadThroughput: (1.6 * 1_000_000) / 8,
        uploadThroughput: (750 * 1_000) / 8,
      });
      await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
      // La latencia del servidor se suma desde el navegador: cada llamada espera 400 ms por cada elemento de su tanda, que es lo que
      // tardaría su `escribir()` en serie (CF-19). Es una simulación sobre el tiempo real del servidor, no un retardo dentro de él.
      await page.route(`**${RUTA}`, async (ruta) => {
        if (ruta.request().method() !== 'POST') return ruta.fallback();
        const cuerpo = JSON.parse(ruta.request().postData() ?? '[]') as [{ elementos: unknown[] }];
        const respuesta = await ruta.fetch();
        await esperar(ESCRITURA_MS * cuerpo[0].elementos.length);
        return ruta.fulfill({ response: respuesta });
      });
      const antes = await page.evaluate(() => performance.now());
      await page.getByRole('button', { name: t.crear(36), exact: true }).click();
      await expect(page.getByText(t.creadas(47), { exact: true })).toBeVisible({
        timeout: 120_000,
      });
      duraciones.push((await page.evaluate(() => performance.now())) - antes);
      await cdp.detach();
      await page.unroute(`**${RUTA}`);
    }
    mkdirSync('../../test-results/ren', { recursive: true });
    const previas = existsSync(WEB_JSON)
      ? (JSON.parse(readFileSync(WEB_JSON, 'utf8')) as unknown[])
      : [];
    const medida = {
      id: 'PRU-REN-INICIO-001',
      nombre: 'aplicar la plantilla de 47 elementos, mediana de 3',
      medianaMs: mediana(duraciones),
      presupuestoMs: PRESUPUESTO_MS,
    };
    writeFileSync(WEB_JSON, JSON.stringify([...previas, medida], null, 2) + '\n');
    expect(duraciones).toHaveLength(CORRIDAS);
  });
});

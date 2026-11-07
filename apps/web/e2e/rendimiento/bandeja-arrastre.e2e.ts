// FT-78, V6-07 y V6-08 (05 §13.1, §13.3; 07 §6.6): la librería de arrastre no está en lo que se descarga antes del evento `load` de
// `/bandeja`; llega como un trozo aparte después de hidratar y su peso queda dentro de lo medido en V6-07 (12.6 KB gzip la
// librería sola; con el panel de destinos, hasta 20 KB). El trozo se reconoce por el texto de la región en vivo de dnd-kit,
// que la minificación no cambia. Los pedidos se miran por eventos de la página: ningún tiempo fijo (07 §7.1).
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';

const DIA_20 = '2027-02-20';
const MARCA = 'DndDescribedBy';
const LIMITE_GZIP = 20 * 1024;
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Supermercado' },
  {
    op: 'OP-35',
    etiqueta: 'a',
    cuenta: 'T',
    monto: 35,
    comercio: 'Selectos',
    recibido: `${DIA_20}T15:00`,
    fecha: DIA_20,
  },
];

test.describe('PRU-REN-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-REN-BAND-001 [V6-07, V6-08, CA-78.12] la librería de arrastre no se descarga antes de «load» en /bandeja: llega como un trozo aparte después de hidratar y pesa menos de 20 KB gzip', async ({
    page,
  }) => {
    fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
    const semilla: Escenario = {
      id: 'SEM-BAND-78R',
      titulo: 'Semilla de FT-78, peso del arrastre',
      refs: [],
      hoy: DIA_20,
      estadoInicial: ESTADO,
      pasos: [],
    };
    await sembrar(semilla, DIA_20);

    let cargada = false;
    const trozos: { antesDeLoad: boolean; bytes: Promise<number>; cuerpo: Promise<string> }[] = [];
    page.on('load', () => {
      cargada = true;
    });
    page.on('response', (r) => {
      if (r.request().resourceType() !== 'script') return;
      trozos.push({
        antesDeLoad: !cargada,
        bytes: r
          .request()
          .sizes()
          .then((s) => s.responseBodySize),
        cuerpo: r.text().catch(() => ''),
      });
    });
    await page.goto('/bandeja', { waitUntil: 'load' });
    await esperarContenido(page);
    await expect(page.locator('[data-asa]')).toHaveCount(1); // llegó el trozo y el asa aparece

    const conLibreria = [];
    for (const t of trozos) if ((await t.cuerpo).includes(MARCA)) conLibreria.push(t);
    expect(conLibreria).toHaveLength(1);
    expect(conLibreria[0]?.antesDeLoad).toBe(false);
    expect(await conLibreria[0]?.bytes).toBeLessThanOrEqual(LIMITE_GZIP);
  });
});

// FT-35 Revisar y aprobar, trozo 2 (06 §2.5; 05 §4.15; 07 §17: una pantalla o un flujo es una E2E). Aprobar varias filas seguidas,
// un movimiento que se aprobó en otra pestaña y la categoría sugerida por regla o por historial. Cada prueba parte de una base
// sembrada con operaciones reales de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04). Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const sms = (etiqueta: string, comercio: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${DIA_20}T${recibido}`,
  fecha: DIA_20,
});
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Restaurantes' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: 'P1' },
];
// Una compra anterior en Super ya aprobada: los SMS siguientes de ese comercio traen la categoría sugerida (del historial)
const HISTORIAL: Op[] = [
  sms('anterior', 'Super', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA_20}T09:30` },
];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-35D',
    titulo: 'Semilla de FT-35, aprobar filas',
    refs: [],
    hoy: DIA_20,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

async function abrirBandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
}

const fila = (page: Page, monto: string) =>
  page.locator('[data-movimiento]').filter({ hasText: monto });
const aprobar = (page: Page, monto: string) =>
  fila(page, monto).getByRole('button', { name: /^Aprobar/ });

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-141 [CA-35.9] tres «Aprobar» seguidos con uno que se aprobó en otra pestaña: las otras dos filas se aprueban y la que falló no deja un resultado', async ({
    page,
    context,
  }) => {
    await preparar([
      ...HISTORIAL,
      sms('a', 'Super', 12, '15:00'),
      sms('b', 'Super', 13, '15:10'),
      sms('c', 'Super', 14, '15:20'),
    ]);
    await abrirBandeja(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(3);

    // En otra pestaña se aprueba la del medio mientras esta lista sigue abierta
    const otra = await context.newPage();
    await abrirBandeja(otra);
    await aprobar(otra, '$13.00').click();
    await expect(otra.getByTestId('resultado')).toContainText(t.aprobado('Super', '$13.00'));
    await otra.close();

    // Los tres toques seguidos, en el mismo instante: la revalidación del primero no los alcanza a quitar
    await page.evaluate(() => {
      document
        .querySelectorAll<HTMLButtonElement>('[data-movimiento] button[aria-label^="Aprobar"]')
        .forEach((b) => {
          b.click();
        });
    });

    await expect(page.getByTestId('resultado')).toHaveCount(2);
    for (const monto of ['$12.00', '$14.00'])
      await expect(
        page.getByTestId('resultado').filter({ hasText: t.aprobado('Super', monto, 'T', 'Super') }),
      ).toHaveCount(1);
    // La que falló no deja un resultado propio: la revalidación la quita (su mensaje lo cubre PRU-E2E-BAND-142)
    await expect(page.getByTestId('resultado').filter({ hasText: '$13.00' })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-142 [CA-35.10] un movimiento aprobado en otra pestaña muestra «Este movimiento ya está aprobado.» al tocar «Aprobar» y al revisar la lista desaparece', async ({
    page,
    context,
  }) => {
    await preparar([...HISTORIAL, sms('a', 'Super', 12, '15:00')]);
    await abrirBandeja(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(1);

    const otra = await context.newPage();
    await abrirBandeja(otra);
    await aprobar(otra, '$12.00').click();
    await expect(otra.getByTestId('resultado')).toBeVisible();
    await otra.close();

    await aprobar(page, '$12.00').click();
    await expect(page.getByText('Este movimiento ya está aprobado.')).toBeVisible();

    await abrirBandeja(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(0);
    await expect(page.getByText(t.alDia.texto)).toBeVisible();
  });

  test('PRU-E2E-BAND-143 [CA-35.11, CA-35.4] la regla que se recuerda al aprobar «PIZZA HUT» hace que el siguiente SMS muestre «(por regla)»; la sugerencia del historial no lo dice', async ({
    page,
  }) => {
    await preparar([
      ...HISTORIAL,
      sms('super', 'Super', 12, '14:00'),
      sms('pizza1', 'PIZZA HUT', 20, '15:00'),
      sms('pizza2', 'PIZZA HUT', 25, '16:00'),
    ]);
    await abrirBandeja(page);
    // Del historial: la sugerencia no dice «por regla»
    await expect(fila(page, '$12.00')).toContainText('→ Super');
    await expect(fila(page, '$12.00')).not.toContainText(cuentas.bandeja.porRegla);
    await expect(fila(page, '$25.00')).not.toContainText('→');

    // Se aprueba el primero recordando la categoría
    await fila(page, '$20.00').getByRole('link').click();
    await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
    await elegirOpcion(page, g.categoriaDeParte('1'), 'Restaurantes');
    await page.getByRole('checkbox', { name: t.revisar.recordar }).check();
    await page.getByRole('button', { name: t.revisar.aprobar }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();

    await abrirBandeja(page);
    await expect(fila(page, '$25.00')).toContainText(
      `→ Restaurantes (${cuentas.bandeja.porRegla})`,
    );
  });
});

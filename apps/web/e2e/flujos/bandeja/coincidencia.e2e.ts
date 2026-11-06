// FT-35 Revisar y aprobar, coincidencias (06 §2.5; 04 OP-40; 07 §17: una pantalla o un flujo es una E2E). El estado sale de
// operaciones reales de 01 §8 (DP-17): una programada de Netflix y el SMS que coincide con ella. Los números los pone el motor:
// la prueba abre el presupuesto y comprueba que los dibuja (PF-3). Los textos salen del catálogo (FE-51).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { elegirOpcion } from '../../ayudas/seleccion-nativa.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
// Ahorro con $500.00, la tarjeta T, Super con $50.00 en P1 y una programada de Netflix por $15.49 que vence el día 20
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];
const programada = (automatico: boolean): Op => ({
  op: 'OP-42',
  etiqueta: 'Netflix',
  cuenta: 'T',
  comercio: 'Netflix',
  monto: 15.49,
  categoria: 'Super',
  primeraFecha: DIA_20,
  ...(automatico ? { automatico: true as const } : {}),
});
const SMS: Op = {
  op: 'OP-35',
  etiqueta: 'sms',
  cuenta: 'T',
  monto: 15.49,
  comercio: 'Netflix',
  recibido: `${DIA_20}T19:00`,
  fecha: DIA_20,
};

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${DIA_20}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-35B',
    titulo: 'Semilla de FT-35, coincidencias',
    refs: [],
    hoy: DIA_20,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, DIA_20);
}

async function abrirElMovimiento(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
  await page.locator('[data-movimiento]').getByRole('link').click();
  await expect(page.getByRole('heading', { level: 1, name: t.revisar.titulo })).toBeVisible();
}

async function superDisponible(page: Page, centavos: number): Promise<void> {
  await page.goto('/presupuesto');
  await esperarContenido(page);
  await esperarMonto(
    page
      .locator('[data-fila-categoria]')
      .filter({ hasText: 'Super' })
      .locator('[data-centavos]')
      .first(),
    centavos,
  );
}

test.describe('PRU-E2E-BAND', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-130 [CA-35.5] «Confirmar» una coincidencia con una ocurrencia pendiente crea la transacción y la ocurrencia queda emparejada', async ({
    page,
  }) => {
    await preparar([...BASE, programada(false), SMS]);
    await abrirElMovimiento(page);
    await expect(page.getByText(t.revisar.coincidencia).first()).toBeVisible();

    // Netflix no tiene historial: la categoría se elige en el flujo y «Confirmar» la guarda antes (OP-36)
    await elegirOpcion(page, g.categoriaDeParte('1'), 'Super');
    await page.getByRole('button', { name: t.revisar.confirmarCoincidencia }).click();

    await expect(page.getByTestId('resultado')).toBeVisible();
    await expect(page.getByRole('link', { name: t.verTransaccion })).toHaveAttribute(
      'href',
      /^\/actividad\/[0-9a-f-]{36}$/,
    );
    // Se creó una sola transacción de $15.49 en Super: $50.00 − $15.49
    await superDisponible(page, 3451);
    await page.goto('/bandeja');
    await esperarContenido(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(0);
  });

  test('PRU-E2E-BAND-131 [CA-35.6, CA-42.6] «Confirmar» una coincidencia con una ocurrencia ya registrada por el registro automático no crea otra transacción', async ({
    page,
  }) => {
    await preparar([...BASE, programada(true), { op: 'OP-43', modo: 'automatico' }, SMS]);
    // El registro automático ya gastó $15.49 de Super
    await superDisponible(page, 3451);
    await abrirElMovimiento(page);
    await expect(page.getByText(t.revisar.coincidencia).first()).toBeVisible();

    await page.getByRole('button', { name: t.revisar.confirmarCoincidencia }).click();

    await expect(page.getByTestId('resultado')).toBeVisible();
    // Sigue habiendo una sola transacción: Super no baja otra vez
    await superDisponible(page, 3451);
    await page.goto('/bandeja');
    await esperarContenido(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(0);
  });
});

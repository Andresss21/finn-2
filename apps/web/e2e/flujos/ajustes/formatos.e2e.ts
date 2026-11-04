// FT-73 Formatos bancarios, 1 de 3 (06 FT-73; 05 §2.11; 07 §17: una pantalla es una E2E). Parte de una base sembrada con las
// operaciones reales de ESC-45 (DP-17), con el reloj del servidor fijo (DP-04), entra como la persona y recorre la lista de formatos
// contra el servidor real. El formulario y sus CA (CA-73.1 a CA-73.5) son de la parte 2; Instituciones, de la 3 (CH-125).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { ajustesFormatos as t } from '../../../src/textos/ajustes-formatos.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-18';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821' },
  { op: 'OP-07', categoria: 'Supermercado' },
];

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-73',
    titulo: 'Semilla de FT-73, formatos e instituciones',
    refs: [],
    hoy: HOY,
    estadoInicial: BASE,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
  await esperarHidratacion(page);
}

test.describe('PRU-E2E-AJUS', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-AJUS-124 [RUTA-/ajustes/formatos] desde Ajustes se llega a la lista, que muestra los formatos sembrados con su institución y sin usos, y enlaza a crear uno y a Instituciones', async ({
    page,
  }) => {
    await preparar();
    await abrir(page, '/ajustes');
    await page.getByRole('link', { name: t.enlace, exact: true }).click();
    await expect(page).toHaveURL(/\/ajustes\/formatos$/);
    const filas = page.locator('[data-formato]');
    await expect(filas).toHaveCount(3);
    await expect(filas.filter({ hasText: 'BAC · BAC compra' })).toContainText(t.sinUsos);
    await expect(filas.filter({ hasText: 'Banco Agrícola · Banco Agrícola compra' })).toBeVisible();
    await expect(page.getByRole('link', { name: t.nuevo, exact: true })).toHaveAttribute(
      'href',
      '/ajustes/formatos/nuevo',
    );
    await expect(page.getByRole('link', { name: t.instituciones, exact: true })).toHaveAttribute(
      'href',
      '/ajustes/instituciones',
    );
  });
});

// FT-19 Archivar categorías (06 FT-19; 05 §2.3; 07 §17: un flujo es una E2E). Cada
// prueba parte de una base sembrada con las operaciones reales de ESC-44 (01 §8, DP-17) y del reloj del servidor fijo (DP-04), y
// recorre el flujo como la persona. Los números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía
// (PF-3). Lo que completan otras fichas (DT-27) está en `pruebas/pendientes-e2e.json`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-03-05';
// ESC-44 paso 0: Gimnasio con $70.00 en P1, el débito de $30.00 del 2 de febrero, $30.00 en P3 (futuro) y una programada activa.
const ESC44_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 30,
    categoria: 'Gimnasio',
    fecha: '2027-02-02',
    hoy: '2027-02-02',
    etiqueta: 'gimnasio',
  },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
  {
    op: 'OP-42',
    etiqueta: 'gimnasio',
    cuenta: 'Ahorro',
    comercio: 'Gimnasio',
    monto: 30,
    categoria: 'Gimnasio',
    primeraFecha: '2027-03-10',
  },
];

async function sembrarOps(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CATEG-ARCHIVAR',
    titulo: 'Semilla de FT-19',
    refs: [],
    hoy: HOY,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();

test.describe('PRU-E2E-CATEG', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CATEG-107 [CA-19.1, ESC-44] archivar Gimnasio desde la estructura con su Disponible a Listo para asignar, las futuras devueltas y la programada desactivada deja Listo para asignar en $670.00 y a Gimnasio fuera de Presupuesto', async ({
    page,
  }) => {
    await sembrarOps(ESC44_PASO0);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 60000);
    await abrir(page, '/presupuesto/estructura');
    await page.getByRole('link', { name: 'Editar Gimnasio', exact: true }).click();
    await page.getByRole('link', { name: 'Archivar', exact: true }).click();

    await expect(page.getByRole('heading', { name: 'Archivar categoría', level: 1 })).toBeVisible();
    await expect(page.getByText('Tiene dinero asignado en 1 período futuro.')).toBeVisible();
    await page
      .getByRole('radiogroup', { name: /Programada Gimnasio/ })
      .getByRole('radio', { name: 'Desactivarla' })
      .click();
    await page.getByRole('button', { name: 'Archivar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Revisá el impacto' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);

    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 67000);
    await expect(fila(page, 'Gimnasio')).toHaveCount(0);
    await expect(page.locator('[data-seccion="archivadas-con-dinero"]')).toHaveCount(0);
  });
});

// FT-39 Reglas de comercio (06 FT-39; 05 §2; 07 §17: un flujo es una E2E). Cada prueba parte de una base sembrada con operaciones
// reales de 01 §8 (DP-17) y del reloj del servidor fijo (DP-04), y recorre `/reglas`, `/reglas/nueva` y `/reglas/[reglaId]` como
// la persona; el efecto se verifica donde se ve: la Bandeja o Registrar gasto. Los textos salen del catálogo (FE-51).
// Completa los pendientes de punta a punta CA-21.10, CA-34.10 y CA-35.11 (DT-27).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentas } from '../../../src/textos/cuentas.ts';
import { registrarGasto as g } from '../../../src/textos/registrar-gasto.ts';
import { reglas as r } from '../../../src/textos/reglas.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA = '2027-02-20';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-07', categoria: 'Restaurantes' },
  { op: 'OP-21', monto: 500 },
];
const sms = (etiqueta: string, comercio: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${DIA}T${recibido}`,
  fecha: DIA,
});
// Una compra anterior aprobada en Supermercado: los SMS de ese comercio traen la sugerencia del historial.
const compraAprobada = (etiqueta: string, comercio: string): Op[] => [
  sms(etiqueta, comercio, 30, '09:00'),
  { op: 'OP-37', etiqueta, categoria: 'Supermercado', aprobado: `${DIA}T09:30` },
];

async function preparar(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${DIA}T20:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REGLAS-39',
    titulo: 'Semilla de FT-39, reglas de comercio',
    refs: [],
    hoy: DIA,
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, DIA);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** El flujo de `/reglas/nueva` hasta enviar; no espera el resultado. */
async function escribirRegla(page: Page, patron: string, categoria: string): Promise<void> {
  await abrir(page, '/reglas/nueva');
  await esperarHidratacion(page);
  await page.getByLabel(r.patron).fill(patron);
  await page.getByLabel(r.categoria).selectOption({ label: categoria });
  await page.getByRole('button', { name: r.guardar }).click();
}

/** Crea la regla y espera a que el flujo vuelva a `/reglas`. */
async function crearRegla(page: Page, patron: string, categoria: string): Promise<void> {
  await escribirRegla(page, patron, categoria);
  await expect(page).toHaveURL(/\/reglas$/);
  await esperarContenido(page);
}

const fila = (page: Page, monto: string) =>
  page.locator('[data-movimiento]').filter({ hasText: monto });
const regla = (page: Page, patron: string) =>
  page.locator('[data-regla]').filter({ hasText: patron });

test.describe('PRU-E2E-BAND reglas de comercio', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-170 [CA-39.1] RUTA-/reglas/nueva con las reglas "SELECTOS → Supermercado" y "SUPER SELECTOS ESCALON → Restaurantes" creadas, el SMS de SUPER SELECTOS ESCALON sugiere Restaurantes (el patrón más largo)', async ({
    page,
  }) => {
    await preparar([sms('selectos', 'SUPER SELECTOS ESCALON', 12, '15:00')]);
    await crearRegla(page, 'SELECTOS', 'Supermercado');
    await crearRegla(page, 'SUPER SELECTOS ESCALON', 'Restaurantes');
    await abrir(page, '/bandeja');
    await expect(fila(page, '$12.00')).toContainText(
      `→ Restaurantes (${cuentas.bandeja.porRegla})`,
    );
  });

  test('PRU-E2E-BAND-171 [CA-39.2] RUTA-/reglas/nueva RUTA-/reglas crear "SELECTOS" cuando ya existe "selectos" se rechaza con «Ya hay una regla para SELECTOS.» y la lista sigue con una sola regla', async ({
    page,
  }) => {
    await preparar([]);
    await crearRegla(page, 'selectos', 'Supermercado');
    await escribirRegla(page, 'SELECTOS', 'Restaurantes');
    await expect(page.getByText('Ya hay una regla para SELECTOS.')).toBeVisible();
    await expect(page).toHaveURL(/\/reglas\/nueva$/);
    await abrir(page, '/reglas');
    await expect(page.locator('[data-regla]')).toHaveCount(1);
    await expect(regla(page, 'selectos')).toContainText(r.hacia('Supermercado'));
  });

  test('PRU-E2E-BAND-172 [CA-39.3] RUTA-/reglas una regla hacia una categoría que se archivó queda marcada «No se aplica» y el SMS de ese comercio vuelve a sugerir la categoría del historial', async ({
    page,
  }) => {
    await preparar([
      ...compraAprobada('antes', 'PIZZA HUT'),
      sms('pizza', 'PIZZA HUT', 20, '15:00'),
    ]);
    await crearRegla(page, 'PIZZA', 'Restaurantes');
    await abrir(page, '/bandeja');
    await expect(fila(page, '$20.00')).toContainText(
      `→ Restaurantes (${cuentas.bandeja.porRegla})`,
    );

    await abrir(page, '/presupuesto/estructura');
    await page.getByRole('link', { name: 'Editar Restaurantes', exact: true }).click();
    await page.getByRole('link', { name: 'Archivar', exact: true }).click();
    await page.getByRole('button', { name: 'Archivar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Revisá el impacto' })).toBeVisible();
    await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);

    await abrir(page, '/reglas');
    await expect(regla(page, 'PIZZA')).toContainText(r.noSeAplica);
    await abrir(page, '/bandeja');
    await expect(fila(page, '$20.00')).toContainText('→ Supermercado');
    await expect(fila(page, '$20.00')).not.toContainText(cuentas.bandeja.porRegla);
  });

  test('PRU-E2E-BAND-173 [CA-39.4] RUTA-/reglas/[reglaId] eliminar una regla desde su pantalla hace que el SMS de ese comercio sugiera la categoría del historial, y sin historial queda sin destino', async ({
    page,
  }) => {
    await preparar([
      ...compraAprobada('antes', 'PIZZA HUT'),
      sms('pizza', 'PIZZA HUT', 20, '15:00'),
      sms('otro', 'Cafe Luna', 8, '15:10'),
    ]);
    await crearRegla(page, 'PIZZA', 'Restaurantes');
    await crearRegla(page, 'CAFE LUNA', 'Restaurantes');
    await abrir(page, '/bandeja');
    await expect(fila(page, '$20.00')).toContainText(
      `→ Restaurantes (${cuentas.bandeja.porRegla})`,
    );
    await expect(fila(page, '$8.00')).toContainText(`→ Restaurantes (${cuentas.bandeja.porRegla})`);

    for (const patron of ['PIZZA', 'CAFE LUNA']) {
      await abrir(page, '/reglas');
      await regla(page, patron).getByRole('link').click();
      await esperarContenido(page);
      await esperarHidratacion(page);
      await page.getByRole('button', { name: r.eliminar }).click();
      await page.getByRole('button', { name: r.confirmarSi }).click();
      await expect(page).toHaveURL(/\/reglas$/);
    }
    await expect(page.locator('[data-regla]')).toHaveCount(0);
    await expect(page.getByText(r.vacioTitulo)).toBeVisible();
    await abrir(page, '/bandeja');
    await expect(fila(page, '$20.00')).toContainText('→ Supermercado');
    await expect(fila(page, '$20.00')).not.toContainText(cuentas.bandeja.porRegla);
    await expect(fila(page, '$8.00')).not.toContainText('→');
  });

  test('PRU-E2E-BAND-174 [CA-21.10] RUTA-/reglas/nueva con la regla "MERCADO → Supermercado" creada, escribir ese comercio en Registrar gasto sugiere Supermercado y un toque lo pone en la parte 1', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, '/registrar/gasto');
    await esperarHidratacion(page);
    await page.getByLabel(g.comercio).fill('Mercado Central');
    await expect(page.getByTestId('sugerencia')).toHaveCount(0);

    await crearRegla(page, 'MERCADO', 'Supermercado');
    await abrir(page, '/registrar/gasto');
    await esperarHidratacion(page);
    await page.getByLabel(g.comercio).fill('Mercado Central');
    await expect(page.getByTestId('sugerencia')).toContainText(g.sugerencia('Supermercado'));
    await page.getByRole('button', { name: g.usarSugerencia }).click();
    await expect(
      page.getByLabel(g.categoriaDeParte('1'), { exact: true }).locator('option:checked'),
    ).toHaveText('Supermercado');
  });

  test('PRU-E2E-BAND-175 [CA-34.10] RUTA-/reglas/nueva con la regla "SELECTOS → Supermercado" creada, el SMS de SUPER SELECTOS ESCALON aparece en la Bandeja con Supermercado propuesto por regla', async ({
    page,
  }) => {
    await preparar([sms('selectos', 'SUPER SELECTOS ESCALON', 12, '14:10')]);
    await abrir(page, '/bandeja');
    await expect(fila(page, '$12.00')).not.toContainText('→');

    await crearRegla(page, 'SELECTOS', 'Supermercado');
    await abrir(page, '/bandeja');
    await expect(page.locator('[data-movimiento]')).toHaveCount(1);
    await expect(fila(page, '$12.00')).toContainText('SUPER SELECTOS ESCALON');
    await expect(fila(page, '$12.00')).toContainText(
      `→ Supermercado (${cuentas.bandeja.porRegla})`,
    );
  });

  test('PRU-E2E-BAND-176 [CA-35.11] RUTA-/reglas/nueva con la regla "PIZZA HUT → Restaurantes" creada, la fila de PIZZA HUT dice «(por regla)» y la sugerida por el historial no lo dice', async ({
    page,
  }) => {
    await preparar([
      ...compraAprobada('antes', 'Super'),
      sms('super', 'Super', 12, '14:00'),
      sms('pizza', 'PIZZA HUT', 25, '16:00'),
    ]);
    await crearRegla(page, 'PIZZA HUT', 'Restaurantes');
    await abrir(page, '/bandeja');
    await expect(fila(page, '$25.00')).toContainText(
      `→ Restaurantes (${cuentas.bandeja.porRegla})`,
    );
    await expect(fila(page, '$12.00')).toContainText('→ Supermercado');
    await expect(fila(page, '$12.00')).not.toContainText(cuentas.bandeja.porRegla);
  });

  test('PRU-E2E-BAND-177 [FT-39] RUTA-/reglas RUTA-/reglas/[reglaId] sin reglas la lista lo explica; corregir la categoría de una regla desde su pantalla se ve en la lista, y la pantalla de la regla ofrece «Volver» al marco', async ({
    page,
  }) => {
    await preparar([]);
    await abrir(page, '/reglas');
    await expect(page.getByText(r.vacioTexto)).toBeVisible();
    await crearRegla(page, 'PIZZA', 'Supermercado');
    await expect(regla(page, 'PIZZA')).toContainText(r.hacia('Supermercado'));

    await regla(page, 'PIZZA').getByRole('link').click();
    await esperarContenido(page);
    await esperarHidratacion(page);
    await expect(page.getByRole('heading', { level: 1, name: r.tituloEditar })).toBeVisible();
    await expect(page.getByRole('link', { name: /^Volver/ })).toHaveCount(1);
    await page.getByLabel(r.categoria).selectOption({ label: 'Restaurantes' });
    await page.getByRole('button', { name: r.guardar }).click();
    await expect(page).toHaveURL(/\/reglas$/);
    await esperarContenido(page);
    await expect(regla(page, 'PIZZA')).toContainText(r.hacia('Restaurantes'));
  });
});

test.describe('PRU-E2E-AJUS buscador de reglas', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-AJUS-160 [FT-39] (CH-227) RUTA-/reglas con ?q=super quedan solo las reglas cuyo comercio o categoría coinciden, y sin coincidencias dice «Ninguna regla para {búsqueda}.» con «Quitar la búsqueda»', async ({
    page,
  }) => {
    await preparar([]);
    await crearRegla(page, 'SUPER', 'Supermercado');
    await crearRegla(page, 'PIZZA', 'Restaurantes');
    await expect(page.locator('[data-regla]')).toHaveCount(2);

    await abrir(page, '/reglas?q=super');
    await expect(page.locator('[data-regla]')).toHaveCount(1);
    await expect(regla(page, 'SUPER')).toContainText(r.hacia('Supermercado'));
    await expect(regla(page, 'PIZZA')).toHaveCount(0);

    await abrir(page, '/reglas?q=farmacia');
    await expect(page.locator('[data-regla]')).toHaveCount(0);
    await expect(page.getByText(r.ningunaPara('farmacia'))).toBeVisible();
    await page.getByRole('link', { name: r.quitarBusqueda }).click();
    await expect(page).toHaveURL(/\/reglas$/);
    await expect(page.locator('[data-regla]')).not.toHaveCount(0);
  });
});

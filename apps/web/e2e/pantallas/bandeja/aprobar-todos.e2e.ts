// CH-240 (entrega 4, E3-8, E3-9, E3-24, E6-6): «Aprobar todos», la Bandeja con muchos movimientos y los botones de las filas.
// Cada prueba parte de una base sembrada con operaciones reales y del reloj del servidor fijo (DP-04); los textos salen del
// catálogo (FE-51) y los números los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { bandeja as t } from '../../../src/textos/bandeja.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const DIA_20 = '2027-02-20';
const DIA_21 = '2027-02-21';
const sms = (
  etiqueta: string,
  comercio: string,
  monto: number,
  recibido: string,
  dia = DIA_20,
): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${dia}T${recibido}`,
  fecha: dia,
  hoy: dia,
});
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Farmacia' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Farmacia', monto: 300, periodo: 'P1' },
];
/** Un comercio con una compra aprobada antes en Farmacia: la siguiente trae esa categoría sugerida. */
const conHistorial = (comercio: string, i: number): Op[] => [
  sms(`h${i}`, comercio, 5 + i, `09:0${i}`),
  {
    op: 'OP-37',
    etiqueta: `h${i}`,
    categoria: 'Farmacia',
    aprobado: `${DIA_20}T09:3${i}`,
    hoy: DIA_20,
  },
];

async function preparar(estadoInicial: Op[], ahora: string): Promise<void> {
  fijarRelojServidor(`${ahora}-06:00`);
  const escenario: Escenario = {
    id: 'SEM-BAND-36',
    titulo: 'Semilla de FT-36 en la entrega 4',
    refs: [],
    hoy: ahora.slice(0, 10),
    estadoInicial: [...BASE, ...estadoInicial],
    pasos: [],
  };
  await sembrar(escenario, ahora.slice(0, 10));
}

async function abrir(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await esperarContenido(page);
  await esperarHidratacion(page);
}

test.describe('PRU-E2E-BAND aprobar todos y muchos movimientos', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-711 [CA-E6-8] con más SMS sembrados, «Aprobar todos (n)» aprueba los elegibles y la fila que no entra muestra su motivo desde antes', async ({
    page,
  }) => {
    await preparar(
      [
        ...conHistorial('Botica', 0),
        ...conHistorial('Droguería', 1),
        ...conHistorial('Bazar', 2),
        // Dos del día 21 (período abierto) entran en el lote; el del día 20 cae en un período cerrado y no entra
        sms('a', 'Botica', 9, '07:00', DIA_21),
        sms('b', 'Droguería', 14, '07:30', DIA_21),
        sms('c', 'Bazar', 21, '19:00'),
      ],
      `${DIA_21}T08:00:00`,
    );
    await abrir(page);
    const boton = page.getByRole('button', { name: t.aprobarTodos.boton(2) });
    await expect(boton).toBeVisible();
    // La fila que no entra conserva su estado y dice por qué, desde antes de tocar el botón
    const cerrada = page.locator('[data-movimiento]').filter({ hasText: 'Bazar' });
    await expect(cerrada.locator('[data-motivo-no-entra]')).toHaveText(
      t.aprobarTodos.noEntra(t.aprobarTodos.motivos['requiere_revision_individual'] ?? ''),
    );
    await boton.click();
    await expect(page.getByText(t.aprobarTodos.aprobaste(2))).toBeVisible();
    // Sin «Deshacer»: no hay operación inversa (05 §4.14)
    await expect(page.getByRole('button', { name: /Deshacer/ })).toHaveCount(0);
  });

  test('PRU-E2E-BAND-712 [CA-E6-18] con más de 8 movimientos se ven 8 y «Mostrar {k} más»; «Aprobar» de una fila mide 44 px y se llama «Aprobar {comercio} {monto}»', async ({
    page,
  }) => {
    const comercios = Array.from({ length: 10 }, (_, i) => `Tienda ${String.fromCharCode(65 + i)}`);
    await preparar(
      [
        ...comercios.flatMap((c, i) => conHistorial(c, i)),
        ...comercios.map((c, i) => sms(`n${i}`, c, 30 + i, `1${i}:00`)),
      ],
      `${DIA_20}T20:00:00`,
    );
    await abrir(page);
    await expect(page.locator('[data-movimiento]')).toHaveCount(8);
    // «Aprobar todos» cuenta todos los elegibles, también los que no se ven
    await expect(page.getByRole('button', { name: t.aprobarTodos.boton(10) })).toBeVisible();
    const aprobar = page.getByRole('button', { name: /^Aprobar Tienda [A-J] .*\d/ }).first();
    await expect(aprobar).toHaveAccessibleName(/^Aprobar Tienda A .*30\.00$/);
    const caja = await aprobar.boundingBox();
    expect(caja?.height).toBeGreaterThanOrEqual(44);
    await page.getByRole('button', { name: t.mostrarMas(2) }).click();
    await expect(page.locator('[data-movimiento]')).toHaveCount(10);
    await expect(page.getByRole('button', { name: /^Mostrar \d+ más$/ })).toHaveCount(0);
  });
});

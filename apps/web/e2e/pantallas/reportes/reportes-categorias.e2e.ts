// FT-60 Reportes base, segunda mitad (06 FT-60; 05 §2.10 y §7; 07 §17: una pantalla es una E2E): categorías con su dona, comercios,
// cumplimiento y el filtro de cuentas. Cada prueba parte de una base sembrada con las operaciones reales (DP-17) y del reloj del
// servidor fijo (DP-04), y abre `/reportes/[tipo]` como la persona. Los números los pone el motor: la prueba solo comprueba que la
// pantalla los dibuja (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-10';

async function sembrarOps(ops: Op[], hoy = HOY): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REP-2',
    titulo: 'Semilla de FT-60 (2 de 2)',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}
const filaDe = (page: Page, nombre: string) =>
  page.locator('[data-reporte] [data-fila]').filter({ hasText: nombre });

// Diez categorías con gastos de $100.00, $90.00 … $10.00 (la mayor primero).
const DIEZ: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-21', monto: 5000 },
  ...Array.from({ length: 10 }, (_, k): Op[] => {
    const categoria = `Cat ${String(k + 1).padStart(2, '0')}`;
    return [
      { op: 'OP-07', categoria },
      { op: 'OP-14', categoria, monto: 100, periodo: 'P1' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 100 - 10 * k, categoria },
    ];
  }).flat(),
];

test.describe('PRU-E2E-REP reportes por categoría y comercio', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-REP-140 [CA-60.5] con gastos en 10 categorías, categorias muestra una dona de 8 porciones más «Otras» que suma 10,000 puntos básicos y una tabla con las 10', async ({
    page,
  }) => {
    await sembrarOps(DIEZ);
    await abrir(page, '/reportes/categorias');
    const porciones = page.locator('[data-grafico="dona"] path');
    await expect(porciones).toHaveCount(9);
    await expect(page.locator('[data-leyenda="otras"]')).toContainText('Otras');
    const puntos = await porciones.evaluateAll((ps) =>
      ps.map((p) => Number(p.getAttribute('data-porcentaje'))),
    );
    expect(puntos.reduce((a, b) => a + b, 0)).toBe(10000);
    await expect(page.locator('[data-reporte] [data-fila]')).toHaveCount(10);
    await esperarMonto(
      filaDe(page, 'Cat 01').locator('[data-col="gastado"] [data-centavos]'),
      10000,
    );
  });

  test('PRU-E2E-REP-141 [CA-60.6] con compras en SUPER SELECTOS ESCALON y SUPER SELECTOS STA ELENA y la regla «SELECTOS», top-comercios las junta bajo SELECTOS con sus dos variantes y montos', async ({
    page,
  }) => {
    fijarRelojServidor(`${HOY}T20:00:00-06:00`);
    const { ejecutorInt, copiarEstadoA, idDeCategoria } =
      await import('../../../../../packages/aplicacion/test/escenarios/int.ts');
    const { confirmar } =
      await import('../../../../../packages/aplicacion/src/operaciones/marco.ts');
    const { OP41 } =
      await import('../../../../../packages/aplicacion/src/operaciones/bandeja/index.ts');
    const escenario: Escenario = {
      id: 'SEM-REP-2',
      titulo: 'Semilla de FT-60 (2 de 2)',
      refs: [],
      hoy: HOY,
      estadoInicial: [
        { op: 'OP-01', cuenta: 'Ahorro' },
        { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', ultimos4: '4821' },
        { op: 'OP-07', categoria: 'Supermercado' },
      ],
      pasos: [],
    };
    const s = await ejecutorInt.iniciar(escenario, HOY);
    const regla = await confirmar(
      OP41 as never,
      {
        accion: 'crear',
        id: 'c0ffee00-0000-4000-8000-000000000060',
        patron: 'SELECTOS',
        categoriaId: await idDeCategoria(s, 'Supermercado'),
      },
      {
        memoria: s.memoria,
        escribir: s.tx.escribir,
        leer: s.tx.leer,
        escribirTecnico: s.tx.escribirTecnico,
        opciones: () => ({ reloj: { hoy: HOY, desfaseMs: 0 } }),
      },
    );
    expect(regla.ok, JSON.stringify(regla)).toBe(true);
    const compra = (etiqueta: string, comercio: string, monto: number, hora: string): Op[] => [
      {
        op: 'OP-35',
        etiqueta,
        cuenta: 'Visa',
        monto,
        comercio,
        recibido: `${HOY}T${hora}`,
        fecha: HOY,
      },
      { op: 'OP-37', etiqueta, categoria: 'Supermercado', aprobado: `${HOY}T16:00` },
    ];
    await ejecutorInt.paso(s, {
      n: '1',
      ops: [
        ...compra('escalon', 'SUPER SELECTOS ESCALON', 12, '14:10'),
        ...compra('elena', 'SUPER SELECTOS STA ELENA', 8, '14:20'),
      ],
      espera: {},
    });
    await copiarEstadoA(s, 'finn_e2e');
    await ejecutorInt.terminar(s);
    await abrir(page, '/reportes/top-comercios');
    const grupo = page.locator('[data-comercio="SELECTOS"]');
    await expect(grupo).toHaveCount(1);
    await esperarMonto(grupo.locator('[data-monto-comercio] [data-centavos]'), 2000);
    const variantes = grupo.locator('[data-variante]');
    await expect(variantes).toHaveCount(2);
    await expect(variantes.nth(0)).toContainText(/escalon/i);
    await esperarMonto(variantes.nth(0).locator('[data-centavos]'), 1200);
    await expect(variantes.nth(1)).toContainText(/sta elena/i);
    await esperarMonto(variantes.nth(1).locator('[data-centavos]'), 800);
  });

  test('PRU-E2E-REP-142 [CA-60.7] con una categoría de Asignado $0.00 y Gastado $20.00, cumplimiento muestra su porcentaje nulo y la diferencia de −$20.00', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-21', monto: 100 },
      { op: 'OP-07', categoria: 'Sin plan' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Sin plan' },
    ]);
    await abrir(page, '/reportes/cumplimiento');
    const fila = filaDe(page, 'Sin plan');
    await expect(fila).toHaveCount(1);
    await esperarMonto(fila.locator('[data-col="asignado"] [data-centavos]'), 0);
    await esperarMonto(fila.locator('[data-col="gastado"] [data-centavos]'), 2000);
    await esperarMonto(fila.locator('[data-col="diferencia"] [data-centavos]'), -2000);
    await expect(fila.locator('[data-col="porcentaje"]')).toHaveText('—');
  });

  test('PRU-E2E-REP-143 [CA-60.9] con una categoría archivada con gastos en la ventana, categorias la muestra con su nombre', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-21', monto: 100 },
      { op: 'OP-07', categoria: 'Vieja' },
      { op: 'OP-14', categoria: 'Vieja', monto: 8, periodo: 'P1' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 8, categoria: 'Vieja' },
      { op: 'OP-09', categoria: 'Vieja', destino: 'LPA' },
    ]);
    await abrir(page, '/reportes/categorias');
    await expect(filaDe(page, 'Vieja')).toHaveCount(1);
    await expect(filaDe(page, 'Vieja')).toContainText('archivada');
  });

  test('PRU-E2E-REP-144 [CA-60.10] con ?cuentas=<Visa Oro>, categorias solo cuenta los consumos con efecto en Visa Oro', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta' },
      { op: 'OP-21', monto: 1000 },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-07', categoria: 'Ropa' },
      { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
      { op: 'OP-14', categoria: 'Ropa', monto: 100, periodo: 'P1' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 30, categoria: 'Super' },
      { op: 'OP-20', cuenta: 'Visa Oro', monto: 50, categoria: 'Ropa' },
    ]);
    await abrir(page, '/reportes/categorias');
    await expect(page.locator('[data-reporte] [data-fila]')).toHaveCount(2);
    await page.getByRole('link', { name: 'Visa Oro' }).click();
    await expect(page).toHaveURL(/cuentas=/);
    await esperarContenido(page);
    await expect(page.locator('[data-reporte] [data-fila]')).toHaveCount(1);
    await expect(filaDe(page, 'Ropa')).toHaveCount(1);
    await esperarMonto(filaDe(page, 'Ropa').locator('[data-col="gastado"] [data-centavos]'), 5000);
    await expect(filaDe(page, 'Super')).toHaveCount(0);
  });
});

// FT-53 Archivar, desarchivar y eliminar cuentas (06 FT-53; 05 §2.7, §4.14; 07 §17: un flujo es una E2E). Cada prueba parte de una
// base sembrada con las operaciones reales (DP-17) y del reloj del servidor fijo (DP-04), entra por Cuentas como la persona y
// recorre el flujo. Los números los pone el motor: la prueba solo comprueba que el flujo los dibuja y los envía (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { cuentasGestion } from '../../../src/textos/cuentas-gestion.ts';
import { cuentaDetalle } from '../../../src/textos/cuenta-detalle.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Locator, Page } from '@playwright/test';

const HOY = '2027-03-05';

async function sembrarOps(estadoInicial: Op[]): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CTA-ARCHIVAR',
    titulo: 'Semilla de FT-53 (archivar y eliminar)',
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

const lpa = (page: Page): Locator => page.locator('[data-resumen-lpa] [data-centavos]').first();
const boton = (page: Page, nombre: string): Locator =>
  page.getByRole('button', { name: nombre, exact: true });

/** Entra por Cuentas, abre el detalle de la cuenta `nombre` y toca la acción `accion`. */
async function abrirAccion(page: Page, nombre: string, accion: string): Promise<void> {
  await abrir(page, '/cuentas');
  // Las de efectivo son una tarjeta que enlaza; las tarjetas de crédito, un enlace «Ver detalle de …».
  await page
    .locator('[data-grupo="Efectivo"] a')
    .filter({ hasText: nombre })
    .or(page.getByRole('link', { name: `Ver detalle de ${nombre}`, exact: true }))
    .first()
    .click();
  await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
  await esperarContenido(page);
  await page.getByRole('link', { name: accion, exact: true }).click();
  await esperarContenido(page);
}

// ESC-43 paso 1: la tarjeta U con $200.00 de deuda, $150.00 asignados en un período cerrado y $50.00 en el actual.
const ESC43_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta', saldo: 200, apertura: '2027-01-25' },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Pago U', monto: 150, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Pago U', monto: 50 },
];

test.describe('PRU-E2E-CTA', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-CTA-175 [CA-53.1, ESC-43, AV-15] eliminar la tarjeta U muestra primero que Listo para asignar cambia +$200.00 y que se elimina Pago U, y al confirmar queda en $1,000.00', async ({
    page,
  }) => {
    await sembrarOps(ESC43_PASO1);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 80000);

    await abrirAccion(page, 'U', cuentaDetalle.acciones.eliminar);
    await expect(page).toHaveURL(/\/eliminar$/);
    await boton(page, cuentasGestion.eliminar.verCambios).click();
    await expect(page.getByRole('heading', { name: cuentasGestion.comunes.revisar })).toBeVisible();
    await expect(page.getByText('cambia +$200.00.')).toBeVisible();
    await expect(page.getByText(cuentasGestion.eliminar.categoriaDePago('U'))).toBeVisible();
    await boton(page, cuentasGestion.eliminar.eliminar).click();
    await expect(page).toHaveURL(/\/cuentas$/);

    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
  });

  test('PRU-E2E-CTA-176 [CA-53.2] archivar una tarjeta con deuda de $50.00 explica el bloqueo en texto y no ofrece archivar', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 50 },
    ]);
    await abrirAccion(page, 'Visa', cuentaDetalle.acciones.archivar);
    await expect(page).toHaveURL(/\/archivar$/);
    await expect(page.getByText('Visa todavía tiene una deuda de $50.00.')).toBeVisible();
    await expect(boton(page, cuentasGestion.archivar.archivar)).toHaveCount(0);
  });

  test('PRU-E2E-CTA-177 [CA-53.3] archivar la tarjeta T devolviendo los $30.00 futuros la saca de Cuentas y sube Listo para asignar de $970.00 a $1,000.00', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
      { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
      { op: 'OP-14', categoria: 'Pago T', monto: 30, periodo: 'P3' },
    ]);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 97000);

    await abrirAccion(page, 'T', cuentaDetalle.acciones.archivar);
    await expect(page.getByText(cuentasGestion.archivar.futuras)).toBeVisible();
    await boton(page, cuentasGestion.archivar.archivar).click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);

    await abrir(page, '/cuentas');
    await expect(page.getByRole('link', { name: 'Ver detalle de T', exact: true })).toHaveCount(0);
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 100000);
  });

  test('PRU-E2E-CTA-178 [CA-53.4] eliminar una cuenta con una transacción se rechaza con su motivo en texto y ofrece archivarla en lugar de eliminarla', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro', saldo: 500, apertura: '2027-02-01' },
      { op: 'OP-07', categoria: 'Super' },
      {
        op: 'OP-20',
        cuenta: 'Ahorro',
        monto: 10,
        categoria: 'Super',
        fecha: '2027-02-10',
        hoy: '2027-02-10',
      },
    ]);
    await abrirAccion(page, 'Ahorro', cuentaDetalle.acciones.eliminar);
    await expect(page).toHaveURL(/\/eliminar$/);
    await expect(
      page.getByText(cuentasGestion.eliminar.bloqueos.cuenta_con_movimientos('Ahorro')),
    ).toBeVisible();
    await expect(boton(page, cuentasGestion.eliminar.verCambios)).toHaveCount(0);
    await page.getByRole('link', { name: cuentasGestion.eliminar.archivarEnLugar }).click();
    await expect(page).toHaveURL(/\/archivar$/);
  });

  test('PRU-E2E-CTA-179 [CA-53.7] archivo una cuenta sin saldo, la desarchivo con un toque y «Archivar de nuevo» la deja archivada otra vez', async ({
    page,
  }) => {
    await sembrarOps([
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Vieja' },
    ]);
    await abrirAccion(page, 'Vieja', cuentaDetalle.acciones.archivar);
    await boton(page, cuentasGestion.archivar.archivar).click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
    await esperarContenido(page);

    await boton(page, cuentaDetalle.desarchivar).click();
    await expect(page.getByText(cuentaDetalle.desarchivada)).toBeVisible();
    await boton(page, cuentaDetalle.archivarDeNuevo).click();
    await expect(page.getByText(cuentaDetalle.archivadaDeNuevo)).toBeVisible();
    await expect(page.getByText(cuentaDetalle.soloLectura)).toBeVisible();
  });
});

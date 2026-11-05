// EntradaFecha con calendario (P1-03 del export; 07 §17: un flujo es una E2E), recorrida en `/registrar/gasto`, donde la fecha va en dos
// columnas con el Total. El «hoy» sale del reloj del servidor fijo (DP-04) y llega por la prop `hoy` del formulario: la prueba no usa el del navegador.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { registrarGasto as t } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-10';
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
];

async function abrirGasto(page: Page): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-ENTRADA-FECHA',
    titulo: 'Semilla de EntradaFecha',
    refs: [],
    hoy: HOY,
    estadoInicial: ESTADO,
    pasos: [],
  };
  await sembrar(escenario, HOY);
  await page.goto('/registrar/gasto');
  await esperarHidratacion(page);
}

const fecha = (page: Page) => page.getByLabel(t.fecha, { exact: true });
const botonCalendario = (page: Page) =>
  page.getByRole('button', { name: 'Elegir en el calendario' });
const calendario = (page: Page) => page.getByRole('dialog', { name: 'Calendario' });

test.describe('PRU-E2E-TX', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-480 [FT-21] la fecha empieza en hoy como dd/mm/aaaa, el botón mide al menos 44 px y abre el calendario en el mes de hoy con el día marcado', async ({
    page,
  }) => {
    await abrirGasto(page);
    await expect(fecha(page)).toHaveValue('10/02/2027');
    const abrir = await botonCalendario(page).boundingBox();
    expect(abrir?.width).toBeGreaterThanOrEqual(44);
    expect(abrir?.height).toBeGreaterThanOrEqual(44);
    await expect(calendario(page)).toHaveCount(0);
    await botonCalendario(page).click();
    await expect(botonCalendario(page)).toHaveAttribute('aria-expanded', 'true');
    await expect(calendario(page)).toContainText('febrero 2027');
    await expect(
      calendario(page).getByRole('button', { name: '10 de febrero, hoy', exact: true }),
    ).toHaveAttribute('aria-current', 'date');
    await expect(
      calendario(page).getByRole('button', { name: '10 de febrero, hoy', exact: true }),
    ).toBeFocused();
    await expect(calendario(page).getByRole('grid')).toBeVisible();
  });

  test('PRU-E2E-TX-481 [FT-21] elegir un día con el puntero lo pone en el campo en dd/mm/aaaa y cierra el calendario', async ({
    page,
  }) => {
    await abrirGasto(page);
    await botonCalendario(page).click();
    await calendario(page).getByRole('button', { name: '3 de febrero', exact: true }).click();
    await expect(fecha(page)).toHaveValue('03/02/2027');
    await expect(calendario(page)).toHaveCount(0);
    await expect(botonCalendario(page)).toBeFocused();
    await fecha(page).fill('');
    await fecha(page).pressSequentially('25012027');
    await expect(fecha(page)).toHaveValue('25/01/2027');
    await botonCalendario(page).click();
    await expect(calendario(page)).toContainText('enero 2027');
    await expect(
      calendario(page).getByRole('button', { name: '25 de enero', exact: true }),
    ).toHaveAttribute('aria-pressed', 'true');
  });

  test('PRU-E2E-TX-482 [FT-21] con el teclado se abre, se recorre con flechas, Inicio, Fin y RePág, se elige con Enter y Esc cierra devolviendo el foco', async ({
    page,
  }) => {
    await abrirGasto(page);
    await botonCalendario(page).focus();
    await page.keyboard.press('Enter');
    await expect(
      calendario(page).getByRole('button', { name: '10 de febrero, hoy', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('ArrowLeft');
    await expect(
      calendario(page).getByRole('button', { name: '9 de febrero', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Home');
    await expect(
      calendario(page).getByRole('button', { name: '8 de febrero', exact: true }),
    ).toBeFocused(); // lunes
    await page.keyboard.press('End');
    await expect(
      calendario(page).getByRole('button', { name: '14 de febrero', exact: true }),
    ).toBeFocused(); // domingo
    await page.keyboard.press('ArrowDown');
    await expect(
      calendario(page).getByRole('button', { name: '21 de febrero', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('PageUp');
    await expect(calendario(page)).toContainText('enero 2027');
    await expect(
      calendario(page).getByRole('button', { name: '21 de enero', exact: true }),
    ).toBeFocused();
    await page.keyboard.press('Enter');
    await expect(fecha(page)).toHaveValue('21/01/2027');
    await expect(calendario(page)).toHaveCount(0);
    await page.keyboard.press('Enter');
    await expect(calendario(page)).toHaveCount(1);
    await page.keyboard.press('ArrowRight');
    await page.keyboard.press('Escape');
    await expect(calendario(page)).toHaveCount(0);
    await expect(botonCalendario(page)).toBeFocused();
    await expect(fecha(page)).toHaveValue('21/01/2027');
  });

  test('PRU-E2E-TX-483 [FT-21] las flechas de mes cambian el mes y cada día mide al menos 44 px sin salirse de la pantalla', async ({
    page,
  }) => {
    await abrirGasto(page);
    await botonCalendario(page).click();
    await calendario(page).getByRole('button', { name: 'Mes siguiente' }).click();
    await expect(calendario(page)).toContainText('marzo 2027');
    await calendario(page).getByRole('button', { name: 'Mes anterior' }).click();
    await calendario(page).getByRole('button', { name: 'Mes anterior' }).click();
    await expect(calendario(page)).toContainText('enero 2027');
    for (const b of await calendario(page).getByRole('gridcell').getByRole('button').all()) {
      const caja = await b.boundingBox();
      expect(caja?.width).toBeGreaterThanOrEqual(44);
      expect(caja?.height).toBeGreaterThanOrEqual(44);
    }
    const dialogo = await calendario(page).boundingBox();
    const ancho = page.viewportSize()?.width ?? 0;
    expect(dialogo?.x ?? -1).toBeGreaterThanOrEqual(0);
    expect((dialogo?.x ?? 0) + (dialogo?.width ?? 0)).toBeLessThanOrEqual(ancho);
  });

  test('PRU-E2E-TX-484 [CA-21.7] escribir una fecha que no existe avisa con el texto del diseño y escribir una válida lo quita', async ({
    page,
  }) => {
    await abrirGasto(page);
    await fecha(page).fill('');
    await fecha(page).pressSequentially('31022027');
    await expect(page.getByText('Esa fecha no existe. Escribila como dd/mm/aaaa.')).toBeVisible();
    await expect(fecha(page)).toHaveAttribute('aria-invalid', 'true');
    await fecha(page).fill('');
    await fecha(page).pressSequentially('28022027');
    await expect(page.getByText('Esa fecha no existe. Escribila como dd/mm/aaaa.')).toHaveCount(0);
    await expect(fecha(page)).toHaveValue('28/02/2027');
  });
});

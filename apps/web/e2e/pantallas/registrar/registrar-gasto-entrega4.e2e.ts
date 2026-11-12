// CH-240 (entrega 4, E3-17 a E3-19, E4-2, E6-21): Registrar gasto con su resultado «Repartido en», el borrador recuperado y la fecha.
// Cada prueba parte de una base sembrada con operaciones reales y del reloj del servidor fijo (DP-04); los campos se buscan por su
// etiqueta del catálogo (FE-51) y los números los pone el motor (PF-3).
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarHidratacion } from '../../ayudas/esperas.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import { formularios } from '../../../src/textos/formularios.ts';
import { registrarGasto as t } from '../../../src/textos/registrar-gasto.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-02-10';
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Mascota', monto: 20, periodo: 'P1' },
];

async function preparar(): Promise<void> {
  fijarRelojServidor(`${HOY}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-REG-GASTO-E4',
    titulo: 'Semilla de FT-21 en la entrega 4',
    refs: [],
    hoy: HOY,
    estadoInicial: BASE,
    pasos: [],
  };
  await sembrar(escenario, HOY);
}

const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const elegir = async (page: Page, etiqueta: string, nombre: string): Promise<void> => {
  const control = campo(page, etiqueta);
  // React pone el valor del estado al hidratar el control: un cambio hecho antes se perdería
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
};
const guardar = (page: Page) => page.getByRole('button', { name: /^Guardar/ });

test.describe('PRU-E2E-TX registrar gasto de la entrega 4', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-TX-701 [CA-E4-21d] guardar el gasto de PRICESMART en tres líneas (dos categorías y Carlos) deja el resultado con «Repartido en» y un enlace a cada categoría y a Por cobrar', async ({
    page,
  }) => {
    await preparar();
    await page.goto('/registrar/gasto');
    await esperarHidratacion(page);
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('150');
    await campo(page, t.comercio).fill('PRICESMART');
    await campo(page, t.montoDeParte('1')).fill('100');
    await elegir(page, t.categoriaDeParte('1'), 'Super');
    await page.getByRole('button', { name: t.agregarLinea }).click();
    await campo(page, t.montoDeParte('2')).fill('20');
    await elegir(page, t.categoriaDeParte('2'), 'Mascota');
    await page.getByRole('button', { name: t.agregarLinea }).click();
    await campo(page, t.montoDeParte('3')).fill('30');
    await elegir(page, t.categoriaDeParte('3'), t.porCobrarA(t.otraPersona));
    // «Otra persona» abre debajo de la línea el nombre, con la nota de que se agrega a Por cobrar (E3-19)
    await expect(page.getByText(t.deudorNuevoNota)).toBeVisible();
    await campo(page, t.deudorNuevoDeParte('3')).fill('Carlos');
    await guardar(page).click();

    await expect(page.getByRole('heading', { name: t.listo })).toBeVisible();
    await expect(page.getByTestId('resultado')).toContainText(
      t.guardado('PRICESMART', '$150.00', 'T', '3'),
    );
    await expect(page.getByRole('link', { name: t.verTransaccion })).toBeVisible();
    const reparto = page.getByRole('region', { name: t.repartidoEn });
    await expect(reparto.getByRole('link', { name: t.verLaCategoria })).toHaveCount(2);
    await expect(reparto.getByRole('link', { name: t.verEnPorCobrar })).toHaveCount(1);
    await expect(reparto).toContainText('Super');
    await expect(reparto).toContainText('Mascota');
    await expect(reparto).toContainText(t.teDebe('Carlos'));
    await expect(reparto).toContainText('$30.00');
    await expect(page.getByText(t.repartidoEn)).toBeVisible();
  });

  test('PRU-E2E-TX-702 [CH-240] salir sin guardar y volver muestra «Recuperamos lo que estabas escribiendo» con «Descartar borrador» de 44 px, y descartarlo limpia el formulario', async ({
    page,
  }) => {
    await preparar();
    await page.goto('/registrar/gasto');
    await esperarHidratacion(page);
    await elegir(page, t.cuenta, 'T');
    await campo(page, t.total).fill('150');
    await campo(page, t.comercio).fill('PriceSmart');
    // el borrador se escribe 500 ms después del último cambio
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.entries<string>(sessionStorage as unknown as Record<string, string>).some(
            ([k, v]) => k.startsWith('finn:borrador:') && v.includes('PriceSmart'),
          ),
        ),
      )
      .toBe(true);
    await page.reload();
    await esperarHidratacion(page);
    await expect(page.getByText(formularios.borradorRecuperado)).toBeVisible();
    await expect(page.getByText(formularios.borradorCuerpo)).toBeVisible();
    const descartar = page.getByRole('button', { name: formularios.descartarBorrador });
    const caja = await descartar.boundingBox();
    expect(caja?.height).toBeGreaterThanOrEqual(44);
    await descartar.click();
    await expect(campo(page, t.total)).toHaveValue('');
    await expect(page.getByText(formularios.borradorRecuperado)).toHaveCount(0);
  });
});

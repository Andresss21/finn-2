// FT-16 Sobregiros y cierre automático del período (06 FT-16; 01 §7.3; 07 §17: una pantalla es una E2E). El cierre no es una
// operación: el período siguiente empieza solo cuando el reloj del servidor pasa al 21 (04 §13.1.4). Cada prueba siembra un
// escenario de 01 §8 con las operaciones reales (DP-17) en el día que dice su paso, abre `/presupuesto` antes del cierre,
// avanza el reloj del servidor sin ninguna operación y vuelve a abrirla. Los números los pone el motor: la prueba solo
// comprueba que la pantalla los dibuja (PF-3). El push de cierre (CA-16.5) lo prueba la integración (PRU-INT-PRES-300) y las
// propiedades (CA-16.7), el dominio (PRU-PROP-PRES-300).
import { test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const RUTA = '/presupuesto';
const CIERRE = '2027-02-21';

const BASE_T: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
];
// ESC-05 hasta el paso 2 (hoy 15 feb).
const ESC05: Op[] = [
  ...BASE_T,
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super', fecha: '2027-02-10' },
];
// ESC-15 hasta el paso 2 (hoy 10 feb).
const ESC15: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
];
// ESC-17 hasta el paso 2 (hoy 12 feb; las compras son del 10 feb).
const ESC17: Op[] = [
  ...BASE_T,
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 60,
    categoria: 'Super',
    etiqueta: 'D60',
    fecha: '2027-02-10',
    registrado: '2027-02-10T10:00',
  },
  {
    op: 'OP-20',
    cuenta: 'T',
    monto: 70,
    categoria: 'Super',
    etiqueta: 'T70',
    fecha: '2027-02-10',
    registrado: '2027-02-10T12:00',
  },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 20,
    categoria: 'Super',
    etiqueta: 'D20',
    fecha: '2027-02-10',
  },
];
// ESC-10 hasta el paso 3 (hoy 15 feb): el pago excedente de T.
const ESC10: Op[] = [
  ...BASE_T,
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 200 },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super' },
  { op: 'OP-20', cuenta: 'T', monto: 50, categoria: 'Salidas' },
  { op: 'OP-23', tarjeta: 'T', monto: 150 },
];
// ESC-49 hasta el paso 2: el día de cada operación (10 y 15 feb); el paso 3 es el 25 feb.
const ESC49: Op[] = [
  ...BASE_T,
  { op: 'OP-21', monto: 1500, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 400, periodo: 'P1', hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P2', hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P3', hoy: '2027-02-10' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 450, categoria: 'Super', hoy: '2027-02-15' },
];

/** Siembra las operaciones en `hoy` y deja el reloj del servidor en ese día. */
async function sembrarOps(ops: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-CIERRE-PERIODO',
    titulo: 'Semilla de FT-16',
    refs: [],
    hoy,
    estadoInicial: ops,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

/** El reloj avanza y nada más: ninguna operación (01 §7.3). */
const avanzarA = (dia: string): void => {
  fijarRelojServidor(`${dia}T10:00:00-06:00`);
};

async function abrir(page: Page, ruta = RUTA): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ hasText: nombre });
/** El primer monto de una fila de categoría es su Disponible (05 §10.8). */
const disponible = (page: Page, nombre: string) =>
  fila(page, nombre).locator('[data-centavos]').first();
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
/** El primer monto de la fila de pago de la tarjeta es «Te falta reservar» (05 §10.8). */
const faltaReservar = (page: Page) =>
  page.locator('[data-fila-pago]').first().locator('[data-centavos]').first();

test.describe('PRU-E2E-PRES cierre automático del período', () => {
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-300 [CA-16.1, ESC-05] con el paso 2 de ESC-05, al llegar el 21 de febrero sin ninguna operación Super queda en $0.00, Listo para asignar sigue en $700.00 y «Te falta reservar» de T sigue en $100.00', async ({
    page,
  }) => {
    await sembrarOps(ESC05, '2027-02-15');
    await abrir(page);
    await esperarMonto(disponible(page, 'Super'), -10000);
    await esperarMonto(lpa(page), 70000);
    await esperarMonto(faltaReservar(page), 10000);

    avanzarA(CIERRE);
    await abrir(page);
    await esperarMonto(disponible(page, 'Super'), 0);
    await esperarMonto(lpa(page), 70000);
    await esperarMonto(faltaReservar(page), 10000);
  });

  test('PRU-E2E-PRES-301 [CA-16.2, ESC-15] con el paso 2 de ESC-15, al llegar el cierre Listo para asignar baja de $400.00 a $350.00', async ({
    page,
  }) => {
    await sembrarOps(ESC15, '2027-02-10');
    await abrir(page);
    await esperarMonto(lpa(page), 40000);

    avanzarA(CIERRE);
    await abrir(page);
    await esperarMonto(lpa(page), 35000);
  });

  test('PRU-E2E-PRES-302 [CA-16.3, ESC-17] con el paso 2 de ESC-17, al llegar el cierre Listo para asignar baja $20.00 (solo la parte de débito) y «Te falta reservar» de T no cambia', async ({
    page,
  }) => {
    await sembrarOps(ESC17, '2027-02-12');
    await abrir(page);
    await esperarMonto(lpa(page), 40000);
    await esperarMonto(faltaReservar(page), 3000);

    avanzarA(CIERRE);
    await abrir(page);
    await esperarMonto(lpa(page), 38000);
    await esperarMonto(faltaReservar(page), 3000);
  });

  test('PRU-E2E-PRES-303 [CA-16.4, ESC-10] con el paso 3 de ESC-10, al llegar el cierre Listo para asignar baja de $100.00 a $50.00 por el pago excedente', async ({
    page,
  }) => {
    await sembrarOps(ESC10, '2027-02-15');
    await abrir(page);
    await esperarMonto(lpa(page), 10000);

    avanzarA(CIERRE);
    await abrir(page);
    await esperarMonto(lpa(page), 5000);
  });

  test('PRU-E2E-PRES-304 [CA-16.6, ESC-49] con el paso 2 de ESC-49, al cerrar P1 Listo para asignar queda en $450.00 y Super en P2 en $300.00', async ({
    page,
  }) => {
    await sembrarOps(ESC49, '2027-02-15');
    await abrir(page);
    await esperarMonto(lpa(page), 50000);
    await esperarMonto(disponible(page, 'Super'), -5000);

    avanzarA('2027-02-25');
    await abrir(page);
    await esperarMonto(lpa(page), 45000);
    await esperarMonto(disponible(page, 'Super'), 30000);
  });
});

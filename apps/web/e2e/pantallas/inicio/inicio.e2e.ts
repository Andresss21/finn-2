// FT-08 Inicio, primera parte (06 FT-08; 05 §2.3; 07 §17: una pantalla es una E2E). Cada prueba parte de una base sembrada con las
// operaciones reales de un escenario de 01 §8 (DP-17), con el reloj del servidor fijo (DP-04), y abre `/` como la persona. Los
// números los pone el motor: la prueba solo comprueba que la pantalla los dibuja (PF-3). Los Primeros pasos son de `primer-uso`.
import { expect, test, sembrar } from '../../configuracion/semilla.ts';
import { entrarAal2 } from '../../ayudas/sesion.ts';
import { esperarContenido } from '../../ayudas/esperas.ts';
import { esperarMonto } from '../../ayudas/montos.ts';
import { fijarRelojServidor } from '../../../../../tools/pruebas/e2e/reloj.ts';
import type { Op } from '../../../../../packages/dominio/escenarios/tipos.ts';
import { inicio as t } from '../../../src/textos/inicio.ts';
import { listoParaAsignar } from '../../../src/textos/listo-para-asignar.ts';
import type { Page } from '@playwright/test';

// Las operaciones de 01 §8 hasta el paso que dice cada una (DP-17), como las que escribe `listo-para-asignar.e2e.ts`.
// ESC-01 hasta el paso 4.
const ESC01: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 },
  { op: 'OP-14', categoria: 'Pago T', monto: 300, periodo: 'P1' },
  {
    op: 'OP-01',
    cuenta: 'Préstamo',
    tipo: 'prestamo',
    saldo: 5000,
    prestamo: {
      contraparte: 'Banco',
      montoOriginal: 6000,
      cuota: 100,
      plazoCuotas: 60,
      cuotasPagadas: 10,
    },
  },
];
// ESC-05 hasta el paso 2: Super sobregirada con tarjeta.
const ESC05: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super', fecha: '2027-02-10' },
];
// ESC-15 hasta el paso 2: Salidas sobregirada con débito.
const ESC15: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
];
// ESC-20 hasta el paso 2: Listo para asignar $675.00 y $25.00 en camino.
const ESC20: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    etiqueta: 'compartida',
    lineas: [
      { categoria: 'Super', monto: 25 },
      { deudor: 'Ana', monto: 25 },
    ],
  },
];
// ESC-31 hasta el paso 1: el paso 0 es el historial (cada operación con su día) y el 1, la transacción olvidada.
const ESC31: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Salidas', hoy: '2027-02-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 200, categoria: 'Super', hoy: '2027-02-04' },
  { op: 'OP-14', categoria: 'Salidas', monto: 50, periodo: 'P2', hoy: '2027-02-21' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 50, categoria: 'Salidas', hoy: '2027-03-01' },
  { op: 'OP-14', categoria: 'Salidas', monto: 60, periodo: 'P3', hoy: '2027-03-21' },
  {
    op: 'OP-20',
    cuenta: 'Ahorro',
    monto: 50,
    categoria: 'Salidas',
    fecha: '2027-02-10',
    etiqueta: 'olvidado',
  },
];

// ESC-13 hasta el paso 4 (reserva excedente de $30.00): cada operación con su día; el paso 3 pasa a P2 el 21 feb.
const ESC13: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 100, periodo: 'P1', hoy: '2027-02-10' },
  { op: 'OP-20', cuenta: 'T', monto: 100, categoria: 'Super', hoy: '2027-02-10' },
  { op: 'OP-23', tarjeta: 'T', monto: 130, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 30, periodo: 'P2', hoy: '2027-02-21' },
  { op: 'OP-20', cuenta: 'T', monto: 30, categoria: 'Super', hoy: '2027-02-21' },
];
// ESC-44 hasta el paso 2 (Gimnasio archivada con Disponible $25.00).
const ESC44: Op[] = [
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
  {
    op: 'OP-09',
    categoria: 'Gimnasio',
    destino: 'LPA',
    devolverFuturas: true,
    desactivar: ['gimnasio'],
  },
  { op: 'OP-33', compra: 'gimnasio', monto: 25 },
];
// Nada necesita atención: todo está asignado y no hay pagos, sobregiros ni Bandeja.
const AL_DIA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 1000, periodo: 'P1' },
];
const RENTA = {
  op: 'OP-42',
  etiqueta: 'Renta',
  cuenta: 'Ahorro',
  comercio: 'Renta',
  monto: 50,
  categoria: 'Super',
} as const;
// ESC-03 hasta el paso 3 (hoy 5 feb): ingreso de $1,000.00, Super $600.00 en P1 y Salidas $300.00 en P2; Mascota tiene su meta.
const ESC03: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-07', categoria: 'Mascota' },
  { op: 'OP-18', categoria: 'Mascota', monto: 50 },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 600, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 300, periodo: 'P2' },
];

/**
 * Lo que el marco registra al producir AV-01 (BE-38). Esta prueba de Inicio parte del estado del paso 0 de ESC-31 y siembra la
 * notificación con la cifra del paso 1; el recorrido que la produce de verdad (registrar el débito olvidado) es de FT-27.
 */
const CAMBIO_RETROACTIVO = {
  aviso: 'AV-01',
  motivo: 'cambio_retroactivo',
  titulo: 'Cambiaste el pasado',
  cuerpo: 'Δ LPA −$30.00, Δ Salidas −$20.00',
} as const;

async function sembrarOps(
  ops: Op[],
  hoy: string,
  notificaciones: Parameters<typeof sembrar>[2] = [],
): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  await sembrar(
    { id: 'SEM-INICIO', titulo: 'Semilla de FT-08', refs: [], hoy, estadoInicial: ops, pasos: [] },
    hoy,
    notificaciones,
  );
}

async function abrir(page: Page, ruta = '/'): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const billete = (page: Page) => page.locator('[data-resumen-lpa="billete"]');
const sobregiro = (page: Page, categoria: string) =>
  page.locator('details[data-sobregiro]').filter({ hasText: categoria });

// Hallazgos de ritmo (06 3.5.4) a 10 días del período (21 ene) con 21 por delante: la proyección es el gasto × 21 / 10. Cada
// categoría tiene Asignado $50.00 y tres consumos; el Disponible proyectado es Disponible − proyección y el exceso, su opuesto.
// Gasto 30, 40, 50, 60 y 70 → proyección 63, 84, 105, 126 y 147 → exceso 43, 74, 105, 136 y 167 (solo los tres últimos entran).
const HOY_RITMO = '2027-01-30';
const GASTOS_RITMO: Record<string, number[]> = {
  Alfa: [10, 10, 10],
  Beta: [10, 10, 20],
  Gama: [10, 20, 20],
  Delta: [20, 20, 20],
  Epsilon: [20, 20, 30],
};
const OPS_RITMO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  ...Object.keys(GASTOS_RITMO).map((categoria): Op => ({ op: 'OP-07', categoria })),
  { op: 'OP-21', monto: 1000 },
  ...Object.keys(GASTOS_RITMO).map((categoria): Op => ({
    op: 'OP-14',
    categoria,
    monto: 50,
    periodo: 'P1',
  })),
  ...Object.entries(GASTOS_RITMO).flatMap(([categoria, montos]) =>
    montos.map((monto): Op => ({ op: 'OP-20', cuenta: 'Ahorro', monto, categoria })),
  ),
];

test.describe('PRU-E2E-INICIO', () => {
  test.describe.configure({ timeout: 120_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-INICIO-130 [CA-08.1, ESC-15] RUTA-/ con el paso 2 de ESC-15 Salidas está en sobregiradas con "Sobregiro con débito o efectivo" y sin monto a la vista, y al tocar se ve $50.00 y que reducirá Listo para asignar en $50.00', async ({
    page,
  }) => {
    await sembrarOps(ESC15, '2027-02-10');
    await abrir(page);
    const fila = sobregiro(page, 'Salidas');
    await expect(fila).toBeVisible();
    await expect(fila.getByText('Sobregiro con débito o efectivo')).toBeVisible();
    await expect(fila.locator('summary [data-centavos]')).toHaveCount(0);
    await expect(fila.getByText(/\$50\.00/).first()).toBeHidden();

    await fila.locator('summary').click();
    await esperarMonto(fila.locator('[data-centavos]').first(), 5000);
    await expect(fila.getByText(t.reducira('$50.00'), { exact: true })).toBeVisible();
  });

  test('PRU-E2E-INICIO-131 [CA-08.2, error 11] las categorías sobregiradas de Inicio y sus montos son las del Presupuesto con Disponible negativo, con débito (ESC-15) y con tarjeta (ESC-05)', async ({
    page,
  }) => {
    for (const [ops, categoria, hoy] of [
      [ESC15, 'Salidas', '2027-02-10'],
      [ESC05, 'Super', '2027-02-15'],
    ] as const) {
      await sembrarOps(ops, hoy);
      await abrir(page);
      const fila = sobregiro(page, categoria);
      await fila.locator('summary').click();
      const enInicio = Number(
        await fila.locator('[data-centavos]').first().getAttribute('data-centavos'),
      );

      await abrir(page, '/presupuesto?filtro=sobregiradas');
      const enPresupuesto = page.locator('[data-fila-categoria]').filter({ hasText: categoria });
      await expect(enPresupuesto).toHaveCount(1);
      const disponible = Number(
        await enPresupuesto.locator('[data-centavos]').first().getAttribute('data-centavos'),
      );
      expect(disponible).toBeLessThan(0);
      expect(enInicio).toBe(-disponible);
    }
  });

  test('PRU-E2E-INICIO-132 [CA-08.3, ESC-20] con el paso 2 de ESC-20 Listo para asignar es $675.00 y "En camino" es $25.00', async ({
    page,
  }) => {
    await sembrarOps(ESC20, '2027-02-10');
    await abrir(page);
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 67500);
    await expect(billete(page).locator('[data-en-camino]')).toContainText('$25.00');
  });

  test('PRU-E2E-INICIO-133 [CA-08.4, ESC-01] con el paso 4 de ESC-01 el patrimonio es −$4,300.00', async ({
    page,
  }) => {
    await sembrarOps(ESC01, '2027-02-05');
    await abrir(page);
    await esperarMonto(page.locator('[data-patrimonio] [data-centavos]'), -430000);
    await expect(page.locator('[data-patrimonio]')).toContainText('−$4,300.00');
  });

  test('PRU-E2E-INICIO-134 [CA-08.5, ESC-31] con el cambio retroactivo del paso 1 de ESC-31 Inicio muestra su resumen; "Marcar como leído" lo quita y no vuelve al recargar', async ({
    page,
  }) => {
    await sembrarOps(ESC31.slice(0, -1), '2027-04-05', [CAMBIO_RETROACTIVO]);
    await abrir(page);
    const cambio = page.locator('[data-cambio-retroactivo]');
    await expect(cambio).toHaveCount(1);
    await expect(cambio).toContainText('−$30.00');
    await expect(cambio).toContainText('−$20.00');

    await cambio.getByRole('button', { name: t.marcarLeido, exact: true }).click();
    await expect(cambio).toHaveCount(0);
    await page.reload();
    await esperarContenido(page);
    await expect(cambio).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-135 [CA-08.6] con 5 categorías con hallazgo de ritmo Inicio muestra solo los 3 de mayor impacto, con su texto, sus montos y su acción', async ({
    page,
  }) => {
    await sembrarOps(OPS_RITMO, HOY_RITMO);
    await abrir(page);
    const hallazgos = page.locator('[data-hallazgo]');
    await expect(hallazgos).toHaveCount(3);
    await expect(hallazgos.nth(0)).toContainText(
      t.hallazgo.ya('$20.00', 'Epsilon', '$167.00', '20/02'),
    );
    await expect(hallazgos.nth(1)).toContainText(
      t.hallazgo.ya('$10.00', 'Delta', '$136.00', '20/02'),
    );
    await expect(hallazgos.nth(2)).toContainText(t.hallazgo.camino('$105.00', 'Gama', '20/02'));
    await expect(
      hallazgos.nth(0).getByRole('link', { name: t.hallazgo.asignar('$167.00') }),
    ).toBeVisible();
    await expect(page.getByText('Alfa', { exact: false })).toHaveCount(0);
    await expect(page.getByText('Beta', { exact: false })).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-136 RUTA-/presupuesto/listo-para-asignar desde el billete de Inicio se abre el detalle de Listo para asignar', async ({
    page,
  }) => {
    await sembrarOps(ESC15, '2027-02-10');
    await abrir(page);
    await page.getByRole('link', { name: t.verDetalle, exact: true }).click();
    await expect(page).toHaveURL(/\/presupuesto\/listo-para-asignar$/);
    await esperarContenido(page);
    await expect(
      page.getByRole('heading', { name: listoParaAsignar.titulo, level: 1 }),
    ).toBeVisible();
  });
  test('PRU-E2E-INICIO-140 [CA-08.7, ESC-13, AV-08] con el paso 4 de ESC-13 la propuesta de reserva excedente devuelve $30.00 con un toque: Listo para asignar sube de $340.00 a $370.00 y aparece "Deshacer", que lo vuelve a $340.00', async ({
    page,
  }) => {
    await sembrarOps(ESC13, '2027-02-21');
    await abrir(page);
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 34000);
    const propuesta = page.locator('[data-reserva-excedente]');
    await expect(propuesta).toContainText('$30.00');
    await propuesta.getByRole('button', { name: t.devolverReserva('$30.00') }).click();
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 37000);
    const salida = page.locator('[data-reserva-devuelta]');
    await expect(salida).toContainText(t.reservaDevuelta('T', '$30.00'));
    await salida.getByRole('button', { name: t.deshacer, exact: true }).click();
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 34000);
    await expect(page.locator('[data-reserva-devuelta]')).toHaveCount(0);
    await expect(page.locator('[data-reserva-excedente]')).toHaveCount(1);
  });

  test('PRU-E2E-INICIO-141 [CA-08.8] sin ninguna condición de atención Inicio dice "Todo al día"; con una sola ocurrencia atrasada no lo dice y la lista', async ({
    page,
  }) => {
    await sembrarOps(AL_DIA, '2027-02-10');
    await abrir(page);
    await expect(page.locator('[data-todo-al-dia]')).toContainText(t.todoAlDia.titulo);
    await expect(page.locator('[data-todo-al-dia]')).toContainText(t.todoAlDia.texto);

    await sembrarOps([...AL_DIA, { ...RENTA, primeraFecha: '2027-02-05' }], '2027-02-10');
    await abrir(page);
    await expect(page.locator('[data-todo-al-dia]')).toHaveCount(0);
    await expect(page.locator('[data-pago-atrasado]')).toContainText('Renta');
    await expect(page.locator('[data-pago-atrasado]')).toContainText('$50.00');
  });

  test('PRU-E2E-INICIO-142 [CA-08.9] con 7 transacciones "Recientes" muestra las 5 últimas por fecha, de la más reciente a la más antigua', async ({
    page,
  }) => {
    const gastos = [1, 2, 3, 4, 5, 6, 7].map((n): Op => ({
      op: 'OP-20',
      cuenta: 'Ahorro',
      monto: 10 + n,
      categoria: 'Super',
      fecha: `2027-02-0${n}`,
    }));
    // El ingreso es del 25 ene: queda fuera de las 5 últimas.
    const base: Op[] = [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
      { op: 'OP-14', categoria: 'Super', monto: 1000, periodo: 'P1', hoy: '2027-01-25' },
    ];
    await sembrarOps([...base, ...gastos], '2027-02-10');
    await abrir(page);
    const filas = page.locator('[data-seccion="recientes"] [data-fila-transaccion]');
    await expect(filas).toHaveCount(5);
    for (const [i, monto] of [-1700, -1600, -1500, -1400, -1300].entries())
      await esperarMonto(filas.nth(i).locator('[data-centavos]'), monto);
  });

  test('PRU-E2E-INICIO-143 [CA-08.10] una tarjeta con pago en 2 días y $120.00 para no generar intereses aparece en "Pagos de tarjeta próximos" con enlace a su cuenta; con $0.00 no aparece', async ({
    page,
  }) => {
    const base: Op[] = [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', diaCorte: 15, diaPago: 5 },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-21', monto: 500, fecha: '2027-01-25', hoy: '2027-01-25' },
      { op: 'OP-14', categoria: 'Super', monto: 200, periodo: 'P1', hoy: '2027-01-25' },
    ];
    const compra: Op = {
      op: 'OP-20',
      cuenta: 'T',
      monto: 120,
      categoria: 'Super',
      fecha: '2027-02-10',
      hoy: '2027-02-10',
    };
    await sembrarOps([...base, compra], '2027-03-03');
    await abrir(page);
    const fila = page.locator('[data-pago-tarjeta]');
    await expect(fila).toHaveCount(1);
    await esperarMonto(fila.locator('[data-centavos]'), 12000);
    await expect(page.getByText(t.pagoDeTarjeta('05/03'))).toBeVisible();
    await expect(fila.locator('xpath=ancestor::a')).toHaveAttribute(
      'href',
      /^\/cuentas\/[0-9a-f-]+$/,
    );

    await sembrarOps(base, '2027-03-03');
    await abrir(page);
    await expect(page.locator('[data-pago-tarjeta]')).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-144 [CA-08.11] el botón del billete va a las categorías sin fondos si las hay, a Presupuesto si no, y con Listo para asignar negativo dice "Quitar $100.00 de una categoría" y va a Presupuesto', async ({
    page,
  }) => {
    await sembrarOps(ESC03, '2027-02-05');
    await abrir(page);
    await billete(page)
      .getByRole('link', { name: t.asignar('$100.00') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto\?filtro=sin-fondos$/);

    await sembrarOps(
      ESC03.filter((o) => o.op !== 'OP-18'),
      '2027-02-05',
    );
    await abrir(page);
    await billete(page)
      .getByRole('link', { name: t.asignar('$100.00') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto$/);

    await sembrarOps(
      [...ESC03, { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' }],
      '2027-02-05',
    );
    await abrir(page);
    await billete(page)
      .getByRole('link', { name: t.quitar('$100.00') })
      .click();
    await expect(page).toHaveURL(/\/presupuesto$/);
  });

  test('PRU-E2E-INICIO-145 [CA-08.12, ESC-20] con $25.00 en camino de un deudor el billete dice "En camino $25.00" sin el nombre del deudor', async ({
    page,
  }) => {
    await sembrarOps(ESC20, '2027-02-10');
    await abrir(page);
    await expect(billete(page).locator('[data-en-camino]')).toContainText('En camino $25.00');
    await expect(page.getByText('Ana', { exact: true })).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-146 [AV-14, ESC-44] con el paso 2 de ESC-44 la archivada con $25.00 se ofrece en Inicio: un toque saca el dinero y Listo para asignar sube de $670.00 a $695.00', async ({
    page,
  }) => {
    await sembrarOps(ESC44, '2027-03-05');
    await abrir(page);
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 67000);
    const fila = page.locator('[data-archivada]');
    await expect(fila).toContainText('Gimnasio');
    await expect(fila).toContainText('$25.00');
    await fila.getByRole('button', { name: /^Sacar \$25\.00/ }).click();
    await esperarMonto(billete(page).locator('[data-centavos]').first(), 69500);
    await expect(page.locator('[data-archivada]')).toHaveCount(0);
  });

  test('PRU-E2E-INICIO-147 [FT-08] los próximos 7 días listan la ocurrencia con "se registra sola" y el enlace a su ocurrencia, y no quitan el "Todo al día"', async ({
    page,
  }) => {
    const netflix = {
      ...RENTA,
      comercio: 'Netflix',
      etiqueta: 'Netflix',
      primeraFecha: '2027-02-12',
      automatico: true,
    } as const;
    await sembrarOps([...AL_DIA, netflix], '2027-02-10');
    await abrir(page);
    const fila = page.locator('[data-proximo-pago]');
    await expect(fila).toHaveCount(1);
    await expect(fila).toContainText('Netflix');
    await expect(fila).toContainText(t.seRegistraSola);
    await expect(fila.locator('a')).toHaveAttribute(
      'href',
      /^\/programadas\/[0-9a-f-]+\/ocurrencias\/2027-02-12$/,
    );
    await expect(page.locator('[data-todo-al-dia]')).toHaveCount(1);
  });
});

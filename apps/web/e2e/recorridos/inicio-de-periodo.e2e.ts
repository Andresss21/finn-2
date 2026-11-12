// Recorrido 4.3 «Inicio de período» de 06 (REC-4.3; 07 §17: un recorrido es una E2E). Parte de `estado_4_3` (SEM-4.3: tres períodos
// cerrados, hoy 21/04/2027, primer día de P4, antes de la tarea diaria) con las operaciones reales (DP-17) y encadena las pantallas de
// sus fichas con el reloj de prueba alineado (07 §4.1). Los números los pone el motor (PF-3). El estado de partida es el de la
// semilla `estado-4-3.ts`, copiado aquí porque las E2E no importan valores del dominio (04 §1.3), más la programada de Netflix con
// registro automático que 06 §4.3 lista en el estado y la semilla no puede crear (su comentario: «OP-25 no existe aún»).
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido } from '../ayudas/esperas.ts';
import { esperarMonto } from '../ayudas/montos.ts';
import { correrTareaDiaria } from '../ayudas/tarea-diaria.ts';
import { alinearRelojes } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import { glosario } from '../../src/textos/glosario.ts';
import { presupuestoAsignar as ta } from '../../src/textos/presupuesto-asignar.ts';
import { reportes as tr } from '../../src/textos/reportes.ts';
import type { Page } from '@playwright/test';

const HOY = '2027-04-21';
const INICIOS = ['2027-01-21', '2027-02-21', '2027-03-21'];
const PERIODOS = ['P1', 'P2', 'P3'] as const;

/** Un período de la semilla: asignaciones, el cargo de Netflix del 21, los ingresos del 25 y los gastos del 27, 28 y los de Farmacia. */
const periodo = (
  k: 0 | 1 | 2,
  fondo: number,
  farmacia: number,
  [restaurantes, superGasto]: [number, number],
  gastoFarmacia: [string, number] | null,
  fechas: { ingreso: string; restaurantes: string; super: string },
): Op[] => {
  const hoy = INICIOS[k] ?? HOY;
  const p = PERIODOS[k];
  return [
    ...(k === 0
      ? ([
          { op: 'OP-01', cuenta: 'Ahorro', saldo: 900, hoy },
          ...['Super', 'Farmacia', 'Restaurantes', 'Netflix', 'Fondo'].map((categoria): Op => ({
            op: 'OP-07',
            categoria,
            hoy,
          })),
          { op: 'OP-18', categoria: 'Super', tipo: 'mensual', monto: 300, hoy },
          { op: 'OP-18', categoria: 'Netflix', tipo: 'mensual', monto: 15.49, hoy },
          {
            op: 'OP-18',
            categoria: 'Fondo',
            tipo: 'para_fecha',
            monto: 600,
            fecha: '2027-04-15',
            hoy,
          },
        ] as Op[])
      : []),
    { op: 'OP-14', categoria: 'Super', monto: 300, periodo: p, hoy },
    { op: 'OP-14', categoria: 'Restaurantes', monto: 100, periodo: p, hoy },
    { op: 'OP-14', categoria: 'Netflix', monto: 15.49, periodo: p, hoy },
    { op: 'OP-14', categoria: 'Fondo', monto: fondo, periodo: p, hoy },
    ...(k > 0
      ? [{ op: 'OP-14', categoria: 'Farmacia', monto: farmacia, periodo: p, hoy } as Op]
      : []),
    { op: 'OP-20', cuenta: 'Ahorro', monto: 15.49, categoria: 'Netflix', hoy },
    { op: 'OP-21', monto: 600, cuenta: 'Ahorro', hoy: fechas.ingreso },
    {
      op: 'OP-20',
      cuenta: 'Ahorro',
      monto: restaurantes,
      categoria: 'Restaurantes',
      hoy: fechas.restaurantes,
    },
    { op: 'OP-20', cuenta: 'Ahorro', monto: superGasto, categoria: 'Super', hoy: fechas.super },
    ...(gastoFarmacia === null
      ? []
      : [
          {
            op: 'OP-20',
            cuenta: 'Ahorro',
            monto: gastoFarmacia[1],
            categoria: 'Farmacia',
            hoy: gastoFarmacia[0],
          } as Op,
        ]),
  ];
};

// P1: sin Farmacia. P2: Farmacia $20.00 asignados y gastados el 02/03. P3: $35.00 asignados y $30.50 gastados el 02/04.
const ESTADO_4_3: Op[] = [
  ...periodo(0, 150, 0, [140, 280], null, {
    ingreso: '2027-01-25',
    restaurantes: '2027-01-27',
    super: '2027-01-28',
  }),
  ...periodo(1, 150, 20, [145, 290], ['2027-03-02', 20], {
    ingreso: '2027-02-25',
    restaurantes: '2027-02-27',
    super: '2027-02-28',
  }),
  ...periodo(2, 100, 35, [150, 310], ['2027-04-02', 30.5], {
    ingreso: '2027-03-25',
    restaurantes: '2027-03-27',
    super: '2027-03-28',
  }),
  // La programada de 06 §4.3: Netflix, $15.49, mensual, día 21, desde Ahorro, con registro automático
  {
    op: 'OP-42',
    etiqueta: 'Netflix',
    cuenta: 'Ahorro',
    comercio: 'NETFLIX',
    monto: 15.49,
    categoria: 'Netflix',
    primeraFecha: '2027-04-21',
    automatico: true,
    hoy: HOY,
  },
];

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });
/** Los montos de una fila de categoría: Disponible, Asignado y Gastado, en ese orden (05 §10.8). */
const montoDeFila = (page: Page, nombre: string, n: 0 | 1 | 2) =>
  fila(page, nombre).locator('[data-centavos]').nth(n);
const lpa = (page: Page) => page.locator('[data-resumen-lpa] [data-centavos]').first();
const linea = (page: Page, etiqueta: string) =>
  page
    .locator('[data-seccion="descomposicion"] dl > div')
    .filter({ has: page.getByText(etiqueta, { exact: true }) })
    .locator('[data-centavos]');
const meta = (page: Page, categoria: string) =>
  page.locator('[data-meta]').filter({ has: page.getByRole('heading', { name: categoria }) });
const opcion = (page: Page, nombre: string) =>
  page.locator('[data-asignacion-rapida]').getByRole('button', { name: nombre });
const filaDeImpacto = (page: Page, nombre: string) =>
  page
    .locator('[aria-labelledby="confirmacion-titulo"] li')
    .filter({ has: page.getByText(nombre, { exact: true }) });
const ahorro = (page: Page) =>
  page.locator('[data-identidad="efectivo"]').filter({ hasText: 'Ahorro' });

async function idDe(page: Page, nombre: string): Promise<string> {
  const id = await fila(page, nombre).getAttribute('data-fila-categoria');
  if (id === null) throw new Error(`no hay una fila de ${nombre}`);
  return id;
}

test.describe('PRU-E2E-PRES recorrido 4.3 inicio de período', () => {
  test.describe.configure({ timeout: 240_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-430 [REC-4.3, CA-16.2, CA-15.3, CA-17.4, CA-13.2, CA-12.6, CA-63.1] desde SEM-4.3 la tarea diaria del 21/04 registra Netflix y deja un solo push de cierre, P3 se ve en solo lectura con el sobregiro de Restaurantes, el detalle de Listo para asignar suma las reducciones, extender la meta de Fondo, auto-asignar, el promedio de Farmacia y el ajuste de Restaurantes dejan Listo para asignar en $277.79 con Ahorro intacto', async ({
    page,
    request,
  }) => {
    await alinearRelojes(page, `${HOY}T10:00:00-06:00`);
    const escenario: Escenario = {
      id: 'SEM-REC-4.3',
      titulo: 'Semilla de 4.3 Inicio de período',
      refs: ['REC-4.3'],
      hoy: '2027-01-21',
      estadoInicial: ESTADO_4_3,
      pasos: [],
    };
    await sembrar(escenario, HOY);

    // Paso 0: los derivados del estado: Ahorro $1,288.03 y Listo para asignar $863.53 (la meta de Fondo ya venció)
    await abrir(page, '/cuentas');
    await expect(ahorro(page)).toContainText('$1,288.03');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 86353);

    // Paso 1: la tarea diaria del 21/04, dos veces: registra Netflix y deja un solo push de cierre (CA-16.5)
    await correrTareaDiaria(request);
    await correrTareaDiaria(request);
    await abrir(page, '/cuentas');
    await expect(ahorro(page)).toContainText('$1,272.54');
    await abrir(page, '/presupuesto');
    await esperarMonto(lpa(page), 86353);
    await esperarMonto(montoDeFila(page, 'Netflix', 0), -1549);
    await abrir(page, '/notificaciones');
    const cierres = page.locator('[data-notificacion]').filter({ hasText: 'Cerró el período' });
    await expect(cierres).toHaveCount(1);
    await expect(cierres).toContainText('del 21/03 al 20/04');
    await expect(cierres).toContainText('$50.00');

    // Paso 2: tocar el push abre P3 en solo lectura: Restaurantes −$50.00 con «Sobregiro con débito o efectivo», sin «+»
    await cierres.getByRole('link').first().click();
    await expect(page).toHaveURL(/\/presupuesto\?periodo=2027-03-21/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Restaurantes', 0), -5000);
    await expect(fila(page, 'Restaurantes')).toContainText(glosario.sobregiroConDebitoOEfectivo);
    await expect(page.getByRole('link', { name: /^Asignar/ })).toHaveCount(0);

    // Paso 3: el detalle de Listo para asignar en P4: reducciones por sobregiro con débito $135.00 y LPA $863.53
    await abrir(page, '/presupuesto/listo-para-asignar');
    await esperarMonto(linea(page, 'Reducciones por sobregiro con débito'), 13500);
    await esperarMonto(lpa(page), 86353);

    // Paso 4: extender la meta de Fondo al 20/06/2027: «En curso» y el pedido pasa a $100.00 (n = 2)
    await abrir(page, '/metas');
    await expect(page.locator('[data-aviso-meta]')).toContainText('Fondo');
    await page.getByRole('link', { name: 'Extender la fecha' }).click();
    await page.getByRole('button', { name: 'Extender la fecha' }).click();
    await page.getByLabel('Fecha objetivo', { exact: true }).fill('2027-06-20');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page).toHaveURL(/\/metas$/);
    await esperarContenido(page);
    await expect(page.locator('[data-aviso-meta]')).toHaveCount(0);
    await expect(meta(page, 'Fondo')).toHaveAttribute('data-vencida', 'no');
    await esperarMonto(meta(page, 'Fondo').locator('[data-pedido] [data-centavos]'), 10000);

    // Paso 5: Auto-asignar: Super $300.00, Netflix $15.49 y Fondo $100.00, sin AV-18; LPA $448.04, Netflix $0.00, Fondo $500.00
    await abrir(page, '/presupuesto');
    await page.getByRole('link', { name: 'Auto-asignar' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await expect(filaDeImpacto(page, 'Super')).toContainText('$20.00 → $320.00');
    await expect(filaDeImpacto(page, 'Netflix')).toContainText('+$15.49');
    await expect(filaDeImpacto(page, 'Fondo')).toContainText('+$100.00');
    await expect(page.getByText(/quedó sin cubrir/)).toHaveCount(0);
    await page.getByRole('button', { name: 'Asignar', exact: true }).click();
    // Sin AV-18 (nada quedó sin cubrir) el flujo se cierra solo, sin el aviso de «Asignación hecha»
    await expect(page.getByRole('dialog')).toHaveCount(0);
    await expect(page.getByText(/quedó sin cubrir/)).toHaveCount(0);
    await esperarContenido(page);
    await esperarMonto(lpa(page), 44804);
    await esperarMonto(montoDeFila(page, 'Netflix', 0), 0);
    await esperarMonto(montoDeFila(page, 'Fondo', 0), 50000);

    // Paso 6: en Farmacia, «Tu promedio de gasto (2 períodos)» $25.25: Farmacia $29.75 y LPA $422.79
    await abrir(page, `/presupuesto/asignar/${await idDe(page, 'Farmacia')}`);
    await esperarMonto(opcion(page, ta.rapida.promedio(2)).locator('[data-centavos]'), 2525);
    await opcion(page, ta.rapida.promedio(2)).click();
    await expect(page).toHaveURL(/\/presupuesto$/);
    await esperarContenido(page);
    await esperarMonto(montoDeFila(page, 'Farmacia', 0), 2975);
    await esperarMonto(lpa(page), 42279);

    // Paso 7: «Presupuesto contra la realidad»: aceptar el ajuste de Restaurantes a $145.00: LPA $277.79 y Ahorro intacto
    await abrir(page, '/reportes/realidad');
    const h = page.locator('[data-hallazgo-realidad]').filter({ hasText: 'Restaurantes' });
    await expect(h).toContainText(
      tr.realidad.pasas('$145.00', 'Restaurantes', '$100.00', '$145.00'),
    );
    await h.getByRole('button', { name: tr.realidad.ajustar('$145.00'), exact: true }).click();
    await expect(page.locator('[data-realidad-ajustado]')).toContainText(
      tr.realidad.ajustado('$145.00', 'Restaurantes'),
    );
    await abrir(page, '/presupuesto');
    await esperarMonto(montoDeFila(page, 'Restaurantes', 0), 14500);
    await esperarMonto(lpa(page), 27779);
    await abrir(page, '/cuentas');
    await expect(ahorro(page)).toContainText('$1,272.54');
  });
});

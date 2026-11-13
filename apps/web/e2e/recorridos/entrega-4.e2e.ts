// Cierre de B10 (TA-597; CH-240 d; PROMPT-DESARROLLO §4, §7.1, §7.4, §7.5): la verificación transversal de la entrega 4. (1) Los seis
// flujos con impacto llaman a previsualizar y muestran la K4 antes de confirmar (CA-E4-21, CA-E6-16); (2) los textos de 06 §5.6 y los
// filtros como enlaces con `aria-current` (CA-E6-20, CA-E6-21); (3) con `prefers-reduced-motion` nada de B10 se anima (CA-E4-24);
// (4) con la semilla `estado-a7` y el recorrido 4.2, la insignia de la Bandeja sube en uno con el paso 1 y vuelve al valor de partida en el paso 3, en
// todas las pantallas, y las cifras son las del motor (CA-C-1, CA-C-2). Los números los pone el motor (PF-3, DP-27): nada se copia de
// `DATOS-EJEMPLO.md` ni de los PNG; las diferencias con las referencias se leen de la salida (`console.log`) y se informan.
// Las capturas de la verificación B10 (§29c) las toma la propia prueba de CA-C-1 fuera del repo (`FINN_CAPTURAS`, o `C:/finn/capturas/TA-597`
// en Windows) en los cuatro modos: 390 × 844 y 1440 × 900, claro y oscuro.
import { mkdirSync } from 'node:fs';
import { expect, test, sembrar } from '../configuracion/semilla.ts';
import { entrarAal2 } from '../ayudas/sesion.ts';
import { esperarContenido, esperarHidratacion } from '../ayudas/esperas.ts';
import { generarTokenWebhook } from '../ayudas/webhook.ts';
import { alinearRelojes, fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import { cuentaDetalle } from '../../src/textos/cuenta-detalle.ts';
import { cuentasGestion } from '../../src/textos/cuentas-gestion.ts';
import { ajustesCiclo as tc } from '../../src/textos/ajustes-ciclo.ts';
import { dominio } from '../../src/textos/dominio.ts';
import { navegacion } from '../../src/textos/navegacion.ts';
import { registrarGasto as rg } from '../../src/textos/registrar-gasto.ts';
import { verificarSaldo as tv } from '../../src/textos/verificar-saldo.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';
import type { Page } from '@playwright/test';

const BASE_E2E = 'finn_e2e';
const HOY_A7 = '2026-10-15';
const AHORA_A7 = `${HOY_A7}T12:41:00-06:00`;

async function abrir(page: Page, ruta: string): Promise<void> {
  await page.goto(ruta);
  await esperarContenido(page);
}

/** Siembra una lista de operaciones con el reloj del servidor en `hoy` (DP-04, DP-17). */
async function sembrarOps(estadoInicial: Op[], hoy: string): Promise<void> {
  fijarRelojServidor(`${hoy}T10:00:00-06:00`);
  const escenario: Escenario = {
    id: 'SEM-E4-CIERRE',
    titulo: 'Semilla del cierre de B10',
    refs: [],
    hoy,
    estadoInicial,
    pasos: [],
  };
  await sembrar(escenario, hoy);
}

/** SEM-A7 después del paso 3 de 4.2 (A.7 publicado), como lo siembra `un-dia-tipico`, sin importar valores del dominio. */
async function sembrarA7(): Promise<void> {
  const { escenarioA7 } = await import('../../../../packages/aplicacion/test/escenarios/a7.ts');
  await sembrar(escenarioA7(), HOY_A7);
}

/** Cuenta las llamadas al servidor (Server Actions) que hace la página desde que se llama. */
function contarAcciones(page: Page): () => number {
  let n = 0;
  page.on('request', (r) => {
    if (r.method() === 'POST' && r.headers()['next-action'] !== undefined) n += 1;
  });
  return () => n;
}

/** La tarjeta K4 de cualquiera de los flujos: la de archivar y fusionar, el paso de impacto y el panel del ciclo. */
const k4 = (page: Page) =>
  page
    .locator(
      '[data-impacto-k4], [aria-labelledby="confirmacion-titulo"], [aria-label="Antes de confirmar"]',
    )
    .first();

const fila = (page: Page, nombre: string) =>
  page.locator('[data-fila-categoria]').filter({ has: page.getByText(nombre, { exact: true }) });

async function idDeCategoria(page: Page, nombre: string): Promise<string> {
  await abrir(page, '/presupuesto');
  return (await fila(page, nombre).getAttribute('data-fila-categoria')) ?? '';
}

// ── PRU-E2E-PRES-791: los seis flujos ───────────────────────────────────────────────────────────────────────────────────────────

// ESC-43 paso 1: la tarjeta U con $200.00 de deuda, $150.00 asignados en un período cerrado y $50.00 en el actual.
const ESC43_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'U', tipo: 'tarjeta', saldo: 200, apertura: '2027-01-25' },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Pago U', monto: 150, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Pago U', monto: 50 },
];
// ESC-03 hasta el paso 5 con tres metas: Listo para asignar $100.00 y metas de $60.00, $50.00 y $30.00.
const TRES_METAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Alfa' },
  { op: 'OP-07', categoria: 'Beta' },
  { op: 'OP-07', categoria: 'Gama' },
  { op: 'OP-18', categoria: 'Alfa', monto: 60 },
  { op: 'OP-18', categoria: 'Beta', monto: 50 },
  { op: 'OP-18', categoria: 'Gama', monto: 30 },
  { op: 'OP-21', monto: 100 },
];
// ESC-45, estado inicial (hoy 10 nov 2027, período 21 oct a 20 nov).
const ESC45: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', apertura: '2027-10-21' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Semanal' },
  { op: 'OP-07', categoria: 'Mensual' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 100, desde: '2027-11-21' },
];
// Ahorro con saldo al 15 de octubre de 2027 (verificar saldo).
const EFECTIVO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000 },
  { op: 'OP-07', categoria: 'Súper' },
  { op: 'OP-21', monto: 300, cuenta: 'Ahorro', fecha: '2027-10-05' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 50, categoria: 'Súper', fecha: '2027-10-10' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 20, categoria: 'Súper', fecha: '2027-10-18' },
];
// ESC-44 paso 0: Gimnasio con $70.00 en P1, un débito, $30.00 en P3 y una programada activa; más Salidas para pasarla a otra.
const ESC44: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
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
// ESC-42 paso 0 (Café con meta y Salidas), más Super como segundo destino para cambiar la decisión.
const ESC42: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Café' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-18', categoria: 'Café', monto: 50 },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Café', monto: 50, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Café', hoy: '2027-02-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Salidas', hoy: '2027-02-04' },
];
/** La primera cuenta que el ejecutor crea después del grupo Gastos (ids secuenciales). */
const CUENTA = '00000000-0000-4000-8000-000000000002';

test.describe('PRU-E2E-PRES cierre de B10', () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PRES-791 [CA-E4-21, CA-E6-16] en cada uno de los seis flujos el servidor recibe el pedido de previsualizar con lo elegido y la K4 aparece antes de «Confirmar»; en archivar y fusionar, cambiar una decisión la vuelve a pedir', async ({
    page,
  }) => {
    const acciones = contarAcciones(page);

    // 1. Eliminar una cuenta: «Ver los cambios» pide el impacto y muestra el paso antes de «Eliminar»
    await sembrarOps(ESC43_PASO1, '2027-03-05');
    await abrir(page, '/cuentas');
    await page
      .getByRole('link', { name: 'Ver detalle de U', exact: true })
      .or(page.locator('[data-grupo="Efectivo"] a').filter({ hasText: 'U' }))
      .first()
      .click();
    await expect(page).toHaveURL(/\/cuentas\/[0-9a-f-]{36}$/);
    await esperarContenido(page);
    await page.getByRole('button', { name: 'Más acciones' }).click();
    await page
      .getByRole('menuitem', { name: cuentaDetalle.acciones.eliminar, exact: true })
      .click();
    await expect(page).toHaveURL(/\/eliminar$/);
    await esperarContenido(page);
    let antes = acciones();
    await page
      .getByRole('button', { name: cuentasGestion.eliminar.verCambios, exact: true })
      .click();
    await expect(page.getByRole('heading', { name: cuentasGestion.comunes.revisar })).toBeVisible();
    expect(acciones(), 'eliminar cuenta previsualiza').toBeGreaterThan(antes);
    await expect(k4(page)).toBeVisible();
    await expect(
      page.getByRole('button', { name: cuentasGestion.eliminar.eliminar, exact: true }),
    ).toBeVisible();

    // 2. Auto-asignar: el impacto llega al abrir, con lo que se asignaría, y «Asignar $X» confirma
    await sembrarOps(TRES_METAS, '2027-02-05');
    antes = acciones();
    await abrir(page, '/presupuesto/auto-asignar');
    await expect(page.getByText('Beta queda con $10.00 sin cubrir.')).toBeVisible();
    expect(acciones(), 'auto-asignar previsualiza').toBeGreaterThan(antes);
    await expect(k4(page)).toBeVisible();
    await expect(page.getByRole('button', { name: /^Asignar \$/ })).toBeVisible();

    // 3. Cambiar el ciclo: elegir el día pide AV-12 y el panel muestra la K4 con la fecha desde la que rige
    await sembrarOps(ESC45, '2027-11-10');
    await abrir(page, '/ajustes/ciclo');
    await esperarHidratacion(page);
    antes = acciones();
    await page.getByLabel(tc.nuevoDia, { exact: true }).selectOption('1');
    await expect(page.getByRole('region', { name: tc.revisar })).toContainText(
      'Rige desde el 21/12/2027',
    );
    expect(acciones(), 'cambiar el ciclo previsualiza').toBeGreaterThan(antes);
    await expect(page.getByRole('button', { name: tc.confirmarDia(1), exact: true })).toBeVisible();

    // 4. Verificar saldo: calcular la diferencia y «Revisar» piden el impacto; el paso de revisión precede a «Confirmar»
    await sembrarOps(EFECTIVO, '2027-10-20');
    await abrir(page, `/cuentas/${CUENTA}/verificar-saldo?fecha=2027-10-15`);
    await esperarHidratacion(page);
    await page.getByLabel(tv.saldoBanco, { exact: true }).fill('1250');
    await page.getByRole('button', { name: tv.verDiferencia }).click();
    await expect(page.getByText(tv.diferencia('$0.00'))).toBeVisible();
    antes = acciones();
    await page.getByRole('button', { name: tv.revisar }).click();
    await expect(page.getByRole('heading', { name: tv.tituloRevisar })).toBeVisible();
    expect(acciones(), 'verificar saldo previsualiza').toBeGreaterThan(antes);
    await expect(page.getByRole('button', { name: tv.confirmar })).toBeVisible();

    // 5. Archivar una categoría: la K4 está en la misma pantalla y cambiar una decisión la vuelve a pedir
    await sembrarOps(ESC44, '2027-03-05');
    const gimnasio = await idDeCategoria(page, 'Gimnasio');
    antes = acciones();
    await abrir(page, `/presupuesto/categorias/${gimnasio}/archivar`);
    await expect(page.locator('[data-impacto-k4]')).toBeVisible();
    expect(acciones(), 'archivar previsualiza').toBeGreaterThan(antes);
    const programada = page.getByLabel(/Programada Gimnasio/);
    await esperarHidratacion(page);
    antes = acciones();
    await programada.selectOption({ label: 'Pasarla a otra categoría' });
    await page.getByLabel('Pasarla a').selectOption({ label: 'Salidas' });
    await expect.poll(acciones).toBeGreaterThan(antes);
    await expect(page.locator('[data-impacto-k4]')).toBeVisible();
    await expect(
      page.getByRole('button', { name: 'Archivar Gimnasio', exact: true }),
    ).toBeEnabled();

    // 6. Fusionar: elegir el destino pide el impacto y cambiarlo lo vuelve a pedir
    await sembrarOps(ESC42, '2027-04-05');
    const cafe = await idDeCategoria(page, 'Café');
    await abrir(page, `/presupuesto/categorias/${cafe}/fusionar`);
    await esperarHidratacion(page);
    antes = acciones();
    await page.getByLabel('Fusionar con').selectOption({ label: 'Salidas' });
    await expect(page.getByRole('heading', { name: 'Antes de confirmar' })).toBeVisible();
    expect(acciones(), 'fusionar previsualiza').toBeGreaterThan(antes);
    antes = acciones();
    await page.getByLabel('Fusionar con').selectOption({ label: 'Super' });
    await expect.poll(acciones).toBeGreaterThan(antes);
    await expect(page.getByRole('heading', { name: 'Antes de confirmar' })).toBeVisible();
    await expect(page.getByRole('button', { name: 'Fusionar', exact: true })).toBeVisible();
  });
});

// ── PRU-E2E-PWA-792 y PRU-E2E-PWA-793: textos, enlaces con aria-current y movimiento reducido ─────────────────────────────────

/** Las pantallas y los flujos de B10 que se ven con el estado de A.7 (los ids de las rutas con parámetro se leen de la app). */
async function rutasDeB10(page: Page): Promise<string[]> {
  const restaurantes = await idDeCategoria(page, 'Restaurantes');
  await abrir(page, '/cuentas');
  const corriente = (
    (await page
      .locator('a[href^="/cuentas/"]')
      .filter({ hasText: 'Cuenta corriente' })
      .first()
      .getAttribute('href')) ?? ''
  ).split('?')[0];
  return [
    '/',
    '/presupuesto',
    '/presupuesto?filtro=sin-fondos',
    `/presupuesto/categorias/${restaurantes}`,
    `/presupuesto/categorias/${restaurantes}/archivar`,
    `/presupuesto/categorias/${restaurantes}/fusionar`,
    '/presupuesto/auto-asignar',
    '/presupuesto/listo-para-asignar',
    '/cuentas',
    `${corriente}`,
    `${corriente}/verificar-saldo`,
    '/ajustes',
    '/ajustes/ciclo',
    '/actividad',
    '/bandeja',
    '/registrar/gasto',
    '/reportes/tendencia',
    '/reportes/gasto-semanal',
  ];
}

test.describe('PRU-E2E-PWA cierre de B10', () => {
  test.describe.configure({ timeout: 300_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-PWA-792 [CA-E6-20, CA-E6-21] los textos de 06 §5.6 aparecen tal cual en Inicio, Presupuesto, Registrar gasto, Cuentas y Gasto semanal; los filtros y los Períodos son enlaces con aria-current; los montos llevan data-rol y los de los botones, cifras tabulares', async ({
    page,
  }) => {
    await alinearRelojes(page, AHORA_A7);
    await sembrarA7();
    const cuerpo = page.locator('body');

    // Inicio: «En camino $X» sin «te debe» y «Patrimonio» sin «neto»
    await abrir(page, '/');
    await expect(page.locator('[data-en-camino]').first()).toContainText(
      /^En camino \$[\d,]+\.\d{2}/,
    );
    await expect(cuerpo).not.toContainText('te debe');
    await expect(page.getByText('Patrimonio', { exact: true }).first()).toBeVisible();
    await expect(cuerpo).not.toContainText('Patrimonio neto');

    // Presupuesto: la fila de pago de tarjeta dice «Reservado»; los filtros son enlaces y el activo lleva aria-current
    await abrir(page, '/presupuesto');
    const pago = page.locator('[data-fila-pago]').first();
    await expect(pago).toContainText(dominio.reservado);
    await expect(pago).not.toContainText('Disponible para pagar');
    const filtros = page.locator('[role="group"][aria-label="Filtrar categorías"]');
    await expect(filtros.locator('a')).toHaveCount(4);
    await expect(filtros.locator('a[aria-current]')).toHaveCount(1);
    await filtros.getByRole('link', { name: 'Sin fondos', exact: true }).click();
    await expect(page).toHaveURL(/filtro=sin-fondos/);
    await esperarContenido(page);
    await expect(
      page
        .locator('[role="group"][aria-label="Filtrar categorías"]')
        .getByRole('link', { name: 'Sin fondos', exact: true }),
    ).toHaveAttribute('aria-current', /true|page/);

    // Registrar gasto: la cuenta propuesta, sin el bloque «Antes de guardar»
    await abrir(page, '/registrar/gasto');
    await expect(page.getByText(rg.cuentaPropuesta, { exact: true })).toBeVisible();
    await expect(cuerpo).not.toContainText('Antes de guardar');

    // Cuentas: «Confirmado {monto}», nunca «confirmado igual»
    await abrir(page, '/cuentas');
    await expect(cuerpo).toContainText(/Confirmado \$[\d,]+\.\d{2}/);
    await expect(cuerpo).not.toContainText('confirmado igual');

    // Gasto semanal: «Referencia a esta semana», nunca «Referencia hoy»
    await abrir(page, '/reportes/gasto-semanal');
    await expect(cuerpo).toContainText('Referencia a esta semana');
    await expect(cuerpo).not.toContainText('Referencia hoy');

    // Los Períodos de un reporte son enlaces; el activo lleva aria-current
    await abrir(page, '/reportes/tendencia');
    const periodos = page.locator('nav[aria-label="Períodos"]');
    expect(await periodos.locator('a').count()).toBeGreaterThan(1);
    await expect(periodos.locator('a[aria-current]')).toHaveCount(1);

    // Entrega 3, «Salir»: el correo de la sesión encima de «Salir» (barra lateral) y como subtítulo de su tarjeta de Ajustes
    await abrir(page, '/ajustes');
    await expect(cuerpo).toContainText(/@\S+ · en este dispositivo/);
    await page.setViewportSize({ width: 1440, height: 900 });
    await abrir(page, '/');
    await expect(page.locator('aside [data-rol="correo-sesion"]')).toContainText('@');
    await page.setViewportSize({ width: 390, height: 844 });

    // Los montos llevan data-rol y los de un botón usan cifras tabulares (CA-E6-21)
    for (const ruta of await rutasDeB10(page)) {
      await abrir(page, ruta);
      const incumplen = await page.evaluate(() =>
        [...document.querySelectorAll('[data-centavos]')].flatMap((m) => {
          const sinRol = (m.getAttribute('data-rol') ?? '') === '';
          const enBoton = m.closest('button, [role="button"]') !== null;
          const tabular = getComputedStyle(m).fontVariantNumeric.includes('tabular-nums');
          return sinRol || (enBoton && !tabular) ? [m.outerHTML.slice(0, 80)] : [];
        }),
      );
      expect(incumplen, ruta).toEqual([]);
    }
  });

  test('PRU-E2E-PWA-793 [CA-E4-24] con prefers-reduced-motion ninguna animación ni transición queda activa en las pantallas y los flujos de B10', async ({
    page,
  }) => {
    await alinearRelojes(page, AHORA_A7);
    await sembrarA7();
    await page.emulateMedia({ reducedMotion: 'reduce' });
    for (const ruta of await rutasDeB10(page)) {
      await abrir(page, ruta);
      const animados = await page.evaluate(() => {
        const dura = (v: string): boolean => /[1-9]/.test(v); // «0s, 0s» no dura; «.15s» sí
        const porEstilo = [...document.querySelectorAll('*')].flatMap((n) => {
          const e = getComputedStyle(n);
          return e.animationName !== 'none' || dura(e.transitionDuration)
            ? [`${n.tagName.toLowerCase()} ${e.animationName} ${e.transitionDuration}`]
            : [];
        });
        const vivas = document
          .getAnimations()
          .filter((a) => a.playState === 'running')
          .map((a) => a.id || a.constructor.name);
        return [...porEstilo, ...vivas];
      });
      expect(animados, ruta).toEqual([]);
    }
  });
});

// ── PRU-E2E-BAND-791: recorrido 4.2 hasta el paso 3, insignia y cifras del motor ───────────────────────────────────────────

const BASE_CAPTURAS =
  process.env['FINN_CAPTURAS'] ?? (process.platform === 'win32' ? 'C:/finn/capturas/TA-597' : '');
const MODOS = [
  { nombre: 'telefono-claro', ancho: 390, alto: 844, tema: 'light', insignia: true },
  { nombre: 'telefono-oscuro', ancho: 390, alto: 844, tema: 'dark', insignia: false },
  { nombre: 'computadora-claro', ancho: 1440, alto: 900, tema: 'light', insignia: true },
  { nombre: 'computadora-oscuro', ancho: 1440, alto: 900, tema: 'dark', insignia: false },
] as const;

/** SEM-A7 antes del paso 3 de 4.2: SUPER SELECTOS no existe todavía, y Visa Oro tiene los últimos 4 dígitos de los SMS (como `un-dia-tipico`). */
async function sembrarA7ConRegla(): Promise<void> {
  const { escenarioA7 } = await import('../../../../packages/aplicacion/test/escenarios/a7.ts');
  const completo = escenarioA7();
  const estadoInicial = (completo.estadoInicial ?? [])
    .filter((op) => !(op.op === 'OP-20' && op.etiqueta === 'super-selectos'))
    .map((op): Op =>
      op.op === 'OP-01' && op.cuenta === 'Visa Oro' ? { ...op, ultimos4: '1234' } : op,
    );
  const escenario: Escenario = {
    ...completo,
    id: 'SEM-REC-4.2-E4',
    refs: ['REC-4.2'],
    estadoInicial,
  };
  const { ejecutorInt, copiarEstadoA, idDeCategoria } =
    await import('../../../../packages/aplicacion/test/escenarios/int.ts');
  const { confirmar } = await import('../../../../packages/aplicacion/src/operaciones/marco.ts');
  const { OP41 } = await import('../../../../packages/aplicacion/src/operaciones/bandeja/index.ts');
  const s = await ejecutorInt.iniciar(escenario, HOY_A7);
  const regla = await confirmar(
    OP41 as never,
    {
      accion: 'crear',
      id: 'c0ffee00-0000-4000-8000-000000000042',
      patron: 'SELECTOS',
      categoriaId: await idDeCategoria(s, 'Supermercado'),
    },
    {
      memoria: s.memoria,
      escribir: s.tx.escribir,
      leer: s.tx.leer,
      escribirTecnico: s.tx.escribirTecnico,
      opciones: () => ({ reloj: { hoy: HOY_A7, desfaseMs: 0 } }),
    },
  );
  expect(regla.ok, JSON.stringify(regla)).toBe(true);
  await copiarEstadoA(s, BASE_E2E);
  await ejecutorInt.terminar(s);
}

test.describe('PRU-E2E-BAND cierre de B10', () => {
  test.describe.configure({ timeout: 420_000 });
  test.beforeEach(async ({ context, baseURL }) => {
    await entrarAal2(context, baseURL ?? '');
  });

  test('PRU-E2E-BAND-791 [CA-C-1, CA-C-2] con la semilla y el recorrido 4.2 la insignia sube en uno con el SMS del paso 1 y vuelve al valor de partida con el paso 3, igual en todas las pantallas, y las cifras de cada pantalla son las del motor y coinciden entre sí', async ({
    page,
    request,
  }) => {
    await alinearRelojes(page, AHORA_A7);
    await sembrarA7ConRegla();

    const medidas: Record<string, unknown> = {};
    const textos: Record<string, string> = {};
    const captura = async (modo: (typeof MODOS)[number], nombre: string): Promise<void> => {
      if (BASE_CAPTURAS === '') return;
      const carpeta = `${BASE_CAPTURAS}/${modo.nombre}`;
      mkdirSync(carpeta, { recursive: true });
      await page.screenshot({ path: `${carpeta}/${nombre}.png`, fullPage: false });
    };
    const insignia = (n: number) =>
      page.getByRole('link', { name: navegacion.bandeja(n), exact: true });
    const centavos = async (selector: string): Promise<number> =>
      Number(await page.locator(selector).first().getAttribute('data-centavos'));
    const enModo = async (modo: (typeof MODOS)[number]): Promise<void> => {
      await page.setViewportSize({ width: modo.ancho, height: modo.alto });
      await page.emulateMedia({ colorScheme: modo.tema, reducedMotion: 'no-preference' });
    };
    const restaurantes = async (): Promise<string> => {
      await abrir(page, '/presupuesto');
      return (await fila(page, 'Restaurantes').getAttribute('data-fila-categoria')) ?? '';
    };
    const idCorriente = async (): Promise<string> => {
      await abrir(page, '/cuentas');
      return (
        (
          (await page
            .locator('a[href^="/cuentas/"]')
            .filter({ hasText: 'Cuenta corriente' })
            .first()
            .getAttribute('href')) ?? ''
        ).split('?')[0] ?? ''
      );
    };
    /** Todas las pantallas de CA-C-1 y CA-C-2; el número de la insignia se comprueba en cada una. */
    const idRestaurantes = await restaurantes();
    const pantallas = (): [string, string][] => {
      const rest = idRestaurantes;
      return [
        ['inicio', '/'],
        ['presupuesto', '/presupuesto'],
        ['detalle-restaurantes', `/presupuesto/categorias/${rest}`],
        ['registrar-gasto', '/registrar/gasto'],
        ['cuentas', '/cuentas'],
        ['actividad', '/actividad'],
        ['gasto-semanal', '/reportes/gasto-semanal'],
        ['bandeja', '/bandeja'],
        ['ajustes', '/ajustes'],
      ];
    };

    // Estado de partida (antes de recibir el SMS del paso 1)
    await abrir(page, '/bandeja');
    const base = Number(
      /(\d+) por revisar/.exec(
        (await page
          .getByRole('link', { name: /^Bandeja/ })
          .first()
          .getAttribute('aria-label')) ?? '',
      )?.[1] ?? 0,
    );
    // CH-240 d / DATOS-EJEMPLO §1 dicen 3 y 2; la semilla da `base` antes del paso 1 (se informa, no se ajusta)
    medidas['insigniaAntesDelPaso1'] = base;

    // Paso 0 y 1: el token de FT-03 y el SMS de SUPER SELECTOS llegan a la Bandeja
    await abrir(page, '/ajustes/webhook');
    await generarTokenWebhook(page);
    const token = ((await page.getByTestId('token').textContent()) ?? '').trim();
    const respuesta = await request.post('/api/sms', {
      headers: { authorization: `Bearer ${token}` },
      data: {
        texto:
          'VISA 1234: has realizado una compra por USD 35.00 en el comercio SUPER SELECTOS 2026/10/15',
        remitente: 'BAC',
      },
    });
    expect(respuesta.status()).toBe(200);
    await expect(async () => {
      await abrir(page, '/bandeja');
      await expect(
        page.locator('[data-movimiento]').filter({ hasText: 'SUPER SELECTOS' }),
      ).toHaveCount(1);
    }).toPass();

    // Después del paso 1: uno más por revisar en la insignia de todas las pantallas; la Bandeja y Revisar se capturan en este momento
    const idRevisar = `/bandeja/${
      (await page
        .locator('[data-movimiento]')
        .filter({ hasText: 'SUPER SELECTOS' })
        .first()
        .getAttribute('data-movimiento')) ?? ''
    }`;
    for (const modo of MODOS) {
      await enModo(modo);
      for (const [nombre, ruta] of pantallas()) {
        await abrir(page, ruta);
        // Registrar gasto es un flujo: no lleva barra inferior ni campana (PROMPT-DESARROLLO §3), así que no tiene insignia
        if (nombre !== 'registrar-gasto' && modo.insignia)
          await expect(insignia(base + 1), `paso 1, ${nombre}, ${modo.nombre}`).toBeVisible();
        if (nombre === 'bandeja') await captura(modo, 'bandeja');
      }
      await abrir(page, idRevisar);
      // Revisar movimiento es un flujo (sin barras del marco): solo se captura
      await captura(modo, 'revisar-movimiento');
    }

    // Paso 3: «Aprobar» SUPER SELECTOS desde la lista; después, 2 por revisar en todas las pantallas
    await enModo(MODOS[0]);
    await abrir(page, '/bandeja');
    await page
      .locator('[data-movimiento]')
      .filter({ hasText: 'SUPER SELECTOS' })
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toContainText('SUPER SELECTOS');
    for (const modo of MODOS) {
      await enModo(modo);
      for (const [nombre, ruta] of pantallas()) {
        await abrir(page, ruta);
        if (nombre !== 'registrar-gasto' && modo.insignia)
          await expect(insignia(base), `paso 3, ${nombre}, ${modo.nombre}`).toBeVisible();
        if (nombre !== 'bandeja') await captura(modo, nombre);
        if (modo === MODOS[0]) textos[nombre] = await page.locator('main').first().innerText();
      }
    }

    // Las cifras son las del motor: la misma en cada pantalla que la muestra (PF-3), sin copiarla de los documentos
    await enModo(MODOS[0]);
    await abrir(page, '/');
    const lpaInicio = await centavos('[data-resumen-lpa="billete"] [data-centavos]');
    await abrir(page, '/presupuesto');
    const lpaPresupuesto = await centavos('[data-resumen-lpa] [data-centavos]');
    expect(lpaPresupuesto).toBe(lpaInicio);
    await abrir(page, '/presupuesto/listo-para-asignar');
    const lpaDetalle = await centavos('[data-centavos]');
    medidas['listoParaAsignar'] = {
      inicio: lpaInicio,
      presupuesto: lpaPresupuesto,
      detalle: lpaDetalle,
    };
    await abrir(page, '/presupuesto');
    const disponibleRest = await centavos(
      '[data-fila-categoria]:has-text("Restaurantes") [data-centavos]',
    );
    medidas['restaurantesDisponible'] = disponibleRest;
    await abrir(page, `/presupuesto/categorias/${idRestaurantes}`);
    const enDetalle = await page
      .locator('[data-centavos]')
      .evaluateAll((l) => l.map((e) => Number(e.getAttribute('data-centavos'))));
    expect(enDetalle).toContain(disponibleRest);
    await abrir(page, await idCorriente());
    medidas['cuentaCorriente'] = await page
      .locator('[data-centavos]')
      .evaluateAll((l) => l.slice(0, 3).map((e) => Number(e.getAttribute('data-centavos'))));
    // La salida de la prueba es la lista de números que da la semilla; el informe la compara con las referencias (CH-240 d)
    console.log(`CIERRE-B10 cifras del motor: ${JSON.stringify(medidas)}`);
    console.log(`CIERRE-B10 textos por pantalla: ${JSON.stringify(textos)}`);
  });
});

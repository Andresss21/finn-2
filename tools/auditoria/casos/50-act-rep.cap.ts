// Auditoría de diseño · sección ACT (Actividad, detalle de transacción y sus flujos) y REP (Reportes).
// Los casos de solo lectura comparten semilla (A.7 pura, A.7 + extras de transacciones, y las de los reportes). Los que escriben
// (devolver, eliminar, eliminar evento, estado, editar con conflicto y con cuenta archivada) van al final, cada uno con su siembra.
import {
  caso,
  capturar,
  entrar,
  escenarioA7,
  expect,
  quieta,
  sembrarEscenario,
  sembrarOps,
  test,
  type Escenario,
  type Op,
  type Page,
} from '../lib.ts';
import { registrarGasto as g } from '../../../apps/web/src/textos/registrar-gasto.ts';

const HOY = '2026-10-15';
const E2 = '02-referencias/entrega-2/pantallas';
const E1 = '02-referencias/entrega-1/pantallas';
const ACTR = `${E2}/02-actividad`;
const DET = `${E2}/03-detalle-de-transaccion`;
const REP = `${E2}/04-reportes`;
const SEM = `${E2}/D2-gasto-semanal-paleta-validada`;
const APP = 'apps/web/src/app/(finn)';
const FLU = 'apps/web/src/flujos';
const CC = 'Cuenta corriente';
const VISA = 'Visa Oro';

// ── Semillas ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const a7 = escenarioA7();
const A7 = { escenario: a7, hoyServidor: HOY, soloLectura: true } as const;

/** A.7 más las transacciones que el detalle necesita y A.7 no trae: dividida, devolución parcial y total, cobro y conciliada. */
const EXTRAS: Op[] = [
  {
    op: 'OP-20',
    cuenta: CC,
    monto: 60,
    lineas: [
      { categoria: 'Supermercado', monto: 45 },
      { categoria: 'Farmacia', monto: 15 },
    ],
    fecha: '2026-10-14',
    etiqueta: 'dividida',
    hoy: HOY,
  },
  {
    op: 'OP-20',
    cuenta: VISA,
    categoria: 'Supermercado',
    monto: 50,
    fecha: '2026-10-13',
    etiqueta: 'dev1',
    hoy: HOY,
  },
  { op: 'OP-33', compra: 'dev1', monto: 20, fecha: '2026-10-14', hoy: HOY },
  {
    op: 'OP-20',
    cuenta: VISA,
    categoria: 'Restaurantes',
    monto: 25,
    fecha: '2026-10-12',
    etiqueta: 'dev2',
    hoy: HOY,
  },
  { op: 'OP-33', compra: 'dev2', monto: 25, fecha: '2026-10-13', hoy: HOY },
  {
    op: 'OP-20',
    cuenta: CC,
    monto: 35.5,
    lineas: [{ deudor: 'Ana', monto: 35.5 }],
    fecha: '2026-10-09',
    etiqueta: 'cobro1',
    hoy: HOY,
  },
  { op: 'OP-31', cobro: 'cobro1', cuenta: CC, monto: 10, fecha: '2026-10-14', hoy: HOY },
  {
    op: 'OP-20',
    cuenta: CC,
    categoria: 'Restaurantes',
    monto: 33.33,
    fecha: '2026-10-08',
    etiqueta: 'conc1',
    hoy: HOY,
  },
  {
    op: 'OP-47',
    cuenta: CC,
    fecha: '2026-10-15',
    saldo: 1000,
    movimientos: [{ indice: 1, fecha: '2026-10-08', monto: -33.33 }],
    coincidencias: [{ etiqueta: 'conc1', indice: 1 }],
    hoy: HOY,
  },
];
const escenarioAct = (id: string, extra: Op[] = []): Escenario => ({
  ...a7,
  id,
  estadoInicial: [...(a7.estadoInicial ?? []), ...EXTRAS, ...extra],
});
const ACT = { escenario: escenarioAct('SEM-A7-ACT'), hoyServidor: HOY, soloLectura: true } as const;

// ── Ayudas ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const filas = (page: Page) => page.locator('[data-fila-transaccion]');
const meta = (ruta: string, comp: string, ref: string, nota?: string) => ({
  ruta,
  comp,
  ref,
  ...(nota === undefined ? {} : { nota }),
});

async function abrirDetalle(page: Page, ...textos: string[]): Promise<void> {
  await page.goto('/actividad');
  await quieta(page);
  let f = filas(page);
  for (const t of textos) f = f.filter({ hasText: t });
  await f.first().click();
  await expect(page.getByRole('link', { name: 'Editar' })).toBeVisible();
  await quieta(page);
}
const idActual = (page: Page): string => new URL(page.url()).pathname.split('/')[2] ?? '';
async function masAcciones(page: Page, item: string | RegExp): Promise<void> {
  await page.getByRole('button', { name: 'Más acciones' }).first().click();
  await page.getByRole('menuitem', { name: item }).click();
  await page.waitForLoadState('networkidle').catch(() => undefined);
  await quieta(page);
}
/** Detalle de la fila con `texto` y luego una ruta hija (devolver, editar…). */
const detalleYa =
  (...textos: string[]) =>
  async (page: Page) => {
    await abrirDetalle(page, ...textos);
  };

// ═══ Actividad ══════════════════════════════════════════════════════════════════════════════════════════════════════════
const ACTIV = { ruta: '/actividad', comp: `${APP}/actividad/pantalla.tsx` } as const;
caso({ id: 'actividad__lista', ...ACTIV, ref: `${ACTR}/lista`, ...A7 });
caso({
  id: 'actividad__buscando',
  ...ACTIV,
  comp: `${APP}/actividad/buscador.tsx`,
  ref: `${ACTR}/buscando`,
  ...A7,
  pasos: async (page) => {
    await page.getByLabel('Buscar').pressSequentially('super');
    await expect(page).toHaveURL(/texto=super/);
    await quieta(page);
  },
});
caso({
  id: 'actividad__filtros-abiertos',
  ...ACTIV,
  comp: `${APP}/actividad/filtros.tsx`,
  ref: `${ACTR}/filtros`,
  nota: 'Teléfono: hoja de filtros; computadora: columna fija de 260 px (ya abierta).',
  ...A7,
  pasos: async (page) => {
    const abrir = page
      .locator('summary')
      .filter({ hasText: /^Filtros/ })
      .first();
    if (
      (await abrir.isVisible().catch(() => false)) &&
      (await page.locator('details[open]').count()) === 0
    )
      await abrir.click();
    await expect(page.getByRole('button', { name: 'Filtrar' })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'actividad__filtrado',
  ...ACTIV,
  comp: `${APP}/actividad/chips.tsx`,
  ref: `${ACTR}/filtrado`,
  ...A7,
  url: '/actividad?tipo=gasto&desde=2026-09-22&hasta=2026-10-21',
});
caso({
  id: 'actividad__sin-resultados',
  ...ACTIV,
  ref: `${ACTR}/sin-resultados`,
  ...A7,
  url: '/actividad?texto=zzzz',
});
caso({
  id: 'actividad__vacio',
  ...ACTIV,
  ref: `${ACTR}/vacio`,
  ops: [{ op: 'OP-01', cuenta: CC, apertura: HOY }],
  hoy: HOY,
  soloLectura: true,
});
test('actividad__cargando', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(a7, HOY);
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  await page.route(/\/actividad(\?|$)/, async (route) => {
    const h = route.request().headers();
    if (
      h['rsc'] === undefined ||
      h['next-router-prefetch'] !== undefined ||
      h['next-router-segment-prefetch'] !== undefined
    )
      return route.continue();
    await new Promise((r) => setTimeout(r, 12_000));
    return route.continue().catch(() => undefined);
  });
  await page.getByRole('link', { name: 'Actividad', exact: true }).first().click();
  await expect(page.locator('[aria-busy="true"]').first()).toBeVisible({ timeout: 8000 });
  await capturar(
    page,
    info,
    'actividad__cargando',
    meta('/actividad', `${APP}/actividad/loading.tsx`, `${ACTR}/cargando`),
    { carga: true },
  );
});

// "Cargar más" con un período cerrado: 60 transacciones de períodos anteriores y la fecha de hoy un año después.
const MUCHAS: Op[] = [
  { op: 'OP-01', cuenta: CC, saldo: 5000, apertura: '2026-01-01' },
  { op: 'OP-07', categoria: 'Supermercado' },
  ...Array.from({ length: 60 }, (_, i): Op => ({
    op: 'OP-20',
    cuenta: CC,
    categoria: 'Supermercado',
    monto: 10 + i,
    fecha: `2026-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
    hoy: `2026-${String(1 + Math.floor(i / 28)).padStart(2, '0')}-${String(1 + (i % 28)).padStart(2, '0')}`,
  })),
];
caso({
  id: 'actividad__cargar-mas',
  ...ACTIV,
  ref: `${ACTR}/cargar-mas`,
  nota: '60 transacciones de períodos cerrados; se baja hasta «Cargar más».',
  ops: MUCHAS,
  hoy: '2026-03-10',
  hoyServidor: '2026-03-10',
  soloLectura: true,
  pasos: async (page) => {
    await expect(page.getByRole('link', { name: 'Cargar más' })).toBeVisible();
  },
});

// ═══ Detalle de transacción (lectura) ═══════════════════════════════════════════════════════════════════════════════════
const DETC = {
  ruta: '/actividad/[transaccionId]',
  comp: `${APP}/actividad/[transaccionId]/pantalla.tsx`,
} as const;
caso({
  id: 'transaccion__principal',
  ...DETC,
  ref: `${DET}/principal`,
  ...ACT,
  pasos: detalleYa('$35.00', 'Supermercado'),
});
caso({
  id: 'transaccion__dividida',
  ...DETC,
  ref: `${DET}/principal`,
  nota: 'Sin referencia propia: la más cercana es «principal» (PANTALLAS §2.18, partes).',
  ...ACT,
  pasos: detalleYa('$60.00'),
});
caso({
  id: 'transaccion__por-cobrar',
  ...DETC,
  ref: `${DET}/principal`,
  nota: 'Compra CINEMARK con por cobrar a Carlos.',
  ...ACT,
  pasos: detalleYa('$40.00'),
});
caso({
  id: 'transaccion__por-cobrar-con-cobro',
  ...DETC,
  ref: `${DET}/principal`,
  nota: 'Por cobrar con un cobro registrado (evento «Cobrado» con «Eliminar»).',
  ...ACT,
  pasos: detalleYa('$35.50'),
});
caso({
  id: 'transaccion__pendiente',
  ...DETC,
  ref: `${DET}/principal`,
  nota: 'FARMACIA del 11/10, aún no confirmada por el banco.',
  ...ACT,
  pasos: detalleYa('$12.35'),
});
caso({
  id: 'transaccion__conciliada',
  ...DETC,
  ref: `${DET}/conciliada`,
  ...ACT,
  pasos: detalleYa('$33.33'),
});
caso({
  id: 'transaccion__con-devolucion',
  ...DETC,
  ref: `${DET}/principal`,
  nota: 'Compra con una devolución parcial: evento «Devuelto».',
  ...ACT,
  pasos: detalleYa('$50.00', 'Supermercado'),
});
caso({
  id: 'transaccion__mas-acciones',
  ...DETC,
  comp: 'apps/web/src/componentes/marco/mas-acciones.tsx',
  ref: `${DET}/mas-acciones`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$35.00', 'Supermercado');
    await page.getByRole('button', { name: 'Más acciones' }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();
  },
});
caso({
  id: 'transaccion__no-encontrada',
  ...DETC,
  comp: `${APP}/not-found.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/no-encontrado`,
  ...ACT,
  url: '/actividad/00000000-0000-4000-8000-0000000000ff',
});

// ═══ Flujos de una transacción (lectura: se abren, no se confirman) ═════════════════════════════════════════════════════
caso({
  id: 'transaccion-editar__principal',
  ruta: '/actividad/[transaccionId]/editar',
  comp: `${FLU}/actividad-editar/formulario.tsx`,
  ref: `${DET}/editar`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$35.00', 'Supermercado');
    await page.getByRole('link', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Editar transacción' })).toBeVisible();
  },
});
caso({
  id: 'transaccion-editar__dividida',
  ruta: '/actividad/[transaccionId]/editar',
  comp: `${FLU}/actividad-editar/formulario.tsx`,
  ref: `${DET}/editar`,
  nota: 'Editar una compra dividida en dos partes.',
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$60.00');
    await page.getByRole('link', { name: 'Editar' }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Editar transacción' })).toBeVisible();
  },
});
caso({
  id: 'transaccion-editar__con-devolucion',
  ruta: '/actividad/[transaccionId]/editar',
  comp: `${FLU}/actividad-editar/formulario.tsx`,
  ref: `${DET}/editar`,
  nota: 'Cuenta fija en solo lectura por la devolución (CB-30).',
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$50.00', 'Supermercado');
    await page.getByRole('link', { name: 'Editar' }).click();
    await expect(page.locator('[data-cuenta-fija]')).toBeVisible();
  },
});
caso({
  id: 'transaccion-editar__revisar-impacto',
  ruta: '/actividad/[transaccionId]/editar',
  comp: 'apps/web/src/componentes/formularios/confirmacion-impacto.tsx',
  ref: 'SIN DISEÑO',
  nota: 'Revisar el impacto (AV-16) al cambiar el monto de una compra conciliada.',
  ...ACT,
  soloLectura: true,
  pasos: async (page) => {
    await abrirDetalle(page, '$33.33');
    await page.getByRole('link', { name: 'Editar' }).click();
    await page.getByRole('textbox', { name: g.total, exact: true }).fill('40');
    await page.getByRole('button', { name: 'Guardar cambios' }).click();
    await expect(page.getByRole('button', { name: 'Confirmar' })).toBeVisible();
  },
});
caso({
  id: 'transaccion-devolver__principal',
  ruta: '/actividad/[transaccionId]/devolver',
  comp: `${FLU}/actividad-devolver/formulario.tsx`,
  ref: `${DET}/devolver`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$30.00', 'Gasolina');
    await masAcciones(page, 'Registrar devolución');
    await expect(
      page.getByRole('heading', { level: 1, name: 'Registrar devolución' }),
    ).toBeVisible();
  },
});
caso({
  id: 'transaccion-devolver__dividida',
  ruta: '/actividad/[transaccionId]/devolver',
  comp: `${FLU}/actividad-devolver/formulario.tsx`,
  ref: `${DET}/devolver`,
  nota: 'Reparto entre las partes de una compra dividida.',
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$60.00');
    await masAcciones(page, 'Registrar devolución');
    await expect(
      page.getByRole('heading', { level: 2, name: 'Reparto entre las partes' }),
    ).toBeVisible();
  },
});
caso({
  id: 'transaccion-devolver__excede',
  ruta: '/actividad/[transaccionId]/devolver',
  comp: `${FLU}/actividad-devolver/formulario.tsx`,
  ref: `${DET}/devolver-excede`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$30.00', 'Gasolina');
    await masAcciones(page, 'Registrar devolución');
    await page.getByRole('textbox', { name: 'Monto devuelto', exact: true }).fill('99');
    await page.getByRole('button', { name: /^Registrar devolución/ }).click();
    await page.waitForTimeout(800);
  },
});
caso({
  id: 'transaccion-devolver__sin-capacidad',
  ruta: '/actividad/[transaccionId]/devolver',
  comp: `${FLU}/actividad-devolver/sin-capacidad.tsx`,
  ref: `${DET}/devolver-sin-capacidad`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$25.00', 'Con devoluciones');
    await page.goto(`/actividad/${idActual(page)}/devolver`);
    await quieta(page);
    console.log(
      'SINCAP',
      page.url(),
      (await page.locator('main').innerText())
        .slice(0, 300)
        .split(String.fromCharCode(10))
        .join(' | '),
    );
    await expect(page.locator('[data-sin-capacidad]')).toBeVisible();
  },
});
caso({
  id: 'transaccion-estado__principal',
  ruta: '/actividad/[transaccionId]/estado',
  comp: `${FLU}/actividad-estado/formulario.tsx`,
  ref: `${DET}/cambiar-estado`,
  nota: 'Pendiente → confirmada (FARMACIA).',
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$12.35');
    await masAcciones(page, /^Marcar como/);
  },
});
caso({
  id: 'transaccion-estado__confirmada',
  ruta: '/actividad/[transaccionId]/estado',
  comp: `${FLU}/actividad-estado/formulario.tsx`,
  ref: `${DET}/cambiar-estado`,
  nota: 'Confirmada → pendiente.',
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$35.00', 'Supermercado');
    await masAcciones(page, /^Marcar como/);
  },
});
caso({
  id: 'transaccion-eliminar__principal',
  ruta: '/actividad/[transaccionId]/eliminar',
  comp: `${FLU}/actividad-eliminar/formulario.tsx`,
  ref: `${DET}/eliminar`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$35.00', 'Supermercado');
    await masAcciones(page, 'Eliminar');
  },
});
caso({
  id: 'transaccion-eliminar__bloqueado',
  ruta: '/actividad/[transaccionId]/eliminar',
  comp: `${FLU}/actividad-eliminar/formulario.tsx`,
  ref: `${DET}/eliminar-bloqueado`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$35.50');
    await masAcciones(page, 'Eliminar');
  },
});
caso({
  id: 'transaccion-eliminar-evento__principal',
  ruta: '/actividad/[transaccionId]/eventos/eliminar',
  comp: `${FLU}/actividad-eventos-eliminar/lector.tsx`,
  ref: `${DET}/eliminar-evento`,
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$50.00', 'Supermercado');
    await page.getByRole('link', { name: /^Eliminar devuelto/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Eliminar evento' })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'transaccion-eliminar-evento__cobro',
  ruta: '/actividad/[transaccionId]/eventos/eliminar',
  comp: `${FLU}/actividad-eventos-eliminar/lector.tsx`,
  ref: `${DET}/eliminar-evento`,
  nota: 'Eliminar un cobro (la referencia es de una devolución).',
  ...ACT,
  pasos: async (page) => {
    await abrirDetalle(page, '$35.50');
    await page.getByRole('link', { name: /^Eliminar cobrado/ }).click();
    await expect(page.getByRole('heading', { level: 1, name: 'Eliminar evento' })).toBeVisible();
    await quieta(page);
  },
});

// ═══ Flujos que escriben ════════════════════════════════════════════════════════════════════════════════════════════════
test('act-escribe__editar-conflicto-y-archivada', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(
    escenarioAct('SEM-A7-ACT-W1', [
      { op: 'OP-01', cuenta: 'Cuenta vieja', saldo: 0, apertura: HOY, hoy: HOY },
      { op: 'OP-21', cuenta: 'Cuenta vieja', monto: 50, fecha: HOY, etiqueta: 'v-in', hoy: HOY },
      {
        op: 'OP-20',
        cuenta: 'Cuenta vieja',
        categoria: 'Farmacia',
        monto: 50,
        fecha: HOY,
        etiqueta: 'v-out',
        hoy: HOY,
      },
    ]),
    HOY,
  );
  await entrar(context, baseURL);

  // Conflicto al guardar: otra pestaña edita la misma transacción
  const EDI = meta(
    '/actividad/[transaccionId]/editar',
    `${FLU}/actividad-editar/formulario.tsx`,
    `${DET}/editar-conflicto`,
  );
  await abrirDetalle(page, '$35.00', 'Supermercado');
  await page.getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar transacción' })).toBeVisible();
  const urlEdicion = page.url();
  const otra = await context.newPage();
  await otra.goto(urlEdicion);
  await quieta(otra);
  await otra.getByRole('textbox', { name: 'Comercio', exact: false }).first().fill('Tienda');
  await otra.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(otra.getByRole('heading', { level: 1, name: 'Editar transacción' })).toHaveCount(0, {
    timeout: 20_000,
  });
  await otra.close();
  await page.bringToFront();
  await page.getByRole('textbox', { name: 'Comercio', exact: false }).first().fill('Otro');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await expect(page.getByRole('button', { name: /valor actual/i })).toBeVisible({
    timeout: 20_000,
  });
  await capturar(page, info, 'transaccion-editar__conflicto', EDI);

  // Cuenta archivada: se archiva «Cuenta vieja» (saldo 0) y se edita su compra
  await page.goto('/cuentas');
  await quieta(page);
  const href = await page
    .locator('main a[href^="/cuentas/"]')
    .filter({ hasText: 'Cuenta vieja' })
    .first()
    .getAttribute('href');
  await page.goto(`${href}/archivar`);
  await quieta(page);
  await page.getByRole('button', { name: 'Archivar', exact: true }).click();
  await page.waitForURL(new RegExp(`${href}$`), { timeout: 20_000 });
  await abrirDetalle(page, '$50.00', 'Farmacia');
  await capturar(
    page,
    info,
    'transaccion__cuenta-archivada',
    meta(
      DETC.ruta,
      DETC.comp,
      `${DET}/editar-cuenta-archivada`,
      'Detalle de una compra de una cuenta archivada.',
    ),
  );
  await page.getByRole('link', { name: 'Editar' }).click();
  await expect(page.getByRole('heading', { level: 1, name: 'Editar transacción' })).toBeVisible();
  await capturar(
    page,
    info,
    'transaccion-editar__cuenta-archivada',
    meta(EDI.ruta, EDI.comp, `${DET}/editar-cuenta-archivada`),
  );
});

test('act-escribe__estado-devolver-eliminar', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(escenarioAct('SEM-A7-ACT-W2'), HOY);
  await entrar(context, baseURL);

  // Cambiar estado: resultado
  await abrirDetalle(page, '$12.35');
  await masAcciones(page, /^Marcar como/);
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('link', { name: 'Editar' })).toBeVisible({ timeout: 20_000 });
  await quieta(page);
  await capturar(
    page,
    info,
    'transaccion__confirmada-tras-cambiar-estado',
    meta(DETC.ruta, DETC.comp, `${DET}/principal`, 'Resultado de «Guardar» en Estado bancario.'),
  );

  // Devolver: resultado (vuelve al detalle con el evento)
  await abrirDetalle(page, '$30.00', 'Gasolina');
  await masAcciones(page, 'Registrar devolución');
  await page.getByRole('textbox', { name: 'Monto devuelto', exact: true }).fill('10');
  await page.getByRole('button', { name: /^Registrar devolución/ }).click();
  await expect(page.getByRole('heading', { name: 'Eventos' })).toBeVisible({ timeout: 20_000 });
  await quieta(page);
  await capturar(
    page,
    info,
    'transaccion__devolucion-registrada',
    meta(DETC.ruta, DETC.comp, `${DET}/principal`, 'Detalle tras registrar la devolución.'),
  );

  // Eliminar evento: revisar y resultado
  await page.getByRole('link', { name: /^Eliminar devuelto/ }).click();
  await page.getByRole('button', { name: 'Ver qué cambia' }).click();
  await expect(page.getByRole('button', { name: 'Eliminar evento' })).toBeVisible();
  await capturar(
    page,
    info,
    'transaccion-eliminar-evento__revisar',
    meta(
      '/actividad/[transaccionId]/eventos/eliminar',
      `${FLU}/actividad-eventos-eliminar/lector.tsx`,
      `${DET}/eliminar-evento`,
      'Paso de revisión del impacto.',
    ),
  );
  await page.getByRole('button', { name: 'Eliminar evento' }).click();
  await expect(page.getByRole('heading', { name: 'Eventos' })).toHaveCount(0, { timeout: 20_000 });
  await quieta(page);
  await capturar(
    page,
    info,
    'transaccion__evento-eliminado',
    meta(DETC.ruta, DETC.comp, `${DET}/principal`, 'Resultado de eliminar el evento.'),
  );

  // Eliminar: revisar y resultado en el lugar
  await abrirDetalle(page, '$88.60');
  await masAcciones(page, 'Eliminar');
  await page.getByRole('button', { name: 'Ver qué cambia' }).click();
  await expect(page.getByRole('button', { name: 'Eliminar', exact: true })).toBeVisible();
  await capturar(
    page,
    info,
    'transaccion-eliminar__revisar',
    meta(
      '/actividad/[transaccionId]/eliminar',
      `${FLU}/actividad-eliminar/formulario.tsx`,
      `${DET}/eliminar`,
      'Paso de revisión del impacto.',
    ),
  );
  await page.getByRole('button', { name: 'Eliminar', exact: true }).click();
  await expect(page).toHaveURL(/\/actividad(\?.*)?$/, { timeout: 20_000 });
  await quieta(page);
  await capturar(
    page,
    info,
    'actividad__eliminada',
    meta(
      '/actividad',
      `${APP}/actividad/pantalla.tsx`,
      `${DET}/eliminada`,
      'Resultado de eliminar.',
    ),
  );
});

// ═══ Reportes ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
const REPC = { ruta: '/reportes/[tipo]', comp: `${APP}/reportes/[tipo]/pantalla.tsx` } as const;
const rep = (
  id: string,
  tipo: string,
  ref: string,
  comp = REPC.comp,
  nota?: string,
  extra: Record<string, unknown> = {},
) =>
  caso({
    id,
    ruta: `/reportes/${tipo.split('?')[0]}`,
    comp,
    ref,
    ...(nota === undefined ? {} : { nota }),
    ...A7,
    url: `/reportes/${tipo}`,
    ...extra,
  });
const R = `${APP}/reportes/[tipo]`;

caso({
  id: 'reportes__indice',
  ruta: '/reportes',
  comp: `${APP}/reportes/page.tsx`,
  ref: `${REP}/tendencia`,
  nota: '/reportes redirige a /reportes/tendencia; el «índice» es el selector de tipos del propio reporte.',
  ...A7,
});
rep('reporte-tendencia__principal', 'tendencia', `${REP}/tendencia`);
rep('reporte-tendencia__tabla', 'tendencia', `${REP}/tendencia-tabla`, REPC.comp, undefined, {
  pasos: async (page: Page) => {
    const r = page.getByRole('radio', { name: 'Tabla', exact: true });
    if (await r.isVisible().catch(() => false)) await r.click();
    await quieta(page);
  },
});
rep('reporte-categorias__principal', 'categorias', `${REP}/categorias`, `${R}/vistas.tsx`);
rep(
  'reporte-ingresos-gastos__principal',
  'ingresos-gastos',
  `${REP}/ingresos-gastos`,
  `${R}/vistas.tsx`,
);
rep(
  'reporte-top-comercios__principal',
  'top-comercios',
  `${REP}/top-comercios`,
  `${R}/vistas-detalle.tsx`,
);
rep('reporte-hallazgos__principal', 'hallazgos', `${REP}/hallazgos`, `${R}/hallazgos.tsx`);
rep(
  'reporte-flujo-efectivo__principal',
  'flujo-efectivo',
  'SIN DISEÑO',
  `${R}/flujo.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-ritmo__principal',
  'ritmo',
  'SIN DISEÑO',
  `${R}/ritmo.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-realidad__principal',
  'realidad',
  'SIN DISEÑO',
  `${R}/realidad.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-tarjetas__principal',
  'tarjetas',
  'SIN DISEÑO',
  `${R}/tarjetas.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-remanente__principal',
  'remanente',
  'SIN DISEÑO',
  `${R}/vistas.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-cumplimiento__principal',
  'cumplimiento',
  'SIN DISEÑO',
  `${R}/vistas-detalle.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-patrimonio__principal',
  'patrimonio',
  'SIN DISEÑO',
  `${R}/vistas-detalle.tsx`,
  'FALTANTES: reportes-otros.',
);
rep(
  'reporte-gasto-semanal__a7',
  'gasto-semanal',
  `${SEM}/varias`,
  `${R}/vistas-semanal.tsx`,
  'Semilla A.7 (varias categorías con gasto).',
);
rep(
  'reporte-tendencia__ventana-3',
  'tendencia?ventana=ultimos-3',
  `${REP}/tendencia`,
  REPC.comp,
  'Ventana de 3 períodos.',
);
caso({
  id: 'reporte__no-encontrado',
  ...REPC,
  comp: `${APP}/not-found.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/no-encontrado`,
  ...A7,
  url: '/reportes/flujo-de-caja',
});
caso({
  id: 'reportes__selector-de-tipos',
  ...REPC,
  ref: `${REP}/tendencia`,
  nota: 'Selector de tipo de reporte y de ventana abierto, si existe como control desplegable.',
  ...A7,
  url: '/reportes/tendencia',
  pasos: async (page) => {
    const c = page.getByRole('button', { name: /tipo|reporte|ventana|período/i }).first();
    if (await c.isVisible().catch(() => false)) await c.click();
    await quieta(page);
  },
});

// Semillas propias de los reportes
const sembrada = (ops: Op[], hoyServidor: string, hoy = hoyServidor) =>
  ({ ops, hoy, hoyServidor, soloLectura: true }) as const;
const SUPERMERCADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-21', monto: 2000, fecha: '2027-04-21', hoy: '2027-04-21' },
  { op: 'OP-14', categoria: 'Supermercado', monto: 350, periodo: 'P4' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 92.4, categoria: 'Supermercado', fecha: '2027-04-22' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 71.15, categoria: 'Supermercado', fecha: '2027-04-29' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 88.6, categoria: 'Supermercado', fecha: '2027-05-06' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 35, categoria: 'Supermercado', fecha: '2027-05-13' },
];
const SEMANAL = { ruta: '/reportes/gasto-semanal', comp: `${R}/vistas-semanal.tsx` } as const;
caso({
  id: 'reporte-gasto-semanal__una',
  ...SEMANAL,
  ref: `${SEM}/una`,
  ...sembrada(SUPERMERCADO, '2027-05-15'),
});
caso({
  id: 'reporte-gasto-semanal__tabla',
  ...SEMANAL,
  ref: `${E1}/S7-Semanal__vista-de-tabla`,
  ...sembrada(SUPERMERCADO, '2027-05-15'),
  pasos: async (page) => {
    const r = page.getByRole('radio', { name: 'Tabla', exact: true });
    if (await r.isVisible().catch(() => false)) await r.click();
    await quieta(page);
  },
});
caso({
  id: 'reporte-gasto-semanal__varias',
  ...SEMANAL,
  ref: `${SEM}/varias`,
  ...sembrada(
    [
      ...SUPERMERCADO,
      { op: 'OP-07', categoria: 'Restaurantes' },
      { op: 'OP-14', categoria: 'Restaurantes', monto: 120, periodo: 'P4' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Restaurantes', fecha: '2027-04-24' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 55, categoria: 'Restaurantes', fecha: '2027-05-02' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 30, categoria: 'Restaurantes', fecha: '2027-05-11' },
      { op: 'OP-07', categoria: 'Gasolina' },
      { op: 'OP-14', categoria: 'Gasolina', monto: 80, periodo: 'P4' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 23, categoria: 'Gasolina', fecha: '2027-04-30' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 30, categoria: 'Gasolina', fecha: '2027-05-12' },
    ],
    '2027-05-15',
  ),
});
caso({
  id: 'reporte-gasto-semanal__asignado-negativo',
  ...SEMANAL,
  ref: `${E1}/S7-Semanal__asignado-negativo`,
  ...sembrada(
    [
      ...SUPERMERCADO.slice(0, 3),
      { op: 'OP-07', categoria: 'Ajuste' },
      { op: 'OP-14', categoria: 'Ajuste', monto: -20, periodo: 'P4' },
    ],
    '2027-05-15',
  ),
});
caso({
  id: 'reporte-gasto-semanal__categoria-nueva',
  ...SEMANAL,
  ref: `${E1}/S7-Semanal__categoria-nueva`,
  ...sembrada(SUPERMERCADO, '2027-05-15'),
  nota: 'Categoría nueva: la misma semilla de «una»; la marca «Categoría nueva» sale de la propia pantalla.',
});

const HORMIGA = '2027-03-05';
const CAFES = 'Cafés y antojos';
caso({
  id: 'reporte-hormiga__principal',
  ruta: '/reportes/hormiga',
  comp: `${R}/hormiga.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: reportes-otros.',
  ...sembrada(
    [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-07', categoria: CAFES },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-21', monto: 1000, fecha: '2027-02-22' },
      ...Array.from({ length: 12 }, (_, i): Op => ({
        op: 'OP-20',
        cuenta: 'Ahorro',
        monto: 5.34,
        categoria: CAFES,
        fecha: `2027-02-${String(22 + (i % 7)).padStart(2, '0')}`,
      })),
      { op: 'OP-20', cuenta: 'Ahorro', monto: 12, categoria: CAFES, fecha: '2027-03-01' },
      { op: 'OP-20', cuenta: 'Ahorro', monto: 25, categoria: 'Super', fecha: '2027-03-01' },
    ],
    HORMIGA,
  ),
});

const NETFLIX = (fecha: string): Op[] => [
  {
    op: 'OP-35',
    etiqueta: `netflix-${fecha}`,
    cuenta: 'T',
    monto: 15.49,
    comercio: 'NETFLIX',
    recibido: `${fecha}T10:00`,
    fecha,
    hoy: fecha,
  },
  {
    op: 'OP-37',
    etiqueta: `netflix-${fecha}`,
    categoria: 'Streaming',
    aprobado: `${fecha}T12:00`,
    hoy: fecha,
  },
];
const ing = (hoy: string): Op => ({ op: 'OP-21', monto: 10, hoy });
caso({
  id: 'reporte-suscripciones__principal',
  ruta: '/reportes/suscripciones',
  comp: `${R}/suscripciones.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: reportes-otros.',
  ...sembrada(
    [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
      { op: 'OP-07', categoria: 'Streaming' },
      { op: 'OP-21', monto: 1000 },
      ...NETFLIX('2027-02-17'),
      ing('2027-02-22'),
      ...NETFLIX('2027-03-17'),
      ing('2027-03-22'),
      ing('2027-04-22'),
      ...NETFLIX('2027-05-18'),
      ing('2027-05-22'),
    ],
    '2027-05-25',
    '2027-01-25',
  ),
});
caso({
  id: 'reporte-tarjetas__con-ciclos',
  ruta: '/reportes/tarjetas',
  comp: `${R}/tarjetas.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: reportes-otros. Con ciclos evaluados y «Reservar».',
  ...sembrada(
    [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-01', cuenta: 'Visa', tipo: 'tarjeta', saldo: 500, diaCorte: 15, diaPago: 5 },
      { op: 'OP-07', categoria: 'Super' },
      { op: 'OP-21', monto: 3000 },
      { op: 'OP-14', categoria: 'Pago Visa', monto: 420, periodo: 'P1' },
      {
        op: 'OP-23',
        tarjeta: 'Visa',
        monto: 300,
        origen: 'Ahorro',
        fecha: '2027-02-20',
        hoy: '2027-02-20',
      },
      {
        op: 'OP-33',
        monto: 50,
        categoria: 'Super',
        cuenta: 'Visa',
        fecha: '2027-02-25',
        hoy: '2027-02-25',
      },
      { op: 'OP-21', monto: 10, hoy: '2027-03-22' },
    ],
    '2027-03-25',
    '2027-01-25',
  ),
});
caso({
  id: 'reporte-hallazgos__vacio',
  ruta: '/reportes/hallazgos',
  comp: `${R}/hallazgos.tsx`,
  ref: `${REP}/hallazgos-vacio`,
  ...sembrada(
    [
      { op: 'OP-01', cuenta: 'Ahorro' },
      { op: 'OP-21', monto: 100 },
    ],
    '2027-03-05',
  ),
});
caso({
  id: 'reportes__sin-movimientos',
  ruta: '/reportes/tendencia',
  comp: REPC.comp,
  ref: `${REP}/sin-movimientos`,
  ...sembrada([{ op: 'OP-01', cuenta: 'Ahorro' }], '2027-03-05'),
  url: '/reportes/tendencia',
});
caso({
  id: 'reporte-gasto-semanal__sin-movimientos',
  ruta: '/reportes/gasto-semanal',
  comp: `${R}/vistas-semanal.tsx`,
  ref: `${REP}/sin-movimientos`,
  nota: 'Gasto semanal sin gasto en el período.',
  ...sembrada([{ op: 'OP-01', cuenta: 'Ahorro' }], '2027-03-05'),
});

test('reportes__cargando', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(a7, HOY);
  await entrar(context, baseURL);
  await page.goto('/reportes/tendencia');
  await quieta(page);
  await page.route(/\/reportes\/categorias(\?|$)/, async (route) => {
    const h = route.request().headers();
    if (
      h['rsc'] === undefined ||
      h['next-router-prefetch'] !== undefined ||
      h['next-router-segment-prefetch'] !== undefined
    )
      return route.continue();
    await new Promise((r) => setTimeout(r, 12_000));
    return route.continue().catch(() => undefined);
  });
  await page
    .locator('nav[aria-label="Reportes"] a, a[href="/reportes/categorias"]')
    .filter({ visible: true })
    .first()
    .click();
  await expect(page.locator('[aria-busy="true"]').first()).toBeVisible({ timeout: 8000 });
  await capturar(
    page,
    info,
    'reportes__cargando',
    meta(
      '/reportes/[tipo]',
      `${R}/loading.tsx`,
      `${REP}/tendencia`,
      'SIN DISEÑO del estado de carga de Reportes; el marco es el genérico.',
    ),
    { carga: true },
  );
});

void sembrarOps;

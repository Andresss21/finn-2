// Auditoría de diseño · sección CAT (detalle de categoría y sus flujos: más acciones, archivar, fusionar, sacar de archivada)
// y, de MAS, Metas (lista, nueva, editar). Semillas y pasos copiados de las E2E de FT-14, FT-17, FT-19, FT-20 y FT-29.
import {
  caso,
  capturar,
  entrar,
  escenarioA7,
  expect,
  quieta,
  sembrarOps,
  test,
  type Op,
  type Page,
} from '../lib.ts';

const HOY_A7 = '2026-10-15';
const S1 = '02-referencias/entrega-1/pantallas';
const E2 = '02-referencias/entrega-2/pantallas';
const APP = 'apps/web/src/app/(finn)';
const FLU = 'apps/web/src/flujos';
const DET = `${APP}/presupuesto/categorias/[categoriaId]/page.tsx`;
const RUTA_DET = '/presupuesto/categorias/[categoriaId]';

const A7 = { escenario: escenarioA7(), hoyServidor: HOY_A7, soloLectura: true } as const;

// ── Semillas (copiadas de las E2E) ──────────────────────────────────────────────────────────────────────────────────────
const SIN_GASTOS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
];
const ESC01_PASO3: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', saldo: 300 },
  { op: 'OP-14', categoria: 'Pago T', monto: 300, periodo: 'P1' },
];
const VISA_ORO_SIN_RESERVA: Op[] = [
  { op: 'OP-01', cuenta: 'Cuenta corriente', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-01', cuenta: 'Visa Oro', tipo: 'tarjeta', saldo: 300, diaCorte: 25, diaPago: 15 },
];
const PERIODO_CERRADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000, hoy: '2027-02-10' },
  { op: 'OP-14', categoria: 'Super', monto: 300, periodo: 'P1', hoy: '2027-02-10' },
  { op: 'OP-20', cuenta: 'T', monto: 400, categoria: 'Super', fecha: '2027-02-10', hoy: '2027-02-10' },
];
const ESC44_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 30, categoria: 'Gimnasio', fecha: '2027-02-02', hoy: '2027-02-02', etiqueta: 'gimnasio' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
  { op: 'OP-42', etiqueta: 'gimnasio', cuenta: 'Ahorro', comercio: 'Gimnasio', monto: 30, categoria: 'Gimnasio', primeraFecha: '2027-03-10' },
];
const ESC44_PASO2: Op[] = [
  { op: 'OP-07', categoria: 'Salidas' },
  ...ESC44_PASO0,
  { op: 'OP-09', categoria: 'Gimnasio', destino: 'LPA', devolverFuturas: true, desactivar: ['gimnasio'] },
  { op: 'OP-33', compra: 'gimnasio', monto: 25 },
];
const ESC42_PASO0: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Café' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-18', categoria: 'Café', monto: 50 },
  { op: 'OP-21', monto: 1000, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Café', monto: 50, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 80, categoria: 'Café', hoy: '2027-02-03' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 40, categoria: 'Salidas', hoy: '2027-02-04' },
];
const SOLO_CAFE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Café' },
];
const ESC38_PASO4B: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Laptop' },
  { op: 'OP-18', categoria: 'Laptop', monto: 600, tipo: 'para_fecha', fecha: '2027-05-15' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Laptop', monto: 150, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Laptop', monto: 150, hoy: '2027-02-21' },
  { op: 'OP-14', categoria: 'Laptop', monto: 100, hoy: '2027-04-21' },
];
const GAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-18', categoria: 'Gas', monto: 200, modo: 'rellenar_hasta' },
];
const SIN_METAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Viaje' },
  { op: 'OP-07', categoria: 'Gas' },
];
const ESC35_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gas' },
  { op: 'OP-07', categoria: 'Fondo' },
  { op: 'OP-07', categoria: 'Semanal' },
  { op: 'OP-18', categoria: 'Gas', monto: 200, modo: 'rellenar_hasta' },
  { op: 'OP-18', categoria: 'Fondo', monto: 200, modo: 'acumular' },
  { op: 'OP-18', categoria: 'Semanal', monto: 50, tipo: 'semanal', modo: 'acumular' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Gas', monto: 200, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Fondo', monto: 200, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 120, categoria: 'Gas' },
];

// ── Ayudas ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
/** El id de una categoría, tomado de su fila en `/presupuesto`. */
async function idDe(page: Page, nombre: string, sufijo = ''): Promise<string> {
  await page.goto(`/presupuesto${sufijo}`);
  await quieta(page);
  const id = await page
    .locator('[data-fila-categoria]')
    .filter({ has: page.getByText(nombre, { exact: true }) })
    .first()
    .getAttribute('data-fila-categoria');
  if (id === null) throw new Error(`no hay fila de «${nombre}»`);
  return id;
}
const urlDe = (nombre: string, cola = '') => async (page: Page) => `/presupuesto/categorias/${await idDe(page, nombre)}${cola}`;

interface Det {
  id: string;
  ref: string;
  nota?: string;
  nombre?: string;
  cola?: string;
  pasos?: (page: Page) => Promise<void>;
}
/** Un estado del detalle de categoría con la semilla de A.7. */
function det(d: Det, semilla: Record<string, unknown> = A7): void {
  caso({
    id: d.id,
    ruta: RUTA_DET,
    comp: DET,
    ref: d.ref,
    ...(d.nota === undefined ? {} : { nota: d.nota }),
    ...semilla,
    url: urlDe(d.nombre ?? 'Restaurantes', d.cola ?? ''),
    ...(d.pasos === undefined ? {} : { pasos: d.pasos }),
  });
}

/** Retiene la navegación de una ruta hasta soltar, y devuelve cómo soltarla. */
async function retener(page: Page, ruta: string): Promise<() => void> {
  let soltar: () => void = () => undefined;
  const espera = new Promise<void>((r) => (soltar = r));
  await page.route(
    (u) => u.pathname === ruta,
    async (r) => {
      if (r.request().headers()['rsc'] !== undefined) await espera;
      await r.continue();
    },
  );
  return soltar;
}

// ═══ DETALLE DE CATEGORÍA ═══════════════════════════════════════════════════════════════════════════════════════════════
det({ id: 'categoria__principal', ref: `${S1}/S3-Detalle`, nota: 'Restaurantes de A.7: sobregiro con débito −$26.30.' });
det({ id: 'categoria__con-meta', ref: `${S1}/S3-Detalle__con-meta`, nombre: 'Fondo de emergencia' });
det({ id: 'categoria__sobregiro-tarjeta', ref: `${S1}/S3-Detalle__sobregiro-con-tarjeta`, nombre: 'Gasolina' });
det({
  id: 'categoria__sin-movimientos',
  ref: `${S1}/S3-Detalle__sin-movimientos`,
  nombre: 'Viaje',
  nota: 'Viaje de A.7 (meta anual, sin asignar ni gastar este período); la referencia usa Internet y teléfono.',
});
det({
  id: 'categoria__historial-tabla',
  ref: `${S1}/S3-Detalle__historial-como-tabla`,
  pasos: async (page) => {
    // Selector Gráfico / Tabla = radiogroup; en computadora se oculta (la tabla va al lado, CH-112).
    const radio = page.getByRole('radio', { name: 'Tabla', exact: true }).filter({ visible: true });
    if (await radio.count()) await radio.first().click();
    await quieta(page);
  },
});
caso({
  id: 'categoria__sin-historial',
  ruta: RUTA_DET,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/historial.tsx`,
  ref: 'DECISIONES: «Sin períodos previos se muestra "Gráfico sin datos"» · PANTALLAS §2.19',
  nota: 'No hay PNG del estado «Gráfico sin datos» en S3; se compara con PANTALLAS §2.19.',
  ops: SIN_GASTOS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: urlDe('Super'),
});
caso({
  id: 'categoria__pago-tarjeta',
  ruta: RUTA_DET,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/pago.tsx`,
  ref: `${S1}/S3-Detalle__categoria-de-pago-de-tarjeta`,
  nota: 'Visa Oro con $300.00 de deuda sin reservar (CH-222), fecha de pago el 15.',
  ops: VISA_ORO_SIN_RESERVA,
  hoy: '2027-02-05',
  soloLectura: true,
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    const href = await page.locator('[data-fila-pago]').filter({ hasText: 'Visa Oro' }).getAttribute('href');
    if (href === null) throw new Error('sin fila de pago');
    return href;
  },
});
caso({
  id: 'categoria__pago-tarjeta-reservado',
  ruta: RUTA_DET,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/pago.tsx`,
  ref: `${S1}/S3-Detalle__categoria-de-pago-de-tarjeta`,
  nota: 'Todo reservado: el botón principal pasa a «Pagar la tarjeta» (DECISIONES).',
  ops: ESC01_PASO3,
  hoy: '2027-02-05',
  soloLectura: true,
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    const href = await page.locator('[data-fila-pago]').filter({ hasText: 'T' }).first().getAttribute('href');
    if (href === null) throw new Error('sin fila de pago');
    return href;
  },
});
caso({
  id: 'categoria__periodo-cerrado',
  ruta: RUTA_DET,
  comp: DET,
  ref: `${S1}/S3-Detalle`,
  nota: 'SIN DISEÑO de período cerrado en S3 (el cierre está en PANTALLAS §2.6 y §2.15). P1 cerrado con Super.',
  ops: PERIODO_CERRADO,
  hoy: '2027-02-21',
  soloLectura: true,
  url: async (page) => `/presupuesto/categorias/${await idDe(page, 'Super', '?periodo=2027-01-21')}?periodo=2027-01-21`,
});
caso({
  id: 'categoria__archivada',
  ruta: RUTA_DET,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/desarchivar.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: «archivadas» (FT-19). Gimnasio archivada con $25.00 (ESC-44).',
  ops: ESC44_PASO2,
  hoy: '2027-03-05',
  soloLectura: true,
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    const id = await page.locator('[data-archivada]').first().getAttribute('data-archivada');
    return `/presupuesto/categorias/${id}`;
  },
});
caso({
  id: 'categoria__no-encontrada',
  ruta: RUTA_DET,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/lector.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla`,
  ops: SIN_GASTOS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/presupuesto/categorias/00000000-0000-4000-8000-000000000001',
});

caso({
  id: 'categoria__cargando',
  ruta: RUTA_DET,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/loading.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/cargando`,
  nota: 'Proxy: la navegación retenida no logró mostrar el loading (la ruta responde antes); se captura /pruebas/estados/carga, que dibuja el mismo loading.tsx de (finn) que la categoría re-exporta.',
  ops: SIN_GASTOS,
  hoy: '2027-02-10',
  carga: true,
  url: '/pruebas/estados/carga',
});

// ── Más acciones ────────────────────────────────────────────────────────────────────────────────────────────────────────
const MA = `${E2}/MA-detalle-de-categoria-mas-acciones`;
const abrirMenu = async (page: Page) => {
  await page.getByRole('button', { name: 'Más acciones' }).click();
  await page.getByRole('menu').waitFor();
  await quieta(page);
};
det({ id: 'categoria-mas__cerrado', ref: `${MA}/cerrado`, nota: 'Menú cerrado (Restaurantes).' });
det({ id: 'categoria-mas__abierto', ref: `${MA}/abierto`, pasos: abrirMenu });
det({ id: 'categoria-mas__abierto-con-meta', ref: `${MA}/abierto-con-meta`, nombre: 'Fondo de emergencia', pasos: abrirMenu });
caso({
  id: 'categoria-mas__periodo-cerrado',
  ruta: RUTA_DET,
  comp: 'apps/web/src/componentes/marco/mas-acciones.tsx',
  ref: `${MA}/abierto`,
  nota: 'Menú abierto con el período cerrado: qué ítems quedan.',
  ops: PERIODO_CERRADO,
  hoy: '2027-02-21',
  soloLectura: true,
  url: async (page) => `/presupuesto/categorias/${await idDe(page, 'Super', '?periodo=2027-01-21')}?periodo=2027-01-21`,
  pasos: abrirMenu,
});
caso({
  id: 'categoria-mas__archivada',
  ruta: RUTA_DET,
  comp: 'apps/web/src/componentes/marco/mas-acciones.tsx',
  ref: `${MA}/abierto`,
  nota: 'Menú abierto de una categoría archivada.',
  ops: ESC44_PASO2,
  hoy: '2027-03-05',
  soloLectura: true,
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    return `/presupuesto/categorias/${await page.locator('[data-archivada]').first().getAttribute('data-archivada')}`;
  },
  pasos: abrirMenu,
});

// ═══ FLUJOS ═════════════════════════════════════════════════════════════════════════════════════════════════════════════
const idEn = async (page: Page, nombre: string) => idDe(page, nombre);

// Archivar (flujo largo)
const ARCH = `${E2}/07-flujos-del-presupuesto/archivar-categoria`;
const archComp = `${FLU}/presupuesto-categorias-archivar/formulario.tsx`;
caso({
  id: 'categoria-archivar__formulario',
  ruta: `${RUTA_DET}/archivar`,
  comp: archComp,
  ref: ARCH,
  nota: 'Gimnasio con $40.00, una asignación futura y una programada (ESC-44).',
  ops: ESC44_PASO0,
  hoy: '2027-03-05',
  soloLectura: true,
  url: urlDe('Gimnasio', '/archivar'),
});
caso({
  id: 'categoria-archivar__impacto',
  ruta: `${RUTA_DET}/archivar`,
  comp: archComp,
  ref: ARCH,
  nota: 'Paso «Revisá el impacto» antes de Confirmar (sin confirmar).',
  ops: ESC44_PASO0,
  hoy: '2027-03-05',
  soloLectura: true,
  url: urlDe('Gimnasio', '/archivar'),
  pasos: async (page) => {
    await page.getByLabel(/Programada Gimnasio/).selectOption({ label: 'Desactivarla' });
    await page.getByRole('button', { name: 'Archivar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Revisá el impacto' })).toBeVisible();
  },
});
caso({
  id: 'categoria-archivar__sin-pendientes',
  ruta: `${RUTA_DET}/archivar`,
  comp: archComp,
  ref: ARCH,
  nota: 'Categoría sin Disponible, sin futuras ni programadas (A.7: Viaje).',
  ...A7,
  url: urlDe('Viaje', '/archivar'),
});

// Sacar el dinero de una archivada (flujo corto: hoja / panel; la ruta directa es la página)
const SACAR = `${E2}/07-flujos-del-presupuesto/sacar-de-archivada`;
const sacComp = `${FLU}/presupuesto-categorias-sacar/formulario.tsx`;
test('categoria-sacar__hoja', async ({ page, context, baseURL }, info) => {
  await sembrarOps(ESC44_PASO2, '2027-03-05');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  await page.locator('[data-seccion="archivadas-con-dinero"]').getByRole('link', { name: 'Sacar el dinero de Gimnasio' }).click();
  await page.getByRole('dialog').waitFor();
  await capturar(page, info, 'categoria-sacar__hoja', { ruta: `${RUTA_DET}/sacar (interceptada)`, comp: sacComp, ref: SACAR });
  await page.getByLabel('Poner en').selectOption({ label: 'Salidas' });
  await page.getByLabel(/Monto a sacar/).fill('900');
  await page.getByRole('button', { name: 'Sacar', exact: true }).click();
  await page.waitForTimeout(800);
  await capturar(page, info, 'categoria-sacar__error-monto', { ruta: `${RUTA_DET}/sacar (interceptada)`, comp: sacComp, ref: SACAR, nota: 'Monto mayor que lo que tiene la archivada.' });
});
caso({
  id: 'categoria-sacar__pagina',
  ruta: `${RUTA_DET}/sacar`,
  comp: `${APP}/presupuesto/categorias/[categoriaId]/sacar/page.tsx`,
  ref: SACAR,
  nota: 'Entrada directa por URL (sin interceptar): el flujo corto como página.',
  ops: ESC44_PASO2,
  hoy: '2027-03-05',
  soloLectura: true,
  url: async (page) => {
    await page.goto('/presupuesto');
    await quieta(page);
    return `/presupuesto/categorias/${await page.locator('[data-archivada]').first().getAttribute('data-archivada')}/sacar`;
  },
});

// Fusionar (flujo largo)
const FUS = `${E2}/07-flujos-del-presupuesto/fusionar`;
const fusComp = `${FLU}/presupuesto-categorias-fusionar/formulario.tsx`;
caso({
  id: 'categoria-fusionar__formulario',
  ruta: `${RUTA_DET}/fusionar`,
  comp: fusComp,
  ref: FUS,
  nota: 'Café (con meta y períodos cerrados) → Salidas (ESC-42).',
  ops: ESC42_PASO0,
  hoy: '2027-04-05',
  soloLectura: true,
  url: urlDe('Café', '/fusionar'),
});
caso({
  id: 'categoria-fusionar__impacto',
  ruta: `${RUTA_DET}/fusionar`,
  comp: fusComp,
  ref: FUS,
  nota: 'Paso «Revisá el impacto»; la referencia es el flujo completo.',
  ops: ESC42_PASO0,
  hoy: '2027-04-05',
  soloLectura: true,
  url: urlDe('Café', '/fusionar'),
  pasos: async (page) => {
    await page.getByLabel('Fusionar con').selectOption({ label: 'Salidas' });
    await page.getByRole('button', { name: 'Fusionar', exact: true }).click();
    await expect(page.getByRole('heading', { name: 'Revisá el impacto' })).toBeVisible();
  },
});
caso({
  id: 'categoria-fusionar__sin-destinos',
  ruta: `${RUTA_DET}/fusionar`,
  comp: fusComp,
  ref: `${E2}/07-flujos-del-presupuesto/fusionar-destino-archivado`,
  nota: 'Sin otra categoría activa (el selector solo lista activas): lo más cercano a «destino archivado» sin pasar por el rechazo del servidor.',
  ops: SOLO_CAFE,
  hoy: '2027-04-05',
  soloLectura: true,
  url: urlDe('Café', '/fusionar'),
});
test('categoria-fusionar__destino-archivado', async ({ page, context, baseURL }, info) => {
  // La persona elige Salidas; mientras tanto otra pestaña la archiva; al fusionar el servidor rechaza con fusion_destino_archivado.
  await sembrarOps(ESC42_PASO0, '2027-04-05');
  await entrar(context, baseURL);
  const cafe = await idEn(page, 'Café');
  const salidas = await idEn(page, 'Salidas');
  await page.goto(`/presupuesto/categorias/${cafe}/fusionar`);
  await quieta(page);
  await page.getByLabel('Fusionar con').selectOption({ label: 'Salidas' });
  const otra = await context.newPage();
  await otra.goto(`/presupuesto/categorias/${salidas}/archivar`);
  await quieta(otra);
  await otra.getByRole('button', { name: 'Archivar', exact: true }).click();
  await otra.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await otra.waitForURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);
  await page.getByRole('button', { name: 'Fusionar', exact: true }).click();
  await page.waitForTimeout(1500);
  await capturar(page, info, 'categoria-fusionar__destino-archivado', {
    ruta: `${RUTA_DET}/fusionar`,
    comp: fusComp,
    ref: `${E2}/07-flujos-del-presupuesto/fusionar-destino-archivado`,
    nota: 'Rechazo fusion_destino_archivado forzado archivando el destino desde otra pestaña.',
  });
});

// Sacar de archivada = desarchivar (botón del detalle): resultado en el lugar
test('categoria-sacar__desarchivar', async ({ page, context, baseURL }, info) => {
  await sembrarOps(ESC44_PASO2, '2027-03-05');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  const id = await page.locator('[data-archivada]').first().getAttribute('data-archivada');
  await page.goto(`/presupuesto/categorias/${id}`);
  await quieta(page);
  await page.getByRole('button', { name: 'Desarchivar' }).click();
  await expect(page.getByText('Categoría archivada')).toHaveCount(0);
  await capturar(page, info, 'categoria-sacar__desarchivar', { ruta: RUTA_DET, comp: `${APP}/presupuesto/categorias/[categoriaId]/desarchivar.tsx`, ref: 'SIN DISEÑO', nota: 'Resultado de Desarchivar (lugar y aviso).' });
});

// ═══ METAS ══════════════════════════════════════════════════════════════════════════════════════════════════════════════
const M = `${E2}/09a-metas`;
const metasComp = `${APP}/metas/pantalla.tsx`;
caso({ id: 'metas__lista', ruta: '/metas', comp: metasComp, ref: `${M}/lista`, ...A7 });
caso({
  id: 'metas__lista-varias',
  ruta: '/metas',
  comp: metasComp,
  ref: `${M}/lista`,
  nota: 'Rellenar hasta, acumular y semanal (ESC-35/36).',
  ops: ESC35_PASO1,
  hoy: '2027-02-10',
  hoyServidor: '2027-02-21',
  soloLectura: true,
});
caso({
  id: 'metas__vencida',
  ruta: '/metas',
  comp: metasComp,
  ref: `${M}/vencida`,
  nota: 'Laptop vencida (ESC-38). FALTANTES: meta-vencida (extender/ajustar sin diseño propio).',
  ops: ESC38_PASO4B,
  hoy: '2027-01-25',
  hoyServidor: '2027-05-21',
  soloLectura: true,
});
caso({ id: 'metas__vacia', ruta: '/metas', comp: metasComp, ref: `${M}/vacia`, ops: SIN_METAS, hoy: '2027-02-10', soloLectura: true });
caso({
  id: 'metas__cargando',
  ruta: '/metas',
  comp: `${APP}/metas/lector.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/cargando`,
  nota: 'Proxy: /pruebas/estados/carga (metas no tiene loading.tsx propio: hereda el de (finn)).',
  ops: GAS,
  hoy: '2027-02-10',
  carga: true,
  url: '/pruebas/estados/carga',
});

// Nueva meta
const nuevaComp = `${FLU}/metas-nueva/formulario.tsx`;
const refNueva = `${M}/nueva`;
const nueva = (id: string, extra: Record<string, unknown>, pasos?: (page: Page) => Promise<void>) =>
  caso({
    id,
    ruta: '/metas/nueva',
    comp: nuevaComp,
    ref: refNueva,
    ops: SIN_METAS,
    hoy: '2027-02-10',
    hoyServidor: '2027-02-11', // otra clave de siembra: los `test()` propios cambian la base sin avisar a `caso`
    soloLectura: true,
    url: async (page) => `/metas/nueva?categoria=${await idDe(page, 'Viaje')}`,
    ...(pasos === undefined ? {} : { pasos }),
    ...extra,
  });
const elegir = async (page: Page, nombre: string) => {
  const r = page.getByRole('radio', { name: nombre, exact: true });
  if (await r.count()) await r.click();
  else await page.getByRole('button', { name: nombre, exact: true }).click();
};
nueva('meta__nueva-mensual', { nota: 'Tipo por defecto (Mensual · Acumular).' });
nueva('meta__nueva-semanal', {}, async (p) => {
  await elegir(p, 'Semanal');
  await p.getByLabel('Monto de la meta').fill('50');
});
nueva('meta__nueva-anual', {}, async (p) => {
  await elegir(p, 'Anual');
  await p.getByLabel('Monto de la meta').fill('1200');
});
nueva('meta__nueva-para-fecha', {}, async (p) => {
  await elegir(p, 'Para una fecha');
  await p.getByLabel('Monto de la meta').fill('600');
  await p.getByLabel('Fecha objetivo', { exact: true }).fill('2027-05-15');
});
nueva('meta__nueva-rellenar-hasta', {}, async (p) => {
  await elegir(p, 'Rellenar hasta');
  await p.getByLabel('Monto de la meta').fill('200');
});
nueva('meta__nueva-error-vacio', { nota: 'Crear meta sin monto.' }, async (p) => {
  await p.getByRole('button', { name: 'Crear meta' }).click();
  await p.waitForTimeout(500);
});
nueva('meta__nueva-error-fecha-pasada', { nota: 'Fecha anterior a hoy: rechazo del servidor en el campo.' }, async (p) => {
  await elegir(p, 'Para una fecha');
  await p.getByLabel('Monto de la meta').fill('600');
  await p.getByLabel('Fecha objetivo', { exact: true }).fill('2027-01-01');
  await p.getByRole('button', { name: 'Crear meta' }).click();
  await expect(p.getByText('La fecha objetivo no puede ser anterior a hoy.')).toBeVisible();
});
nueva('meta__nueva-error-sin-fecha', { nota: 'Para una fecha sin fecha.' }, async (p) => {
  await elegir(p, 'Para una fecha');
  await p.getByLabel('Monto de la meta').fill('600');
  await p.getByRole('button', { name: 'Crear meta' }).click();
  await p.waitForTimeout(500);
});
caso({
  id: 'meta__nueva-sin-categorias',
  ruta: '/metas/nueva',
  comp: nuevaComp,
  ref: refNueva,
  nota: 'Todas las categorías ya tienen meta: sin diseño propio.',
  ops: GAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/metas/nueva',
});
caso({
  id: 'meta__nueva-sin-preseleccion',
  ruta: '/metas/nueva',
  comp: nuevaComp,
  ref: refNueva,
  nota: 'Entrada desde «Nueva meta» de la lista, sin categoría elegida.',
  ops: SIN_METAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/metas/nueva',
});

// Editar / detalle de una meta
const editComp = `${FLU}/metas-meta/formulario.tsx`;
const metaDe = (categoria: string) => async (page: Page) => {
  await page.goto('/metas');
  await quieta(page);
  if (categoria === 'Laptop') {
    // vencida: va en «Otras metas» (sin «Editar»); el aviso trae los enlaces
    const h = await page.locator('[data-aviso-meta]').getByRole('link', { name: 'Extender la fecha' }).getAttribute('href');
    if (h === null) throw new Error('sin aviso');
    return h;
  }
  const m = page.locator('[data-meta]').filter({ has: page.getByRole('heading', { name: categoria }) });
  const href = await m.getByRole('link', { name: 'Editar', exact: true }).getAttribute('href');
  if (href === null) throw new Error(`sin meta de ${categoria}`);
  return href;
};
caso({
  id: 'meta__editar',
  ruta: '/metas/[metaId]',
  comp: editComp,
  ref: refNueva,
  nota: 'SIN DISEÑO propio de editar (INDICE 09a: «nueva y editar como flujo corto»; solo hay `nueva`).',
  ops: GAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: metaDe('Gas'),
});
caso({
  id: 'meta__editar-vencida',
  ruta: '/metas/[metaId]',
  comp: editComp,
  ref: `${M}/vencida`,
  nota: 'FALTANTES: meta-vencida.',
  ops: ESC38_PASO4B,
  hoy: '2027-01-25',
  hoyServidor: '2027-05-22',
  soloLectura: true,
  url: metaDe('Laptop'),
});
caso({
  id: 'meta__editar-extender',
  ruta: '/metas/[metaId]',
  comp: editComp,
  ref: `${M}/vencida`,
  nota: 'Tras «Extender la fecha» (foco en Fecha objetivo).',
  ops: ESC38_PASO4B,
  hoy: '2027-01-25',
  hoyServidor: '2027-05-22',
  soloLectura: true,
  url: metaDe('Laptop'),
  pasos: async (p) => {
    await p.getByRole('button', { name: 'Extender la fecha' }).click();
    await p.waitForTimeout(400);
  },
});
caso({
  id: 'meta__editar-eliminar',
  ruta: '/metas/[metaId]',
  comp: editComp,
  ref: 'SIN DISEÑO',
  nota: 'Confirmación de eliminar dentro del flujo (sin confirmar).',
  ops: GAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: metaDe('Gas'),
  pasos: async (p) => {
    await p.getByRole('button', { name: 'Eliminar meta' }).click();
    await expect(p.getByText(/¿Eliminar la meta de Gas\?/)).toBeVisible();
  },
});
caso({
  id: 'meta__editar-no-encontrada',
  ruta: '/metas/[metaId]',
  comp: `${FLU}/metas-meta/lector.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla`,
  ops: GAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/metas/00000000-0000-4000-8000-000000000001',
});
test('meta__editar-conflicto', async ({ page, context, baseURL }, info) => {
  await sembrarOps(GAS, '2027-02-10');
  await entrar(context, baseURL);
  const href = await metaDe('Gas')(page);
  await page.goto(href);
  await quieta(page);
  const otra = await context.newPage();
  await otra.goto(href);
  await quieta(otra);
  await otra.getByLabel('Monto de la meta').fill('250');
  await otra.getByRole('button', { name: 'Guardar cambios' }).click();
  await otra.waitForURL(/\/metas$/);
  await page.getByLabel('Monto de la meta').fill('300');
  await page.getByRole('button', { name: 'Guardar cambios' }).click();
  await page.getByRole('button', { name: 'Usar el valor actual' }).waitFor();
  await capturar(page, info, 'meta__editar-conflicto', { ruta: '/metas/[metaId]', comp: editComp, ref: `${E2}/07-flujos-del-presupuesto/asignar-conflicto`, nota: 'Cambió mientras editabas; la referencia es el conflicto de Asignar.' });
});

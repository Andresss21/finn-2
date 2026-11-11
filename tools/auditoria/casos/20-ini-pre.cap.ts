// Sección INI (Inicio) y PRE (Presupuesto, Listo para asignar, flujos de asignar / mover / auto-asignar, estructura y plantilla).
// Los ids `inicio__principal` y `presupuesto__principal` los captura 00-humo.cap.ts (misma semilla A.7).
import { writeFileSync } from 'node:fs';
import { join } from 'node:path';
import {
  caso,
  capturar,
  entrar,
  escenarioA7,
  fijarRelojServidor,
  quieta,
  sembrarOps,
  SALIDA,
  test,
  expect,
  type Op,
  type Page,
} from '../lib.ts';

const A7 = { escenario: escenarioA7(), hoyServidor: '2026-10-15', soloLectura: true } as const;
const E1 = '02-referencias/entrega-1/pantallas';
const E2 = '02-referencias/entrega-2/pantallas';
const K = '02-referencias/entrega-1/componentes';
const PRES = 'apps/web/src/app/(finn)/presupuesto/page.tsx';
const PANT_PRES = 'apps/web/src/app/(finn)/presupuesto/pantalla.tsx';
const INI = 'apps/web/src/app/(finn)/page.tsx';
const LPA_PAG = 'apps/web/src/app/(finn)/presupuesto/listo-para-asignar/page.tsx';
const EST = 'apps/web/src/app/(finn)/presupuesto/estructura/page.tsx';
const PLA = 'apps/web/src/app/(finn)/presupuesto/estructura/plantilla/page.tsx';

// Períodos de A.7 (hoy 2026-10-15, ciclo día 21): activo desde 2026-09-21.
const P_CERRADO = '2026-08-21';
const P_FUTURO = '2026-10-21';

// ---- semillas tomadas de las E2E del repo ----
const AL_DIA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 1000, periodo: 'P1' },
];
// Listo para asignar −$86.15 (ingreso 1000, asignado 1086.15) y Salidas sobregirada.
const LPA_NEG: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 986.15, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 130, categoria: 'Salidas' },
];
// Listo para asignar en $0.00 y una sobregirada.
const LPA_CERO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-21', monto: 1000 },
  { op: 'OP-14', categoria: 'Super', monto: 900, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 130, categoria: 'Salidas' },
];
const CUENTA_Y_CATEG: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro', saldo: 1000, apertura: '2027-02-05' },
  { op: 'OP-07', categoria: 'Supermercado' },
];
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
  ...Object.keys(GASTOS_RITMO).map((categoria): Op => ({ op: 'OP-14', categoria, monto: 50, periodo: 'P1' })),
  ...Object.entries(GASTOS_RITMO).flatMap(([categoria, montos]) =>
    montos.map((monto): Op => ({ op: 'OP-20', cuenta: 'Ahorro', monto, categoria })),
  ),
];
const TRES_CLASES: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Sobregirada' },
  { op: 'OP-07', categoria: 'Sin fondos' },
  { op: 'OP-07', categoria: 'Cubierta' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Cubierta', monto: 20, periodo: 'P1' },
  { op: 'OP-18', categoria: 'Sin fondos', monto: 50, modo: 'acumular' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 10, categoria: 'Sobregirada' },
];
const ESC44: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Gimnasio' },
  { op: 'OP-21', monto: 700, fecha: '2027-01-25', hoy: '2027-01-25' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 70, periodo: 'P1', hoy: '2027-01-25' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 30, categoria: 'Gimnasio', fecha: '2027-02-02', hoy: '2027-02-02', etiqueta: 'gimnasio' },
  { op: 'OP-14', categoria: 'Gimnasio', monto: 30, periodo: 'P3' },
  { op: 'OP-42', etiqueta: 'gimnasio', cuenta: 'Ahorro', comercio: 'Gimnasio', monto: 30, categoria: 'Gimnasio', primeraFecha: '2027-03-10' },
  { op: 'OP-09', categoria: 'Gimnasio', destino: 'LPA', devolverFuturas: true, desactivar: ['gimnasio'] },
  { op: 'OP-33', compra: 'gimnasio', monto: 25 },
];
// Tarjeta con reserva excedente de $30.00 (ESC-13 paso 4), hoy 21 feb.
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
const ESC16_PASO1: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Salidas' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Salidas', monto: 100, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Super', monto: 80, periodo: 'P1' },
  { op: 'OP-20', cuenta: 'Ahorro', monto: 150, categoria: 'Salidas' },
];
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
const SIN_METAS: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-21', monto: 500 },
];
const ESTRUCTURA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Supermercado' },
  { op: 'OP-07', categoria: 'Luz' },
  { op: 'OP-07', categoria: 'Restaurantes' },
  { op: 'OP-07', categoria: 'Gasolina' },
];

const nota = (id: string, texto: string, variante: string) =>
  writeFileSync(join(SALIDA, 'medidas', `_nota__${id}__${variante}.txt`), texto);

/** Id de una categoría por su fila en Presupuesto (data-fila-categoria). */
async function idDe(page: Page, nombre: string): Promise<string> {
  await page.goto('/presupuesto');
  await quieta(page);
  const id = await page
    .locator('[data-fila-categoria]')
    .filter({ has: page.getByText(nombre, { exact: true }) })
    .first()
    .getAttribute('data-fila-categoria');
  if (id === null) throw new Error(`sin fila ${nombre}`);
  return id;
}

// ============================ INICIO ============================
const ini = (id: string, o: Record<string, unknown>) =>
  caso({ id: `inicio__${id}`, ruta: '/', comp: INI, ...(o as object) } as Parameters<typeof caso>[0]);

ini('al-dia', {
  ref: `${E1}/S1-Inicio__todo-al-dia`,
  ops: AL_DIA,
  hoy: '2027-02-10',
  soloLectura: true,
});
ini('lpa-negativo', {
  ref: `${E1}/S1-Inicio__listo-para-asignar-negativo`,
  ops: LPA_NEG,
  hoy: '2027-02-10',
  soloLectura: true,
});
ini('lpa-cero', {
  ref: `${E1}/S1-Inicio__todo-al-dia`,
  nota: 'LPA en $0.00 con una categoría sobregirada: el billete va en cero pero Inicio sí tiene atención. Sin PNG propio.',
  ops: LPA_CERO,
  hoy: '2027-02-10',
  soloLectura: true,
});
ini('primeros-pasos-sin-cuentas', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/primeros-pasos-sin-cuentas`,
  nota: 'Base recién sembrada. También es el "primer uso sin cuentas" de S1-Inicio__primer-uso-sin-cuentas.',
  ops: [],
  hoy: '2027-02-05',
  soloLectura: true,
});
ini('primer-uso', {
  ref: `${E1}/S1-Inicio__primer-uso-sin-cuentas`,
  ops: [],
  hoy: '2027-02-05',
  soloLectura: true,
});
ini('primeros-pasos', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/primeros-pasos`,
  nota: 'Una cuenta y una categoría: 2 de 3 pasos, con "Ocultar por ahora".',
  ops: CUENTA_Y_CATEG,
  hoy: '2027-02-05',
  soloLectura: true,
});
ini('primeros-pasos-ocultos', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/primeros-pasos`,
  nota: 'Después de tocar "Ocultar por ahora": sin PNG propio (la referencia es el estado con el bloque).',
  ops: CUENTA_Y_CATEG,
  hoy: '2027-02-05',
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Ocultar por ahora', exact: true }).click();
    await expect(page.getByRole('heading', { name: /Primeros pasos/i })).toHaveCount(0);
  },
});
ini('ritmo', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/ritmo-y-tarjetas`,
  nota: 'Hallazgos de ritmo con 5 categorías (semilla de las E2E, hoy 30 ene).',
  ops: OPS_RITMO,
  hoy: '2027-01-30',
  soloLectura: true,
});
ini('pagos-tarjeta-proximos', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/ritmo-y-tarjetas`,
  nota: 'Tarjeta con reserva excedente (ESC-13): fila de pago en atención.',
  ops: ESC13,
  hoy: '2027-02-21',
  soloLectura: true,
});

test('inicio__cargando', async ({ page, context, baseURL }, info) => {
  await sembrarOps([...CUENTA_Y_CATEG], '2027-02-05');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  let soltar: () => void = () => undefined;
  const espera = new Promise<void>((r) => (soltar = r));
  await page.route(/\/(\?|$)/, async (ruta) => {
    const u = new URL(ruta.request().url());
    if (u.pathname === '/' && ruta.request().headers()['rsc'] !== undefined) await espera;
    await ruta.continue();
  });
  await page.getByRole('link', { name: 'Inicio', exact: true }).last().click();
  await page.waitForTimeout(600);
  await capturar(
    page,
    info,
    'inicio__cargando',
    { ruta: '/', comp: 'apps/web/src/app/(finn)/loading.tsx', ref: '02-referencias/entrega-2/pantallas/14-sin-conexion-404-y-error-de-pantalla/cargando', nota: 'loading.tsx real, con la navegación retenida. Revisar la referencia que exista en 14.' },
    { carga: true },
  );
  soltar();
});

test('inicio__error', async ({ page, context, baseURL }, info) => {
  await entrar(context, baseURL);
  await page.goto('/pruebas/estados/error');
  await quieta(page);
  await capturar(page, info, 'inicio__error', {
    ruta: '/ (error.tsx de (finn))',
    comp: 'apps/web/src/app/(finn)/error.tsx',
    ref: '02-referencias/entrega-2/pantallas/14-sin-conexion-404-y-error-de-pantalla/error-de-pantalla',
    nota: 'error.tsx compartido, forzado con /pruebas/estados/error (una consulta que falla).',
  });
});

test('inicio__asignar-boton', async ({ page, context, baseURL }, info) => {
  await sembrarOps([], '2026-10-15');
  // misma semilla A.7
  const { escenario } = A7;
  const { sembrarEscenario } = await import('../lib.ts');
  await sembrarEscenario(escenario, '2026-10-15');
  await entrar(context, baseURL);
  await page.goto('/');
  await quieta(page);
  await page.getByRole('link', { name: /^Asignar \$/ }).or(page.getByRole('button', { name: /^Asignar \$/ })).first().click();
  await page.waitForTimeout(1500);
  await quieta(page);
  nota('inicio__asignar-boton', `url=${page.url()} dialogo=${await page.getByRole('dialog').count()}`, info.project.name);
  await capturar(page, info, 'inicio__asignar-boton', {
    ruta: '/',
    comp: 'apps/web/src/app/(finn)/pantalla-inicio.tsx',
    ref: `${E1}/S1-Inicio__telefono-claro`,
    nota: 'Qué abre "Asignar $312.40" de Inicio (PANTALLAS §2.8: la hoja Asignar).',
  });
});

// ============================ PRESUPUESTO ============================
const pre = (id: string, o: Record<string, unknown>) =>
  caso({ id: `presupuesto__${id}`, ruta: '/presupuesto', comp: PRES, ...(o as object) } as Parameters<typeof caso>[0]);

pre('sobregiradas', { ...A7, ref: `${E1}/S2-Presupuesto__filtro-sobregiradas`, url: '/presupuesto?filtro=sobregiradas' });
pre('sin-fondos', { ...A7, ref: `${E1}/S2-Presupuesto__filtro-sobregiradas`, nota: 'Sin PNG propio de "Sin fondos".', url: '/presupuesto?filtro=sin-fondos' });
pre('cubiertas', { ...A7, ref: `${E2}/D3-presupuesto-filtros-que-se-desplazan/cubiertas`, url: '/presupuesto?filtro=cubiertas' });
pre('filtros-desplazados', {
  ...A7,
  ref: `${E2}/D3-presupuesto-filtros-que-se-desplazan/todas`,
  nota: 'Principal con la fila de filtros: se mide si sangra y se desplaza.',
  pasos: async (page) => {
    const m = await page.evaluate(() => {
      const g = document.querySelector('[role="group"][aria-label="Filtrar categorías"]') as HTMLElement | null;
      const sc = (g?.closest('div, nav') ?? g) as HTMLElement | null;
      let el: HTMLElement | null = g;
      let scroller: HTMLElement | null = null;
      while (el) {
        const o = getComputedStyle(el).overflowX;
        if (o === 'auto' || o === 'scroll') { scroller = el; break; }
        el = el.parentElement;
      }
      const r = (scroller ?? g)?.getBoundingClientRect();
      return { grupo: g?.getBoundingClientRect().toJSON(), desplazable: scroller !== null, scroller: r?.toJSON(), scrollW: scroller?.scrollWidth, clientW: scroller?.clientWidth, anchoVentana: innerWidth, sc: !!sc };
    });
    nota('presupuesto__filtros-desplazados', JSON.stringify(m), 'x');
  },
});
pre('sin-resultados', {
  ref: `${E1}/S2-Presupuesto__sin-resultados`,
  ops: AL_DIA,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/presupuesto?filtro=sobregiradas',
});
pre('periodo-cerrado', { ...A7, ref: `${E1}/S2-Presupuesto__periodo-cerrado`, url: `/presupuesto?periodo=${P_CERRADO}` });
pre('periodo-futuro', { ...A7, ref: `${E1}/S2-Presupuesto__periodo-futuro`, url: `/presupuesto?periodo=${P_FUTURO}` });
pre('lpa-negativo', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/lpa-negativo`,
  ops: LPA_NEG,
  hoy: '2027-02-10',
  soloLectura: true,
});
pre('herramientas', {
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/herramientas`,
  nota: 'ESC-44: archivada con dinero, más Mover dinero y Auto-asignar bajo la franja.',
  ops: ESC44,
  hoy: '2027-03-05',
  soloLectura: true,
});
pre('pago-tarjeta-excedente', {
  ref: `${K}/K3-Dominio-A__fila-de-pago-de-tarjeta__claro`,
  nota: 'ESC-13: reserva excedente de $30.00 en la fila de pago (en --informacion-texto).',
  ops: ESC13,
  hoy: '2027-02-21',
  soloLectura: true,
});
pre('tres-clases', {
  ref: `${E1}/S2-Presupuesto__telefono-claro`,
  nota: 'Una sobregirada, una sin fondos y una cubierta (semilla de las E2E).',
  ops: TRES_CLASES,
  hoy: '2027-02-10',
  soloLectura: true,
});
test('presupuesto__selector-periodo', async ({ page, context, baseURL }, info) => {
  const { sembrarEscenario } = await import('../lib.ts');
  await sembrarEscenario(A7.escenario, '2026-10-15');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  await page.getByRole('link', { name: 'Período anterior' }).click();
  await page.waitForURL(/periodo=/);
  await quieta(page);
  await capturar(page, info, 'presupuesto__selector-periodo', {
    ruta: '/presupuesto?periodo=',
    comp: PANT_PRES,
    ref: `${K}/K4-Dominio-B__selector-de-periodo__claro`,
    nota: 'Se llegó tocando "Período anterior". FALTANTES: "periodos" (elegir otro período) no tiene diseño.',
  });
});

// ============================ LISTO PARA ASIGNAR ============================
const LPA = (id: string, o: Record<string, unknown>) =>
  caso({ id: `lpa__${id}`, ruta: '/presupuesto/listo-para-asignar', comp: LPA_PAG, ...(o as object) } as Parameters<typeof caso>[0]);
LPA('principal', { ...A7, ref: `${E2}/05-detalle-de-listo-para-asignar/principal` });
LPA('negativo', { ref: `${E2}/05-detalle-de-listo-para-asignar/negativo`, ops: LPA_NEG, hoy: '2027-02-10', soloLectura: true });
LPA('tabla', {
  ...A7,
  ref: `${E2}/05-detalle-de-listo-para-asignar/tabla`,
  pasos: async (page) => {
    await page.getByRole('radio', { name: /Tabla/ }).or(page.getByRole('button', { name: /Tabla/ })).or(page.getByText('Tabla', { exact: true })).first().click({ timeout: 5000 }).catch(() => undefined);
  },
});

// ============================ FLUJOS ============================
// Asignar: hoja desde "Asignar a <categoría>" en Presupuesto (ruta interceptada).
caso({
  id: 'asignar__principal',
  ruta: '/presupuesto/asignar/[categoriaId]',
  comp: 'apps/web/src/flujos/presupuesto-asignar-categoria/formulario.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/asignar`,
  ...A7,
  url: '/presupuesto',
  pasos: async (page) => {
    await page.getByRole('link', { name: /^Asignar a Fondo de emergencia/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  },
});
caso({
  id: 'asignar__cubrir',
  ruta: '/presupuesto/asignar/[categoriaId]',
  comp: 'apps/web/src/flujos/presupuesto-asignar-categoria/rapida.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/asignar`,
  nota: 'Restaurantes sobregirada: opción rápida "Cubrir el sobregiro".',
  ...A7,
  url: '/presupuesto',
  pasos: async (page) => {
    await page.getByRole('link', { name: /^Asignar a Restaurantes/ }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  },
});
caso({
  id: 'asignar__pagina-completa',
  ruta: '/presupuesto/asignar/[categoriaId]',
  comp: 'apps/web/src/app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/asignar`,
  nota: 'Carga directa de la URL (sin hoja interceptada): cómo se ve como página.',
  ...A7,
  url: async (page) => `/presupuesto/asignar/${await idDe(page, 'Fondo de emergencia')}`,
});
caso({
  id: 'asignar__periodo-cerrado',
  ruta: '/presupuesto/asignar/[categoriaId]?periodo=',
  comp: 'apps/web/src/app/(finn)/presupuesto/asignar/[categoriaId]/page.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/asignar-periodo-cerrado`,
  nota: 'La app redirige al detalle de la categoría con ?motivo=periodo_cerrado.',
  ...A7,
  url: async (page) => `/presupuesto/asignar/${await idDe(page, 'Restaurantes')}?periodo=${P_CERRADO}`,
});
test('asignar__conflicto', async ({ page, context, baseURL }, info) => {
  const { sembrarEscenario } = await import('../lib.ts');
  await sembrarEscenario(A7.escenario, '2026-10-15');
  await entrar(context, baseURL);
  const id = await idDe(page, 'Fondo de emergencia');
  const ruta = `/presupuesto/asignar/${id}`;
  await page.goto(ruta);
  await quieta(page);
  const otra = await context.newPage();
  await otra.goto(ruta);
  await quieta(otra);
  await otra.getByLabel(/Nuevo valor de Asignado/).fill('333');
  await otra.getByRole('button', { name: 'Guardar', exact: true }).click();
  await otra.waitForURL(/\/presupuesto$/);
  await otra.close();
  await page.getByLabel(/Nuevo valor de Asignado/).fill('400');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByText(/Este valor cambió mientras lo editabas/)).toBeVisible();
  await capturar(page, info, 'asignar__conflicto', {
    ruta: '/presupuesto/asignar/[categoriaId]',
    comp: 'apps/web/src/flujos/presupuesto-asignar-categoria/formulario.tsx',
    ref: `${E2}/07-flujos-del-presupuesto/asignar-conflicto`,
  });
});
test('asignar__resultado', async ({ page, context, baseURL }, info) => {
  const { sembrarEscenario } = await import('../lib.ts');
  await sembrarEscenario(A7.escenario, '2026-10-15');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  await page.getByRole('link', { name: /^Asignar a Fondo de emergencia/ }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel(/Nuevo valor de Asignado/).fill('75');
  await page.getByRole('button', { name: 'Guardar', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await quieta(page);
  nota('asignar__resultado', `url=${page.url()} deshacer=${await page.getByText('Deshacer').count()} status=${await page.locator('[role="status"]').count()}`, info.project.name);
  await capturar(page, info, 'asignar__resultado', {
    ruta: '/presupuesto',
    comp: PANT_PRES,
    ref: `${E2}/07-flujos-del-presupuesto/asignado`,
    nota: 'Resultado de asignar con Deshacer (PANTALLAS §2.13).',
  });
});

caso({
  id: 'mover__principal',
  ruta: '/presupuesto/mover',
  comp: 'apps/web/src/flujos/presupuesto-mover/formulario.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/mover-dinero`,
  ...A7,
  // fuerza a volver a sembrar: asignar__conflicto y asignar__resultado (manuales) dejaron la base modificada
  notificaciones: [],
  url: '/presupuesto',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Mover dinero' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await page.getByLabel('Sacar de').selectOption({ index: 1 });
  },
});
test('mover__excede', async ({ page, context, baseURL }, info) => {
  await sembrarOps(ESC16_PASO1, '2027-02-10');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  await page.getByRole('link', { name: 'Mover dinero' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Sacar de').selectOption({ label: 'Super' });
  await page.getByLabel('Poner en').selectOption({ label: 'Salidas' });
  await page.getByLabel(/Monto a mover/).fill('200');
  await page.getByLabel(/Monto a mover/).blur();
  await capturar(page, info, 'mover__excede', {
    ruta: '/presupuesto/mover',
    comp: 'apps/web/src/flujos/presupuesto-mover/formulario.tsx',
    ref: `${E2}/07-flujos-del-presupuesto/mover-excede`,
  });
});
test('mover__resultado', async ({ page, context, baseURL }, info) => {
  await sembrarOps(ESC16_PASO1, '2027-02-10');
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  await page.getByRole('link', { name: 'Mover dinero' }).click();
  await expect(page.getByRole('dialog')).toBeVisible();
  await page.getByLabel('Sacar de').selectOption({ label: 'Super' });
  await page.getByLabel('Poner en').selectOption({ label: 'Salidas' });
  await page.getByLabel(/Monto a mover/).fill('30');
  await page.getByRole('button', { name: 'Mover', exact: true }).click();
  await expect(page.getByRole('dialog')).toHaveCount(0);
  await quieta(page);
  await capturar(page, info, 'mover__resultado', {
    ruta: '/presupuesto',
    comp: PANT_PRES,
    ref: 'SIN DISEÑO',
    nota: 'Resultado de mover dinero: el diseño no trae PNG del resultado.',
  });
});

caso({
  id: 'auto-asignar__principal',
  ruta: '/presupuesto/auto-asignar',
  comp: 'apps/web/src/flujos/presupuesto-auto-asignar/formulario.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/auto-asignar`,
  ops: TRES_METAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/presupuesto',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Auto-asignar' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  },
});
caso({
  id: 'auto-asignar__cubiertas',
  ruta: '/presupuesto/auto-asignar',
  comp: 'apps/web/src/flujos/presupuesto-auto-asignar/formulario.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/auto-asignar-cubiertas`,
  ops: SIN_METAS,
  hoy: '2027-02-10',
  soloLectura: true,
  url: '/presupuesto',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Auto-asignar' }).click();
    await expect(page.getByRole('dialog')).toBeVisible();
  },
});
caso({
  id: 'auto-asignar__pagina-completa',
  ruta: '/presupuesto/auto-asignar',
  comp: 'apps/web/src/app/(finn)/presupuesto/auto-asignar/page.tsx',
  ref: `${E2}/07-flujos-del-presupuesto/auto-asignar`,
  nota: 'Carga directa de la URL (sin hoja).',
  ops: TRES_METAS,
  hoy: '2027-02-10',
  soloLectura: true,
});

// ============================ ESTRUCTURA Y PLANTILLA ============================
const est = (id: string, o: Record<string, unknown>) =>
  caso({ id: `estructura__${id}`, ruta: '/presupuesto/estructura', comp: EST, ...(o as object) } as Parameters<typeof caso>[0]);
est('lista', { ref: `${E2}/08-estructura-y-plantilla-inicial/estructura`, ...A7, url: '/presupuesto/estructura' });
est('movida', {
  ref: `${E2}/08-estructura-y-plantilla-inicial/estructura-movida`,
  ops: ESTRUCTURA,
  hoy: '2027-02-05',
  url: '/presupuesto/estructura',
  pasos: async (page) => {
    await page.getByRole('button', { name: /^Bajar Supermercado/ }).click();
    await expect(page.getByText(/Moviste/)).toBeVisible();
  },
});
est('vacia', {
  ref: `${E2}/08-estructura-y-plantilla-inicial/estructura-vacia`,
  ops: [],
  hoy: '2027-02-05',
  soloLectura: true,
  nota: 'La base sembrada trae un grupo vacío "Gastos"; verificar si cuenta como vacía.',
});
est('editar-categoria', {
  ref: `${E2}/08-estructura-y-plantilla-inicial/editar-categoria`,
  ...A7,
  url: '/presupuesto/estructura',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Editar Restaurantes', exact: true }).click();
    await quieta(page);
  },
});
est('nueva-categoria', {
  ref: `${E2}/08-estructura-y-plantilla-inicial/editar-categoria`,
  nota: 'Sin PNG propio de "Nueva categoría".',
  ...A7,
  url: '/presupuesto/estructura',
  pasos: async (page) => {
    await page.getByRole('link', { name: /^Agregar categoría a|Nueva categoría/ }).first().click();
    await quieta(page);
  },
});
est('nuevo-grupo', {
  ref: 'SIN DISEÑO',
  nota: 'Hoja "Nuevo grupo": el diseño 08 no trae PNG de grupos (FALTANTES: grupo-editar).',
  ...A7,
  url: '/presupuesto/estructura',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Nuevo grupo', exact: true }).click();
    await quieta(page);
  },
});
est('editar-grupo', {
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: grupo-editar.',
  ...A7,
  url: '/presupuesto/estructura',
  pasos: async (page) => {
    await page.getByText('Editar grupo', { exact: false }).first().click();
    await quieta(page);
  },
});
est('error-nombre-vacio', {
  ref: 'SIN DISEÑO',
  nota: 'Enviar "Nuevo grupo" sin nombre: error de campo.',
  ...A7,
  url: '/presupuesto/estructura',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Nuevo grupo', exact: true }).click();
    await quieta(page);
    await page.getByRole('button', { name: 'Crear', exact: true }).click();
    await page.waitForTimeout(400);
  },
});

const pla = (id: string, o: Record<string, unknown>) =>
  caso({ id: `plantilla__${id}`, ruta: '/presupuesto/estructura/plantilla', comp: PLA, ...(o as object) } as Parameters<typeof caso>[0]);
pla('sugerida', {
  ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla`,
  ops: [],
  hoy: '2027-02-05',
  soloLectura: true,
});
pla('vacia', {
  ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla-vacia`,
  ops: [],
  hoy: '2027-02-05',
  pasos: async (page) => {
    const quitar = page.getByRole('button', { name: /^Quitar el grupo / });
    for (let i = 0; i < 11 && (await quitar.count()) > 0; i++) await quitar.first().click();
  },
});
test('plantilla__creando', async ({ page, context, baseURL }, info) => {
  await sembrarOps([], '2027-02-05');
  await entrar(context, baseURL);
  await page.goto('/presupuesto/estructura/plantilla');
  await quieta(page);
  let soltar: () => void = () => undefined;
  const espera = new Promise<void>((r) => (soltar = r));
  await page.route('**/presupuesto/estructura/plantilla', async (ruta) => {
    if (ruta.request().method() === 'POST') await espera;
    await ruta.continue();
  });
  await page.getByRole('button', { name: /^Crear \d+ categorías$/ }).click();
  await page.waitForTimeout(700);
  await capturar(
    page,
    info,
    'plantilla__creando',
    { ruta: '/presupuesto/estructura/plantilla', comp: PLA, ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla-creando` },
    { carga: true },
  );
  soltar();
});
test('plantilla__cortada', async ({ page, context, baseURL }, info) => {
  await sembrarOps([], '2027-02-05');
  await entrar(context, baseURL);
  await page.goto('/presupuesto/estructura/plantilla');
  await quieta(page);
  let llamadas = 0;
  await page.route('**/presupuesto/estructura/plantilla', (ruta) => {
    const accion = ruta.request().method() === 'POST';
    llamadas += accion ? 1 : 0;
    return accion && llamadas === 2 ? ruta.abort('connectionfailed') : ruta.fallback();
  });
  await page.getByRole('button', { name: /^Crear \d+ categorías$/ }).click();
  await expect(page.getByRole('button', { name: /^Seguir/ })).toBeVisible({ timeout: 30_000 });
  await capturar(page, info, 'plantilla__cortada', {
    ruta: '/presupuesto/estructura/plantilla',
    comp: PLA,
    ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla-cortada`,
  });
});
test('plantilla__resultado', async ({ page, context, baseURL }, info) => {
  await sembrarOps([], '2027-02-05');
  await entrar(context, baseURL);
  await page.goto('/presupuesto/estructura/plantilla');
  await quieta(page);
  await page.getByRole('button', { name: /^Crear \d+ categorías$/ }).click();
  await expect(page.getByText(/Se crearon|Creaste|creadas/i).first()).toBeVisible({ timeout: 60_000 });
  await capturar(page, info, 'plantilla__resultado', {
    ruta: '/presupuesto/estructura/plantilla',
    comp: PLA,
    ref: `${E2}/08-estructura-y-plantilla-inicial/plantilla-resultado`,
  });
});
void fijarRelojServidor;

// Tarjeta «Activar notificaciones» de Inicio (FT-06): se fuerza el permiso del navegador en «default» (sin decidir).
caso({
  id: 'inicio__activar-notificaciones',
  ruta: '/',
  comp: 'apps/web/src/componentes/marco/tarjeta-notificaciones.tsx',
  ref: 'SIN DISEÑO',
  nota: 'FT-06: la tarjeta de permiso de notificaciones no tiene tablero (FALTANTES: permiso-push).',
  ...A7,
  antes: async (page) => {
    await page.addInitScript(() => {
      Object.defineProperty(Notification, 'permission', { get: () => 'default', configurable: true });
    });
  },
});

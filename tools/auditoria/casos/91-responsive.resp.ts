// Responsive (punto 9): las pantallas alcanzables por URL, en 360, 768 y 1024 de ancho, con la semilla de A.7.
// Deja captura y medida (`<id>__ancho-<n>`): el analizador marca desbordes, textos fuera de ancho y tocables chicos.
import { caso, escenarioA7, type Page } from '../lib.ts';

const A7 = { escenario: escenarioA7(), hoyServidor: '2026-10-15', soloLectura: true } as const;
const RUTAS = [
  '/', '/presupuesto', '/bandeja', '/actividad', '/cuentas', '/reportes', '/metas', '/programadas', '/por-cobrar',
  '/reglas', '/notificaciones', '/ajustes', '/ajustes/seguridad', '/ajustes/apariencia', '/ajustes/ciclo',
  '/ajustes/notificaciones', '/ajustes/webhook', '/ajustes/formatos', '/ajustes/instituciones', '/ajustes/exportar',
  '/ajustes/respaldo', '/ajustes/diagnostico', '/registrar', '/registrar/gasto', '/registrar/ingreso',
  '/registrar/transferencia', '/cuentas/nueva', '/cuentas/ordenar', '/presupuesto/estructura',
  '/presupuesto/listo-para-asignar', '/presupuesto/mover', '/presupuesto/auto-asignar', '/metas/nueva', '/reglas/nueva',
  '/programadas/nueva',
];
const slug = (r: string) => (r === '/' ? 'inicio' : r.slice(1).replaceAll('/', '-'));

for (const ruta of RUTAS)
  caso({ id: `resp-${slug(ruta)}__a7`, ruta, comp: '(ver INVENTARIO)', ref: 'responsive', ...A7 });

/** El primer enlace cuyo href cumple el patrón, desde la página `desde`. */
const primerEnlace = (desde: string, patron: RegExp) => async (page: Page) => {
  await page.goto(desde);
  await page.waitForLoadState('networkidle');
  const hrefs = await page.locator('a[href]').evaluateAll((as) => as.map((a) => a.getAttribute('href') ?? ''));
  const h = hrefs.find((x) => patron.test(x));
  if (!h) throw new Error(`no hay enlace ${String(patron)} en ${desde}`);
  return h;
};
caso({ id: 'resp-categoria__a7', ruta: '/presupuesto/categorias/[categoriaId]', comp: '(ver INVENTARIO)', ref: 'responsive', ...A7, url: primerEnlace('/presupuesto', /^\/presupuesto\/categorias\/[0-9a-f-]{36}$/) });
caso({ id: 'resp-cuenta__a7', ruta: '/cuentas/[cuentaId]', comp: '(ver INVENTARIO)', ref: 'responsive', ...A7, url: primerEnlace('/cuentas', /^\/cuentas\/[0-9a-f-]{36}$/) });
caso({ id: 'resp-transaccion__a7', ruta: '/actividad/[transaccionId]', comp: '(ver INVENTARIO)', ref: 'responsive', ...A7, url: primerEnlace('/actividad', /^\/actividad\/[0-9a-f-]{36}$/) });
caso({ id: 'resp-ingresar__sin-sesion', ruta: '/ingresar', comp: 'apps/web/src/app/ingresar/page.tsx', ref: 'responsive', sesion: false });

// Auditoría de diseño · BAN (Bandeja y Revisar movimiento) y REG (Registrar: selector, tipos y Registrar gasto).
// Un caso por entrada del inventario. Los estados se fuerzan con operaciones reales, con el webhook real de SMS o con los pasos
// de las E2E (apps/web/e2e/pantallas/bandeja, flujos/bandeja, pantallas/registrar, flujos/transacciones, flujos/inversiones).
// Un caso sin `ops` ni `escenario` usa la base que dejó el caso anterior (lo dice su comentario).
import {
  caso,
  capturar,
  escenarioA7,
  expect,
  quieta,
  type Escenario,
  type Op,
  type Page,
} from '../lib.ts';
import { generarTokenWebhook } from '../../../apps/web/e2e/ayudas/webhook.ts';
import { bandeja as tb } from '../../../apps/web/src/textos/bandeja.ts';
import { cuentas as tc } from '../../../apps/web/src/textos/cuentas.ts';
import { registrarGasto as tg } from '../../../apps/web/src/textos/registrar-gasto.ts';
import { registrarTipo as tt } from '../../../apps/web/src/textos/registrar-tipo.ts';
import { registrarInversion as ti } from '../../../apps/web/src/textos/registrar-inversion.ts';
import { registrarTarjeta as tk } from '../../../apps/web/src/textos/registrar-tarjeta.ts';
import { registrarDesembolso as td } from '../../../apps/web/src/textos/registrar-desembolso.ts';
import { registrarDevolucion as tv } from '../../../apps/web/src/textos/registrar-devolucion.ts';
import { formularios as tf } from '../../../apps/web/src/textos/formularios.ts';

const E1 = '02-referencias/entrega-1/pantallas';
const E2 = '02-referencias/entrega-2/pantallas';
const REV = `${E2}/01-revisar-movimiento`;
const TIP = `${E2}/12-registrar-tipos-y-flujos-cortos`;
const APP = 'apps/web/src/app/(finn)';
const FL = 'apps/web/src/flujos';
const RUTA_MOV = '/bandeja/[movimientoId]';

// ───────────────────────────── Semillas ─────────────────────────────

const HOY_A7 = '2026-10-15';
const smsA7 = (
  etiqueta: string,
  cuenta: string,
  comercio: string,
  monto: number,
  hora: string,
  fecha = HOY_A7,
): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta,
  monto,
  comercio,
  recibido: `${HOY_A7}T${hora}`,
  fecha,
  hoy: HOY_A7,
});

/**
 * A.7 con los tres movimientos de la Bandeja de las referencias (S4): SUPER SELECTOS ESCALON listo para aprobar (con una compra
 * anterior aprobada en Supermercado, que da la sugerencia), FARMACIA SAN NICOLAS sin categoría y NETFLIX con coincidencia con la
 * programada de A.7. La compra de SUPER SELECTOS del paso 3 no se siembra: es el SMS por revisar.
 */
function a7ConBandeja(id: string): Escenario {
  const base = escenarioA7();
  const ops = base.estadoInicial
    .filter((op) => !(op.op === 'OP-20' && op.etiqueta === 'super-selectos'))
    .map((op): Op => {
      if (op.op === 'OP-01' && op.cuenta === 'Visa Oro') return { ...op, ultimos4: '4821' };
      if (op.op === 'OP-01' && op.cuenta === 'Cuenta corriente') return { ...op, ultimos4: '7702' };
      return op;
    });
  return {
    ...base,
    id,
    estadoInicial: [
      ...ops,
      smsA7('netflix', 'Visa Oro', 'NETFLIX', 15.49, '06:02'),
      smsA7('ss-previo', 'Visa Oro', 'SUPER SELECTOS ESCALON', 20, '07:00'),
      {
        op: 'OP-37',
        etiqueta: 'ss-previo',
        categoria: 'Supermercado',
        aprobado: `${HOY_A7}T07:30`,
        hoy: HOY_A7,
      },
      smsA7('farmacia', 'Cuenta corriente', 'FARMACIA SAN NICOLAS', 12.35, '08:05', '2026-10-14'),
      smsA7('super', 'Visa Oro', 'SUPER SELECTOS ESCALON', 35, '09:41'),
    ],
  };
}
/** A.7 más un préstamo y una inversión: con ellos el selector de Registrar ofrece todos los tipos. */
function a7ConTodo(): Escenario {
  const base = escenarioA7();
  return {
    ...base,
    id: 'SEM-A7-REG',
    estadoInicial: [
      ...base.estadoInicial,
      {
        op: 'OP-01',
        cuenta: 'Préstamo personal',
        tipo: 'prestamo',
        saldo: 0,
        apertura: '2026-03-21',
        prestamo: {
          contraparte: 'Banco',
          montoOriginal: 5000,
          cuota: 210,
          plazoCuotas: 24,
          cuotasPagadas: 0,
        },
        hoy: HOY_A7,
      },
      {
        op: 'OP-01',
        cuenta: 'Depósito a plazo',
        tipo: 'inversion',
        saldo: 2075.6,
        apertura: '2026-03-21',
        hoy: HOY_A7,
      },
    ],
  };
}
const A7_BAN = {
  escenario: a7ConBandeja('SEM-A7-BAN'),
  hoyServidor: HOY_A7,
  soloLectura: true,
} as const;
const A7_BAN_ESCRIBE = { escenario: a7ConBandeja('SEM-A7-BAN'), hoyServidor: HOY_A7 } as const;
const A7_REG = { escenario: a7ConTodo(), hoyServidor: HOY_A7, soloLectura: true } as const;
const A7_REG_ESCRIBE = { escenario: a7ConTodo(), hoyServidor: HOY_A7 } as const;

// Semilla chica (la de las E2E de la Bandeja): Ahorro con $500, la tarjeta T ···1234, Super y Casa.
const DIA = '2027-02-20';
const sms = (etiqueta: string, comercio: string, monto: number, hora: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${DIA}T${hora}`,
  fecha: DIA,
});
const smsDe = (
  etiqueta: string,
  comercio: string,
  monto: number,
  fecha: string,
  hora: string,
): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio,
  recibido: `${fecha}T${hora}`,
  fecha,
  hoy: fecha,
});
const BASE: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Casa' },
  { op: 'OP-21', monto: 500 },
  { op: 'OP-14', categoria: 'Super', monto: 50, periodo: 'P1' },
];
const HISTORIAL: Op[] = [
  sms('anterior', 'Super', 10, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${DIA}T09:30` },
];
const TRES: Op[] = [
  ...BASE,
  ...HISTORIAL,
  sms('a', 'Super', 35, '10:15'),
  sms('b', 'Farmacia San Nicolas', 12.35, '11:00'),
  sms('c', 'Cafe Luna', 4.5, '12:00'),
];
const DOCE: Op[] = [
  ...BASE,
  ...HISTORIAL,
  ...Array.from({ length: 12 }, (_, i) =>
    sms(`m${String(i)}`, `Comercio ${String(i)}`, 10 + i, `10:${String(10 + i)}`),
  ),
];

// ───────────────────────────── Ayudas ─────────────────────────────

const filas = (page: Page) => page.locator('[data-movimiento]');
const panel = (page: Page) => page.locator('main[data-pagina-flujo]');
const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const radio = (page: Page, grupo: string, nombre: string | RegExp) =>
  page.getByRole('radiogroup', { name: grupo, exact: true }).getByRole('radio', { name: nombre });
const pausa = (page: Page, ms = 400) => page.waitForTimeout(ms);

/** Un paso que puede no existir en la app: si falla, lo dice y la captura sigue (la diferencia se ve en la captura). */
async function intentar(que: string, paso: () => Promise<unknown>): Promise<void> {
  try {
    await paso();
  } catch (e) {
    console.log(
      `[aviso] no se pudo: ${que} — ${e instanceof Error ? (e.message.split('\n')[0] ?? '') : ''}`,
    );
  }
}

async function irABandeja(page: Page): Promise<void> {
  await page.goto('/bandeja');
  await quieta(page);
}
/** La ruta de la revisión del movimiento cuya fila tiene ese texto. */
async function hrefDe(page: Page, texto: string | RegExp): Promise<string> {
  await irABandeja(page);
  const fila = filas(page).filter({ hasText: texto }).first();
  await expect(fila).toBeVisible();
  return `/bandeja/${(await fila.getAttribute('data-movimiento')) ?? ''}`;
}
/** La ruta de la revisión del movimiento con esa vista (`data-vista`). */
const hrefDeVista =
  (vista: string) =>
  async (page: Page): Promise<string> => {
    await irABandeja(page);
    const fila = page.locator(`[data-vista="${vista}"]`).first();
    await expect(fila).toBeVisible();
    return `/bandeja/${(await fila.getAttribute('data-movimiento')) ?? ''}`;
  };
/** Genera el token del webhook (FT-03) y lo devuelve. */
async function tokenWebhook(page: Page): Promise<string> {
  await page.goto('/ajustes/webhook');
  await quieta(page);
  await generarTokenWebhook(page);
  return ((await page.getByTestId('token').textContent()) ?? '').trim();
}
async function enviarSms(
  page: Page,
  token: string,
  texto: string,
  modo: 'json' | 'crudo' = 'json',
): Promise<void> {
  const r = await page.request.post('/api/sms', {
    headers: {
      authorization: `Bearer ${token}`,
      ...(modo === 'crudo' ? { 'content-type': 'application/octet-stream' } : {}),
    },
    data: modo === 'crudo' ? texto : { texto, remitente: 'BAC' },
  });
  expect(r.status()).toBe(200);
}
/** El procesamiento corre después de responder (BE-44): se reabre hasta que la lista tiene esas filas. */
async function esperarFilas(page: Page, selector: string, cuantas: number): Promise<void> {
  await expect(async () => {
    await irABandeja(page);
    await expect(page.locator(selector)).toHaveCount(cuantas, { timeout: 2_000 });
  }).toPass({ timeout: 30_000 });
}
/** Espera las piezas diferidas de la revisión (el encabezado y los campos llegan con `lazy`). */
async function revisarListo(page: Page): Promise<void> {
  await expect(panel(page).locator('[data-encabezado-movimiento]')).toBeVisible({
    timeout: 15_000,
  });
  await pausa(page, 500);
  await quieta(page);
}
/** Las Server Actions son POST a la URL de la página: se cortan para forzar el error de red. */
const cortarEscrituras =
  (patron: string) =>
  async (page: Page): Promise<void> => {
    await page.route(patron, async (route) => {
      if (route.request().method() === 'POST') await route.abort('failed');
      else await route.continue();
    });
  };
/** Igual, pero la respuesta no llega: el botón se queda en «Guardando…». */
const demorarEscrituras =
  (patron: string) =>
  async (page: Page): Promise<void> => {
    await page.route(patron, async (route) => {
      if (route.request().method() !== 'POST') return route.continue();
      await new Promise((r) => setTimeout(r, 30_000));
      await route.abort('failed').catch(() => undefined);
    });
  };
/** Una selección nativa: se elige por el nombre de la opción, con el control ya hidratado. */
async function elegir(page: Page, etiqueta: string, nombre: string): Promise<void> {
  const control = campo(page, etiqueta);
  await expect
    .poll(() =>
      control.evaluate((el) => Object.keys(el).some((k) => k.startsWith('__reactProps$'))),
    )
    .toBe(true);
  await control.selectOption({ label: nombre });
}
interface Linea {
  readonly destino: string;
  readonly monto: string;
}
/** Llena Registrar gasto como en S5: cuenta, total, comercio y las líneas. */
async function llenarGasto(
  page: Page,
  d: { cuenta?: string; total?: string; comercio?: string; lineas?: readonly Linea[] },
): Promise<void> {
  await expect(page.locator('[data-campo-lineas]')).toBeVisible({ timeout: 15_000 });
  if (d.cuenta !== undefined) await elegir(page, tg.cuenta, d.cuenta);
  if (d.total !== undefined) await campo(page, tg.total).fill(d.total);
  if (d.comercio !== undefined) await campo(page, tg.comercio).fill(d.comercio);
  for (const [i, l] of (d.lineas ?? []).entries()) {
    const n = String(i + 1);
    if (i > 0) await page.getByRole('button', { name: tg.agregarLinea }).click();
    await campo(page, tg.montoDeParte(n)).fill(l.monto);
    if (l.destino !== '') await elegir(page, tg.categoriaDeParte(n), l.destino);
  }
  await page
    .locator('h1')
    .first()
    .click({ force: true })
    .catch(() => undefined); // saca el foco del último campo
  await pausa(page);
}
const S5 = {
  cuenta: 'Visa Oro',
  total: '148.60',
  comercio: 'PRICESMART',
  lineas: [
    { destino: 'Supermercado', monto: '96.10' },
    { destino: 'Farmacia', monto: '22.50' },
    { destino: tg.porCobrarA('Carlos'), monto: '30.00' },
  ],
} as const;
const guardarGasto = (page: Page) => page.getByRole('button', { name: /^Guardar/ });

/** Abre un tipo desde el selector de `/registrar`: la ruta interceptada lo muestra como hoja (teléfono) o panel (computadora). */
const abrirTipo =
  (titulo: string) =>
  async (page: Page): Promise<void> => {
    await page
      .getByRole('link', { name: new RegExp(`^${titulo}`) })
      .first()
      .click();
    await expect(page.getByRole('dialog')).toBeVisible({ timeout: 15_000 });
    await pausa(page, 600);
    await quieta(page);
  };

// ═════════════════════════════ BANDEJA ═════════════════════════════

caso({
  id: 'bandeja__principal',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/page.tsx`,
  ref: `${E1}/S4-Bandeja`,
  ...A7_BAN,
});
caso({
  id: 'bandeja__descartados-vacio',
  ruta: '/bandeja?vista=descartados',
  comp: `${APP}/bandeja/descartados.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Vista de descartados sin ninguno; lo más cercano es S4-Bandeja__vista-de-descartados y el vacío de 2.19',
  ...A7_BAN,
});
caso({
  id: 'bandeja__otra-categoria',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/otra-categoria.tsx`,
  ref: 'SIN DISEÑO',
  nota: '«Elegir categoría» de una fila sin categoría abre un superpuesto con una selección nativa (CH-220 A10)',
  ...A7_BAN,
  pasos: async (page) => {
    await filas(page)
      .filter({ hasText: /FARMACIA/ })
      .getByRole('button', { name: /Elegir categoría/ })
      .click();
    await expect(page.getByRole('dialog')).toBeVisible();
    await pausa(page, 600);
  },
});
caso({
  id: 'bandeja__arrastre-destinos',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/arrastre.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Panel de destinos del arrastre (FT-78); el diseño solo lo nombra en la nota de la Bandeja',
  ...A7_BAN,
  pasos: async (page) => {
    const asa = filas(page)
      .filter({ hasText: /FARMACIA/ })
      .locator('[data-asa]');
    await expect(asa).toBeVisible({ timeout: 10_000 });
    await asa.focus();
    await page.keyboard.press('Space');
    await expect(page.locator('[data-panel-destinos]')).toBeVisible();
    await pausa(page);
  },
});
caso({
  id: 'bandeja__sin-conexion',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/fila.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/sin-conexion-en-la-app`,
  nota: 'La Bandeja ya cargada cuando se va la conexión',
  ...A7_BAN,
  pasos: async (page) => {
    await page.context().setOffline(true);
    await pausa(page, 800);
  },
});
caso({
  id: 'bandeja__error-al-aprobar',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/fila.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Falla de red al aprobar de un toque: aviso de problema en la fila con «Intentar de nuevo»',
  ...A7_BAN,
  antes: cortarEscrituras('**/bandeja'),
  pasos: async (page) => {
    await filas(page)
      .filter({ hasText: /SUPER SELECTOS/ })
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await intentar('ver «Intentar de nuevo»', () =>
      expect(page.getByRole('button', { name: tf.intentarDeNuevo })).toBeVisible({
        timeout: 20_000,
      }),
    );
  },
});
caso({
  id: 'bandeja__al-dia',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/lista.tsx`,
  ref: `${E1}/S4-Bandeja__bandeja-al-dia`,
  ops: BASE,
  hoy: DIA,
  soloLectura: true,
});
caso({
  id: 'bandeja__aprobado-con-un-toque',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/fila.tsx`,
  ref: `${E1}/S4-Bandeja__aprobado-con-un-toque`,
  ops: TRES,
  hoy: DIA,
  pasos: async (page) => {
    await filas(page)
      .filter({ hasText: 'Super' })
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await pausa(page, 600);
  },
});
caso({
  id: 'bandeja__descartado',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/fila.tsx`,
  ref: `${E1}/S4-Bandeja__descartado`,
  ops: TRES,
  hoy: DIA,
  pasos: async (page) => {
    await filas(page)
      .filter({ hasText: 'Super' })
      .getByRole('button', { name: /^Descartar/ })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await pausa(page, 600);
  },
});
caso({
  id: 'bandeja__vista-de-descartados',
  ruta: '/bandeja?vista=descartados',
  comp: `${APP}/bandeja/descartados.tsx`,
  ref: `${E1}/S4-Bandeja__vista-de-descartados`,
  ops: [
    ...BASE,
    sms('a', 'Farmacia San Nicolas', 12.35, '10:00'),
    sms('a2', 'Farmacia San Nicolas', 12.35, '10:05'), // idéntico a los 5 minutos: autodescartado (CA-34.4)
    sms('b', 'Cafe Luna', 4.5, '11:00'),
    sms('c', 'Libreria', 7, '12:00'),
  ],
  hoy: DIA,
  url: '/bandeja',
  pasos: async (page) => {
    for (const nombre of ['Cafe Luna', 'Libreria']) {
      await page.goto(await hrefDe(page, nombre));
      await revisarListo(page);
      await panel(page).getByRole('button', { name: tc.bandeja.descartar, exact: true }).click();
      await expect(page.getByTestId('resultado')).toBeVisible();
    }
    await page.goto('/bandeja?vista=descartados');
    await quieta(page);
    await expect(page.locator('[data-vista="descartado"]').first()).toBeVisible();
  },
});
// Usa la base del caso anterior (dos descartados y un autodescartado).
caso({
  id: 'bandeja__restaurado',
  ruta: '/bandeja?vista=descartados',
  comp: `${APP}/bandeja/descartados.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Resultado de «Restaurar» en la vista de descartados, con «Descartar» como salida',
  pasos: async (page) => {
    await page
      .locator('[data-vista="descartado"]')
      .first()
      .getByRole('button', { name: /Restaurar/ })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await pausa(page, 600);
  },
});
caso({
  id: 'bandeja__aprobar-todos',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/aprobar-todos.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES · aprobar-todos: el botón «Aprobar todos (n)» sobre la lista',
  ops: [
    ...BASE,
    ...HISTORIAL,
    sms('vieja', 'Super', 21, '15:00'),
    smsDe('nueva', 'Super', 12, '2027-03-09', '15:00'),
    smsDe('nueva2', 'Super', 18, '2027-03-09', '16:00'),
  ],
  hoy: DIA,
  hoyServidor: '2027-03-10',
});
// Usa la base del caso anterior.
caso({
  id: 'bandeja__aprobar-todos-resultado',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/aprobar-todos.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES · aprobar-todos: resultado «Aprobaste N» y aviso AV-19 con los no aprobados',
  pasos: async (page) => {
    await page.getByRole('button', { name: /^Aprobar todos/ }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await pausa(page, 600);
  },
});
// Los cuatro estados con problema de S4: no reconocido y con error (webhook real), posible duplicado y datos faltantes.
caso({
  id: 'bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes',
  ruta: '/bandeja',
  comp: 'apps/web/src/componentes/dominio/movimiento-bandeja.tsx',
  ref: `${E1}/S4-Bandeja__no-reconocido-con-error-duplicado-y-datos-faltantes`,
  ops: [
    ...BASE,
    ...HISTORIAL,
    sms('a', 'PUMA SANTA ELENA', 30, '10:15'),
    sms('b', 'PUMA SANTA ELENA 2', 30, '10:17'),
  ],
  hoy: DIA,
  antes: async (page) => {
    const token = await tokenWebhook(page);
    await enviarSms(page, token, 'Su transacción fue procesada. Ref 88213.');
    await enviarSms(
      page,
      token,
      'VISA 1234: has realizado una compra por USD 15.49 en el comercio Netflix 2027/02/20',
      'crudo',
    );
    await enviarSms(
      page,
      token,
      'VISA 9999: has realizado una compra por USD 148.60 en el comercio Super 2027/02/20', // tarjeta desconocida, comercio con historial: datos faltantes
    );
    await esperarFilas(page, '[data-movimiento]', 5);
  },
});
// Los seis casos que siguen usan la base del caso anterior.
caso({
  id: 'bandeja__referencia-copiada',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/fila.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Lo que dice la fila con error después de «Copiar referencia»',
  pasos: async (page) => {
    await page
      .locator('[data-vista="error"]')
      .getByRole('button', { name: /Copiar referencia/ })
      .click();
    await pausa(page, 800);
  },
});
caso({
  id: 'revisar__posible-duplicado',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/estados.tsx`,
  ref: `${REV}/posible-duplicado`,
  url: hrefDeVista('duplicado'),
  pasos: revisarListo,
});
caso({
  id: 'revisar__no-reconocido',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/estados.tsx`,
  ref: `${REV}/no-reconocido`,
  url: hrefDeVista('noReconocido'),
  pasos: revisarListo,
});
caso({
  id: 'revisar__no-reconocido-a-mano',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/campos-movimiento.tsx`,
  ref: `${REV}/no-reconocido`,
  nota: 'Después de «Registrar a mano»: los campos vacíos con el SMS a la vista',
  url: hrefDeVista('noReconocido'),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('button', { name: tc.bandeja.registrarAMano }).click();
    await expect(panel(page).getByRole('radiogroup', { name: tb.revisar.tipo })).toBeVisible();
    await pausa(page);
  },
});
caso({
  id: 'revisar__con-error',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/detalle-error.tsx`,
  ref: `${REV}/con-error`,
  url: hrefDeVista('error'),
  pasos: revisarListo,
});
caso({
  id: 'revisar__datos-faltantes',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/formulario.tsx`,
  ref: `${REV}/falta-categoria`,
  nota: 'Datos faltantes (falta la cuenta): no tiene tablero propio; el más cercano es falta-categoria',
  url: hrefDeVista('faltaOtro'),
  pasos: revisarListo,
});
caso({
  id: 'revisar__validacion',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/campos-movimiento.tsx`,
  ref: `${REV}/parte-sin-destino`,
  nota: 'Aprobar sin cuenta ni categoría: los errores de cada campo (lo más cercano es parte-sin-destino)',
  url: hrefDeVista('faltaOtro'),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await pausa(page, 1_200);
  },
});

// ═════════════════════════════ REVISAR MOVIMIENTO ═════════════════════════════

caso({
  id: 'revisar__listo',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/formulario.tsx`,
  ref: `${REV}/listo`,
  ...A7_BAN,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: revisarListo,
});
caso({
  id: 'revisar__falta-categoria',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/formulario.tsx`,
  ref: `${REV}/falta-categoria`,
  ...A7_BAN,
  url: (page) => hrefDe(page, /FARMACIA/),
  pasos: revisarListo,
});
caso({
  id: 'revisar__coincidencia',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/coincidencia.tsx`,
  ref: `${REV}/coincidencia`,
  ...A7_BAN,
  url: (page) => hrefDe(page, /NETFLIX/),
  pasos: revisarListo,
});
caso({
  id: 'revisar__dividido',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/campos-movimiento.tsx`,
  ref: `${REV}/dividido`,
  ...A7_BAN,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await page.getByRole('button', { name: tg.agregarLinea }).click();
    await campo(page, tg.montoDeParte('1')).fill('25.00');
    await campo(page, tg.montoDeParte('2')).fill('10.00');
    await elegir(page, tg.categoriaDeParte('2'), 'Farmacia');
    await pausa(page);
  },
});
caso({
  id: 'revisar__pago-de-tarjeta',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/campos-movimiento.tsx`,
  ref: `${REV}/pago-de-tarjeta`,
  ...A7_BAN,
  url: (page) => hrefDe(page, /FARMACIA/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('radio', { name: tb.revisar.tipos.pago_tarjeta }).click();
    await intentar('elegir la tarjeta', () => elegir(page, tg.cuenta, 'Visa Oro'));
    await intentar('elegir el origen', () => elegir(page, tb.revisar.origen, 'Cuenta corriente'));
    await pausa(page);
  },
});
caso({
  id: 'revisar__ingreso',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/campos-movimiento.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Tipo «Ingreso» del segmentado: el diseño trae la opción pero no el estado',
  ...A7_BAN,
  url: (page) => hrefDe(page, /FARMACIA/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('radio', { name: tb.revisar.tipos.ingreso }).click();
    await pausa(page);
  },
});
caso({
  id: 'revisar__devolucion',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/eleccion-compra.tsx`,
  ref: `${REV}/devolucion`,
  ...A7_BAN,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('radio', { name: tb.revisar.tipos.devolucion }).click();
    await expect(page.getByText(tb.revisar.elegirCompra)).toBeVisible();
    await intentar('buscar la compra', () =>
      page.getByRole('searchbox', { name: tb.revisar.buscarCompra }).fill('SUPER'),
    );
    await pausa(page, 1_500);
  },
});
caso({
  id: 'revisar__devolucion-compra-elegida',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/eleccion-compra.tsx`,
  ref: `${REV}/devolucion`,
  nota: 'Con la compra ya elegida',
  ...A7_BAN,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('radio', { name: tb.revisar.tipos.devolucion }).click();
    await page.getByRole('searchbox', { name: tb.revisar.buscarCompra }).fill('SUPER');
    await intentar('elegir la compra', () =>
      page.locator('li button').filter({ hasText: /SUPER/ }).first().click({ timeout: 8_000 }),
    );
    await pausa(page, 600);
  },
});
caso({
  id: 'revisar__sin-conexion',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/formulario.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Sin conexión dentro del flujo: «Aprobar» deshabilitado con su motivo',
  ...A7_BAN,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await page.context().setOffline(true);
    await pausa(page, 800);
  },
});
caso({
  id: 'revisar__error-de-red',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/formulario.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Falla de red al aprobar dentro del flujo',
  ...A7_BAN,
  antes: cortarEscrituras('**/bandeja/*'),
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await intentar('ver «Intentar de nuevo»', () =>
      expect(page.getByRole('button', { name: tf.intentarDeNuevo })).toBeVisible({
        timeout: 20_000,
      }),
    );
  },
});
caso({
  id: 'revisar__aprobando',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/formulario.tsx`,
  ref: `${E1}/S5-Registrar__guardando`,
  nota: 'Enviando: «Aprobando…»; no hay tablero en 01: el más cercano es S5 guardando',
  ...A7_BAN,
  carga: true,
  antes: demorarEscrituras('**/bandeja/*'),
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await expect(panel(page).locator('[data-encabezado-movimiento]')).toBeVisible({
      timeout: 15_000,
    });
    await pausa(page, 800);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await pausa(page, 700);
  },
});
caso({
  id: 'revisar__no-encontrado',
  ruta: RUTA_MOV,
  comp: `${APP}/not-found.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/no-existe`,
  ...A7_BAN,
  url: '/bandeja/00000000-0000-4000-8000-000000000000',
});
caso({
  id: 'revisar__parte-sin-destino',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/campos-movimiento.tsx`,
  ref: `${REV}/parte-sin-destino`,
  ...A7_BAN_ESCRIBE,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await page.getByRole('button', { name: tg.agregarLinea }).click();
    await campo(page, tg.montoDeParte('1')).fill('25.00');
    await campo(page, tg.montoDeParte('2')).fill('10.00');
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await pausa(page, 2_000);
  },
});
caso({
  id: 'revisar__aprobado',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/resultado.tsx`,
  ref: `${REV}/aprobado`,
  ...A7_BAN_ESCRIBE,
  url: (page) => hrefDe(page, /SUPER SELECTOS/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await pausa(page, 600);
  },
});
// Usa la base del caso anterior: SUPER SELECTOS ya aprobado. Su id sale de la Actividad no: se guarda al aprobar.
caso({
  id: 'revisar__ya-aprobado',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/ya-resuelto.tsx`,
  ref: `${REV}/ya-aprobado`,
  ...A7_BAN_ESCRIBE,
  url: async (page) => {
    const href = await hrefDe(page, /SUPER SELECTOS/);
    await page.goto(href);
    await revisarListo(page);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    return href;
  },
  pasos: revisarListo,
});
caso({
  id: 'revisar__descartado',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/descartado.tsx`,
  ref: `${REV}/ya-descartado`,
  nota: 'Resultado de «Descartar» dentro del flujo; el tablero más cercano es ya-descartado',
  ...A7_BAN_ESCRIBE,
  url: (page) => hrefDe(page, /FARMACIA/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('button', { name: tc.bandeja.descartar, exact: true }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
    await pausa(page, 600);
  },
});
// Usa la base del caso anterior: FARMACIA descartada.
caso({
  id: 'revisar__ya-descartado',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/ya-resuelto.tsx`,
  ref: `${REV}/ya-descartado`,
  url: async (page) => {
    await page.goto('/bandeja?vista=descartados');
    await quieta(page);
    const id = await page
      .locator('[data-vista="descartado"]')
      .first()
      .getAttribute('data-movimiento');
    return `/bandeja/${id ?? ''}`;
  },
  pasos: revisarListo,
});
caso({
  id: 'revisar__confirmar-periodo-cerrado',
  ruta: RUTA_MOV,
  comp: 'apps/web/src/componentes/formularios/confirmacion-impacto-de-vista.tsx',
  ref: `${TIP}/retroactivo`,
  nota: 'AV-01 al aprobar un SMS de un período cerrado; no hay tablero en 01-revisar-movimiento: el más cercano es 12/retroactivo',
  ops: [...BASE, ...HISTORIAL, sms('a', 'Super', 30, '19:00')],
  hoy: DIA,
  hoyServidor: '2027-02-21',
  url: (page) => hrefDe(page, /\$30\.00/),
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page)
      .getByRole('button', { name: /^Aprobar/ })
      .click();
    await expect(page.getByRole('heading', { name: tb.revisar.revisarImpacto })).toBeVisible();
    await pausa(page);
  },
});
caso({
  id: 'bandeja__muchos',
  ruta: '/bandeja',
  comp: `${APP}/bandeja/lista.tsx`,
  ref: `${E1}/S4-Bandeja`,
  nota: 'Doce movimientos',
  ops: DOCE,
  hoy: DIA,
  soloLectura: true,
});
caso({
  id: 'revisar__muchos',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/panel-navegacion.tsx`,
  ref: `${REV}/listo`,
  nota: 'Doce movimientos: en computadora, la lista larga a la izquierda y el panel con «1 de 12»',
  ops: DOCE,
  hoy: DIA,
  soloLectura: true,
  url: async (page) => {
    await irABandeja(page);
    return `/bandeja/${(await filas(page).first().getAttribute('data-movimiento')) ?? ''}`;
  },
  pasos: revisarListo,
});
caso({
  id: 'revisar__sin-cuentas',
  ruta: RUTA_MOV,
  comp: `${FL}/bandeja-movimiento/sin-cuentas-movimiento.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Un SMS no reconocido cuando no hay ninguna cuenta: «Registrar a mano» lleva a la guía',
  ops: [],
  hoy: DIA,
  antes: async (page) => {
    const token = await tokenWebhook(page);
    await enviarSms(page, token, 'Mensaje sin formato de MacroDroid');
    await esperarFilas(page, '[data-movimiento]', 1);
  },
  url: async (page) => {
    await irABandeja(page);
    return `/bandeja/${(await filas(page).first().getAttribute('data-movimiento')) ?? ''}`;
  },
  pasos: async (page) => {
    await revisarListo(page);
    await panel(page).getByRole('button', { name: tc.bandeja.registrarAMano }).click();
    await expect(page.getByText(tg.sinCuentasTitulo)).toBeVisible();
    await pausa(page);
  },
});

// ═════════════════════════════ REGISTRAR · selector y tipos ═════════════════════════════

// Usa la base del caso anterior (sin cuentas).
caso({
  id: 'registrar__sin-cuentas',
  ruta: '/registrar',
  comp: `${FL}/registrar/lector.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Selector sin ninguna cuenta; lo más cercano es S1-Inicio__primer-uso-sin-cuentas',
});
caso({
  id: 'registrar-gasto__sin-cuentas',
  ruta: '/registrar/gasto',
  comp: `${FL}/registrar-gasto/sin-cuentas.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Registrar gasto sin ninguna cuenta',
  pasos: async (page) => {
    await expect(page.getByText(tg.sinCuentasTitulo)).toBeVisible({ timeout: 15_000 });
  },
});
caso({
  id: 'registrar__transferencia-una-cuenta',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Transferencia con una sola cuenta de efectivo: «Necesitás dos cuentas de efectivo»',
  ops: [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 0 }],
  hoy: '2027-02-05',
  soloLectura: true,
  url: '/registrar/transferencia',
});
caso({
  id: 'registrar__no-encontrado',
  ruta: '/registrar/[tipo]',
  comp: `${APP}/not-found.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla/no-existe`,
  ops: [{ op: 'OP-01', cuenta: 'Ahorro', saldo: 0 }],
  hoy: '2027-02-05',
  soloLectura: true,
  url: '/registrar/inexistente',
});
caso({
  id: 'registrar__selector',
  ruta: '/registrar',
  comp: `${FL}/registrar/lector.tsx`,
  ref: `${TIP}/selector`,
  ...A7_REG,
});
caso({
  id: 'registrar__cargando',
  ruta: '/registrar',
  comp: `${APP}/registrar/loading.tsx`,
  ref: `${E2}/15-inicio-y-presupuesto-piezas-nuevas/cargando`,
  nota: 'Carga de /registrar al navegar desde Inicio (loading.tsx de (finn)); la referencia es la más cercana, si existe',
  ...A7_REG,
  carga: true,
  url: '/',
  antes: async (page) => {
    await page.route(/\/registrar(\?.*)?$/, async (route) => {
      if (route.request().headers()['rsc'] === undefined) return route.continue();
      await new Promise((r) => setTimeout(r, 30_000));
      await route.abort('failed').catch(() => undefined);
    });
  },
  pasos: async (page) => {
    await pausa(page, 1_500);
    await page
      .getByRole('link', { name: /Registrar/ })
      .first()
      .click();
    await pausa(page, 1_200);
  },
});
caso({
  id: 'registrar__ingreso',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: `${TIP}/ingreso`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoIngreso)(page);
    await intentar('elegir la cuenta', () =>
      radio(page, tt.cuentaIngreso, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await campo(page, tt.total).fill('925.00');
    await campo(page, tt.descripcion).fill('Salario quincena');
    await pausa(page);
  },
});
caso({
  id: 'registrar__ingreso-pagina',
  ruta: '/registrar/[tipo]',
  comp: `${APP}/registrar/[tipo]/page.tsx`,
  ref: `${TIP}/ingreso`,
  nota: 'El mismo flujo abierto con su URL (recarga o enlace directo): página completa en lugar de hoja',
  ...A7_REG,
  url: '/registrar/ingreso',
});
caso({
  id: 'registrar__ingreso-validacion',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: `${TIP}/transferencia-misma-cuenta`,
  nota: 'Guardar sin datos: los errores de cada campo (la referencia de error más cercana es transferencia-misma-cuenta)',
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoIngreso)(page);
    await page.getByRole('button', { name: /^Guardar/ }).click();
    await pausa(page, 800);
  },
});
caso({
  id: 'registrar__retroactivo',
  ruta: '/registrar/[tipo]',
  comp: 'apps/web/src/componentes/formularios/confirmacion-impacto-de-vista.tsx',
  ref: `${TIP}/retroactivo`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoIngreso)(page);
    await intentar('elegir la cuenta', () =>
      radio(page, tt.cuentaIngreso, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await campo(page, tt.fecha).fill('2026-09-10');
    await campo(page, tt.total).fill('925.00');
    await campo(page, tt.descripcion).fill('Salario quincena');
    await page.getByRole('button', { name: /^Guardar/ }).click();
    await expect(page.getByRole('heading', { name: tt.revisar })).toBeVisible({ timeout: 15_000 });
    await pausa(page);
  },
});
caso({
  id: 'registrar__transferencia',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: `${TIP}/transferencia`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoTransferencia)(page);
    await intentar('origen', () =>
      radio(page, tt.origen, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await intentar('destino', () =>
      radio(page, tt.destino, 'Cuenta de ahorro').click({ timeout: 5_000 }),
    );
    await campo(page, tt.total).fill('200.00');
    await pausa(page);
  },
});
caso({
  id: 'registrar__transferencia-misma-cuenta',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: `${TIP}/transferencia-misma-cuenta`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoTransferencia)(page);
    await intentar('origen', () =>
      radio(page, tt.origen, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await intentar('destino', () =>
      radio(page, tt.destino, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await campo(page, tt.total).fill('200.00');
    await page.getByRole('button', { name: tt.guardarTransferencia }).click();
    await pausa(page, 1_500);
  },
});
caso({
  id: 'registrar__devolucion',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/devolucion.tsx`,
  ref: `${TIP}/devolucion`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await page
      .getByRole('link', { name: new RegExp(`^${tv.tipo.titulo}`) })
      .first()
      .click();
    await expect(page.getByRole('heading', { level: 1, name: tv.titulo })).toBeVisible({
      timeout: 15_000,
    });
    await pausa(page, 1_500);
    await quieta(page);
  },
});
caso({
  id: 'registrar__devolucion-compra-elegida',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/devolucion.tsx`,
  ref: `${TIP}/devolucion`,
  nota: 'Con una compra elegida de la lista',
  ...A7_REG,
  url: '/registrar/devolucion',
  pasos: async (page) => {
    await pausa(page, 1_500);
    await intentar('elegir la primera compra', () =>
      page.locator('main li button, main li a').first().click({ timeout: 8_000 }),
    );
    await pausa(page, 1_000);
  },
});
caso({
  id: 'registrar__devolucion-sin-compra',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/devolucion.tsx`,
  ref: `${TIP}/devolucion`,
  nota: '«Sin compra original»: cuenta y categoría',
  ...A7_REG,
  url: '/registrar/devolucion',
  pasos: async (page) => {
    await pausa(page, 1_500);
    await intentar('elegir «Sin compra original»', () =>
      page
        .getByRole('button', { name: tv.sinCompra })
        .or(page.getByText(tv.sinCompra))
        .first()
        .click({ timeout: 8_000 }),
    );
    await pausa(page, 1_000);
  },
});
caso({
  id: 'registrar__inversion',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/inversion-formulario.tsx`,
  ref: `${TIP}/inversion`,
  nota: 'Aporte',
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(ti.tipoAporte)(page);
    await intentar('inversión', () =>
      radio(page, ti.inversion, /Depósito/).click({ timeout: 5_000 }),
    );
    await intentar('cuenta', () =>
      radio(page, ti.cuentaAporte, 'Cuenta de ahorro').click({ timeout: 5_000 }),
    );
    await intentar('categoría', () =>
      radio(page, ti.categoria, 'Fondo de emergencia').click({ timeout: 5_000 }),
    );
    await campo(page, ti.monto).fill('200.00');
    await pausa(page);
  },
});
caso({
  id: 'registrar__inversion-retiro',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/inversion-formulario.tsx`,
  ref: `${TIP}/inversion`,
  nota: 'Retiro: en el diseño es una opción dentro de «Inversión»',
  ...A7_REG,
  url: '/registrar',
  pasos: abrirTipo(ti.tipoRetiro),
});
caso({
  id: 'registrar__inversion-ajuste',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/inversion-formulario.tsx`,
  ref: `${TIP}/inversion`,
  nota: 'Ajuste de valor: en el diseño es una opción dentro de «Inversión»',
  ...A7_REG,
  url: '/registrar',
  pasos: abrirTipo(ti.tipoAjuste),
});
caso({
  id: 'registrar__desembolso',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario-desembolso.tsx`,
  ref: `${TIP}/desembolso`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(td.tipo.titulo)(page);
    await intentar('préstamo', () =>
      radio(page, td.prestamo, /Préstamo/).click({ timeout: 5_000 }),
    );
    await intentar('cuenta', () =>
      radio(page, td.cuenta, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await intentar('monto', () => campo(page, tt.total).fill('5000.00', { timeout: 5_000 }));
    await pausa(page);
  },
});
caso({
  id: 'registrar__avance',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario-tarjeta.tsx`,
  ref: `${TIP}/avance`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tk.tipos.avance.titulo)(page);
    await intentar('tarjeta', () =>
      radio(page, tk.tarjetaAvance, 'Visa Oro').click({ timeout: 5_000 }),
    );
    await intentar('cuenta', () =>
      radio(page, tk.cuentaAvance, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await intentar('monto', () => campo(page, tt.total).fill('100.00', { timeout: 5_000 }));
    await pausa(page);
  },
});
caso({
  id: 'registrar__transferencia-deuda',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario-tarjeta.tsx`,
  ref: `${TIP}/transferencia-deuda`,
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tk.tipos.deuda.titulo)(page);
    await intentar('origen', () =>
      radio(page, tk.tarjetaOrigen, 'Visa Oro').click({ timeout: 5_000 }),
    );
    await intentar('destino', () =>
      radio(page, tk.tarjetaDestino, /Mastercard/).click({ timeout: 5_000 }),
    );
    await intentar('monto', () => campo(page, tt.total).fill('200.00', { timeout: 5_000 }));
    await pausa(page);
  },
});
caso({
  id: 'registrar__entrada-tarjeta',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario-tarjeta.tsx`,
  ref: 'SIN DISEÑO',
  nota: '«Dinero que entra a una tarjeta» no está en el selector del diseño (12 · selector)',
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tk.tipos.entrada.titulo)(page);
    await intentar('tarjeta', () =>
      radio(page, tk.tarjetaEntrada, 'Visa Oro').click({ timeout: 5_000 }),
    );
    await intentar('monto', () => campo(page, tt.total).fill('25.00', { timeout: 5_000 }));
    await pausa(page);
  },
});
caso({
  id: 'registrar__avance-confirmar',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario-tarjeta.tsx`,
  ref: `${TIP}/retroactivo`,
  nota: '«Revisá el cambio» (AV-24) antes de guardar un movimiento de tarjeta; la referencia más cercana es retroactivo',
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tk.tipos.avance.titulo)(page);
    await intentar('tarjeta', () =>
      radio(page, tk.tarjetaAvance, 'Visa Oro').click({ timeout: 5_000 }),
    );
    await intentar('cuenta', () =>
      radio(page, tk.cuentaAvance, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await intentar('monto', () => campo(page, tt.total).fill('100.00', { timeout: 5_000 }));
    await page.getByRole('button', { name: tk.flujos.avance.guardar }).click();
    await pausa(page, 2_500);
  },
});
caso({
  id: 'registrar__ingreso-sin-conexion',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Sin conexión con la hoja de un flujo corto abierta',
  ...A7_REG,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoIngreso)(page);
    await page.context().setOffline(true);
    await pausa(page, 800);
  },
});
caso({
  id: 'registrar__ingreso-guardado',
  ruta: '/registrar/[tipo]',
  comp: `${FL}/registrar-tipo/formulario.tsx`,
  ref: `${E1}/S5-Registrar__guardado`,
  nota: 'Resultado de un flujo corto; no hay tablero en 12: el resultado más cercano es S5 guardado',
  ...A7_REG_ESCRIBE,
  url: '/registrar',
  pasos: async (page) => {
    await abrirTipo(tg.tipoIngreso)(page);
    await intentar('elegir la cuenta', () =>
      radio(page, tt.cuentaIngreso, 'Cuenta corriente').click({ timeout: 5_000 }),
    );
    await campo(page, tt.total).fill('925.00');
    await campo(page, tt.descripcion).fill('Salario quincena');
    await page.getByRole('button', { name: /^Guardar/ }).click();
    await expect(page.getByTestId('resultado')).toBeVisible({ timeout: 15_000 });
    await pausa(page, 600);
  },
});

// ═════════════════════════════ REGISTRAR GASTO ═════════════════════════════

const GASTO = { ruta: '/registrar/gasto', comp: `${FL}/registrar-gasto/formulario.tsx` } as const;

caso({
  id: 'registrar-gasto__inicial',
  ...GASTO,
  ref: `${E1}/S5-Registrar`,
  nota: 'Recién abierto, sin datos',
  ...A7_REG,
  pasos: async (page) => {
    await expect(page.locator('[data-campo-lineas]')).toBeVisible({ timeout: 15_000 });
  },
});
caso({
  id: 'registrar-gasto__principal',
  ...GASTO,
  ref: `${E1}/S5-Registrar`,
  ...A7_REG,
  pasos: (page) => llenarGasto(page, S5),
});
caso({
  id: 'registrar-gasto__una-linea',
  ...GASTO,
  ref: `${E1}/S5-Registrar__una-linea`,
  ...A7_REG,
  pasos: (page) =>
    llenarGasto(page, { ...S5, lineas: [{ destino: 'Supermercado', monto: '148.60' }] }),
});
caso({
  id: 'registrar-gasto__suma-distinta-del-total',
  ...GASTO,
  ref: `${E1}/S5-Registrar__suma-distinta-del-total`,
  ...A7_REG,
  pasos: (page) =>
    llenarGasto(page, {
      ...S5,
      lineas: [S5.lineas[0], S5.lineas[1], { destino: tg.porCobrarA('Carlos'), monto: '20.00' }],
    }),
});
caso({
  id: 'registrar-gasto__suma-rechazada',
  ...GASTO,
  ref: `${E1}/S5-Registrar__suma-distinta-del-total`,
  nota: 'Después de tocar Guardar con la suma distinta: el rechazo del servidor junto a las líneas',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, {
      ...S5,
      lineas: [S5.lineas[0], S5.lineas[1], { destino: tg.porCobrarA('Carlos'), monto: '20.00' }],
    });
    await guardarGasto(page).click();
    await pausa(page, 2_000);
  },
});
caso({
  id: 'registrar-gasto__monto-mal-escrito',
  ...GASTO,
  ref: `${E1}/S5-Registrar__monto-mal-escrito`,
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, { ...S5, total: '1.486,0' });
    await campo(page, tg.total).focus();
    await campo(page, tg.comercio).focus();
    await pausa(page);
  },
});
caso({
  id: 'registrar-gasto__validacion',
  ...GASTO,
  ref: `${E1}/S5-Registrar__monto-mal-escrito`,
  nota: 'Guardar sin datos: los errores de cada campo',
  ...A7_REG,
  pasos: async (page) => {
    await expect(page.locator('[data-campo-lineas]')).toBeVisible({ timeout: 15_000 });
    await intentar('dejar la cuenta sin elegir', () =>
      campo(page, tg.cuenta).selectOption({ index: 0 }),
    );
    await guardarGasto(page).click();
    await pausa(page, 1_000);
  },
});
caso({
  id: 'registrar-gasto__otra-persona',
  ...GASTO,
  ref: `${E1}/S5-Registrar`,
  nota: 'Una línea por cobrar a «Otra persona»: aparece el campo del nombre',
  ...A7_REG,
  pasos: (page) =>
    llenarGasto(page, {
      ...S5,
      lineas: [
        S5.lineas[0],
        S5.lineas[1],
        { destino: tg.porCobrarA(tg.otraPersona), monto: '30.00' },
      ],
    }),
});
caso({
  id: 'registrar-gasto__calendario',
  ...GASTO,
  ref: '02-referencias/entrega-2/componentes/P1-03-entradafecha-campo-dd-mm-aaaa-con-calend',
  nota: 'EntradaFecha con el calendario abierto',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await page.getByRole('button', { name: 'Elegir en el calendario' }).click();
    await expect(page.getByRole('dialog', { name: 'Calendario' })).toBeVisible();
    await pausa(page);
  },
});
caso({
  id: 'registrar-gasto__fecha-no-existe',
  ...GASTO,
  ref: '02-referencias/entrega-2/componentes/P1-03-entradafecha-campo-dd-mm-aaaa-con-calend',
  nota: 'EntradaFecha con error de formato',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await campo(page, tg.fecha).fill('');
    await campo(page, tg.fecha).pressSequentially('31022026');
    await pausa(page);
  },
});
caso({
  id: 'registrar-gasto__fecha-posterior',
  ...GASTO,
  ref: '02-referencias/entrega-2/componentes/P1-03-entradafecha-campo-dd-mm-aaaa-con-calend',
  nota: 'Fecha posterior a hoy: el rechazo del servidor en el campo',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await campo(page, tg.fecha).fill('2026-10-20');
    await guardarGasto(page).click();
    await pausa(page, 2_000);
  },
});
caso({
  id: 'registrar-gasto__fecha-en-periodo-cerrado',
  ...GASTO,
  ref: `${E1}/S5-Registrar__fecha-en-periodo-cerrado`,
  nota: 'El formulario con la fecha de un período cerrado, antes de tocar Guardar',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await campo(page, tg.fecha).fill('2026-09-10');
    await campo(page, tg.comercio).focus();
    await pausa(page, 800);
  },
});
caso({
  id: 'registrar-gasto__confirmar-periodo-cerrado',
  ...GASTO,
  comp: 'apps/web/src/componentes/formularios/confirmacion-impacto-de-vista.tsx',
  ref: `${E1}/S5-Registrar__fecha-en-periodo-cerrado`,
  nota: 'Después de tocar Guardar: la pantalla «Revisá el impacto» con el aviso',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await campo(page, tg.fecha).fill('2026-09-10');
    await guardarGasto(page).click();
    await expect(page.getByRole('heading', { name: tg.revisar })).toBeVisible({ timeout: 15_000 });
    await pausa(page);
  },
});
caso({
  id: 'registrar-gasto__guardando',
  ...GASTO,
  ref: `${E1}/S5-Registrar__guardando`,
  ...A7_REG,
  carga: true,
  antes: demorarEscrituras('**/registrar/gasto'),
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await guardarGasto(page).click();
    await pausa(page, 700);
  },
});
caso({
  id: 'registrar-gasto__error-de-red',
  ...GASTO,
  ref: 'SIN DISEÑO',
  nota: 'Falla de red al guardar: aviso de problema con «Intentar de nuevo»',
  ...A7_REG,
  antes: cortarEscrituras('**/registrar/gasto'),
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await guardarGasto(page).click();
    await intentar('ver «Intentar de nuevo»', () =>
      expect(page.getByRole('button', { name: tf.intentarDeNuevo })).toBeVisible({
        timeout: 20_000,
      }),
    );
  },
});
caso({
  id: 'registrar-gasto__sin-conexion',
  ...GASTO,
  ref: 'SIN DISEÑO',
  nota: 'Sin conexión dentro del flujo: Guardar deshabilitado con su motivo',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await page.context().setOffline(true);
    await pausa(page, 800);
  },
});
caso({
  id: 'registrar-gasto__borrador',
  ...GASTO,
  comp: `${FL}/registrar-gasto/borrador-gasto.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES · borrador: «Recuperamos lo que estabas escribiendo»',
  ...A7_REG,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await expect
      .poll(() =>
        page.evaluate(() =>
          Object.entries<string>(sessionStorage as unknown as Record<string, string>).some(
            ([k, v]) => k.startsWith('finn:borrador:') && v.includes('PRICESMART'),
          ),
        ),
      )
      .toBe(true);
    await page.reload();
    await quieta(page);
    await expect(page.getByText(tf.borradorRecuperado)).toBeVisible({ timeout: 15_000 });
    await pausa(page);
  },
});
caso({
  id: 'registrar-gasto__sugerencia-al-escribir',
  ...GASTO,
  ref: `${E1}/S5-Registrar__sugerencia-al-escribir`,
  nota: 'Con la compra de SUPER SELECTOS ESCALON aprobada desde un SMS: la sugerencia sale de ese historial',
  ...A7_BAN,
  pasos: async (page) => {
    await llenarGasto(page, { cuenta: 'Visa Oro', total: '35.00' });
    await campo(page, tg.comercio).pressSequentially('SUPER SELECTOS ESCALON', { delay: 15 });
    await intentar('ver la sugerencia', () =>
      expect(page.getByTestId('sugerencia')).toBeVisible({ timeout: 10_000 }),
    );
    await pausa(page);
  },
});
caso({
  id: 'registrar-gasto__guardado',
  ...GASTO,
  comp: `${FL}/registrar-gasto/resultado-gasto.tsx`,
  ref: `${E1}/S5-Registrar__guardado`,
  ...A7_REG_ESCRIBE,
  pasos: async (page) => {
    await llenarGasto(page, S5);
    await guardarGasto(page).click();
    await expect(page.getByTestId('resultado')).toBeVisible({ timeout: 15_000 });
    await pausa(page, 600);
  },
});

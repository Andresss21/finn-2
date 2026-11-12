// Auditoría de diseño · sección CTA (Cuentas: lista, detalle por tipo, nueva cuenta y todos sus flujos).
// Los casos de solo lectura comparten la semilla A.7 ampliada (préstamo, inversión y una conciliación con diferencia, como en
// las referencias). Los que escriben (archivar, crear, pagar, conciliar, condiciones) van al final, cada uno con su siembra.
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
  type TestInfo,
} from '../lib.ts';
import { cuentasNueva as n } from '../../../apps/web/src/textos/cuentas-nueva.ts';
import { cuentaSubtipo as s } from '../../../apps/web/src/textos/cuenta-subtipo.ts';
import { cuentaDetalle as d } from '../../../apps/web/src/textos/cuenta-detalle.ts';
import { cuentasGestion as g } from '../../../apps/web/src/textos/cuentas-gestion.ts';
import { cuentasPagar as tp } from '../../../apps/web/src/textos/cuentas-pagar.ts';
import { cuentasCuota as tc } from '../../../apps/web/src/textos/cuentas-cuota.ts';
import { verificarSaldo as tv } from '../../../apps/web/src/textos/verificar-saldo.ts';
import { conciliar as tk } from '../../../apps/web/src/textos/conciliar.ts';
import { cuentasCondiciones as tcond } from '../../../apps/web/src/textos/cuentas-condiciones.ts';

const HOY = '2026-10-15';
const E2 = '02-referencias/entrega-2/pantallas/06-detalle-de-cuenta';
const E1 = '02-referencias/entrega-1/pantallas';
const APP = 'apps/web/src/app/(finn)/cuentas';
const FLU = 'apps/web/src/flujos';

// ── Semillas ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const a7 = escenarioA7();
/** A.7 con los últimos 4 de las referencias, el préstamo, la inversión y el estado de cuenta del 30/09 con $12.40 de diferencia. */
const opsA7X = (extra: Op[] = []): Op[] => [
  ...(a7.estadoInicial ?? []).map((op): Op =>
    op.op === 'OP-01' && op.cuenta === 'Visa Oro'
      ? { ...op, ultimos4: '4821' }
      : op.op === 'OP-01' && op.cuenta === 'Cuenta corriente'
        ? { ...op, ultimos4: '3310' }
        : op,
  ),
  {
    op: 'OP-01',
    cuenta: 'Préstamo personal',
    tipo: 'prestamo',
    saldo: 4210,
    apertura: HOY,
    prestamo: {
      contraparte: 'Banco Agrícola',
      montoOriginal: 6000,
      cuota: 210,
      plazoCuotas: 36,
      cuotasPagadas: 13,
    },
    hoy: HOY,
  },
  {
    op: 'OP-01',
    cuenta: 'Depósito a plazo',
    tipo: 'inversion',
    saldo: 2075.6,
    apertura: HOY,
    hoy: HOY,
  },
  {
    op: 'OP-47',
    cuenta: 'Cuenta corriente',
    fecha: '2026-09-30',
    saldo: 678.15,
    movimientos: [],
    coincidencias: [],
    hoy: HOY,
  },
  ...extra,
];
const escenarioX = (id: string, extra: Op[] = []): Escenario => ({
  ...a7,
  id,
  estadoInicial: opsA7X(extra),
});
const A7 = { escenario: escenarioX('SEM-A7-CTA'), hoyServidor: HOY, soloLectura: true } as const;

// ── Ayudas ──────────────────────────────────────────────────────────────────────────────────────────────────────────────
const campo = (page: Page, etiqueta: string) => page.getByLabel(etiqueta, { exact: true });
const radio = (page: Page, grupo: string, nombre: string, exacto = true) =>
  page.getByRole('radiogroup', { name: grupo }).getByRole('radio', { name: nombre, exact: exacto });
const boton = (page: Page, nombre: string | RegExp) =>
  page.getByRole('button', { name: nombre, exact: true });

/** El id de la cuenta `nombre`, leído de Cuentas como lo haría la persona (la tarjeta de atrás se trae al frente). */
async function idDe(page: Page, nombre: string, archivadas = false): Promise<string> {
  await page.goto(archivadas ? '/cuentas?archivadas=1' : '/cuentas');
  await quieta(page);
  const enlace = page.locator('main a[href^="/cuentas/"]').filter({ hasText: nombre });
  if ((await enlace.count()) === 0)
    await page
      .locator('[data-billetera] button')
      .filter({ hasText: nombre })
      .first()
      .click({ position: { x: 90, y: 18 } });
  const href = await enlace.first().getAttribute('href');
  return (href ?? '').split('/')[2] ?? '';
}
const de =
  (nombre: string, sufijo = '') =>
  async (page: Page) =>
    `/cuentas/${await idDe(page, nombre)}${sufijo}`;

const meta = (ruta: string, comp: string, ref: string, nota?: string) => ({
  ruta,
  comp,
  ref,
  ...(nota === undefined ? {} : { nota }),
});

/** Espera a que React haya hidratado un control nativo antes de cambiarlo. */
async function hidratado(page: Page, etiqueta: string): Promise<void> {
  await expect
    .poll(() =>
      campo(page, etiqueta).evaluate((el) =>
        Object.keys(el).some((k) => k.startsWith('__reactProps$')),
      ),
    )
    .toBe(true);
}

const CSV_VISA = [
  'Pro000000000000duct,VISA 4821',
  'Fecha de corte,15/10/2026',
  'Saldo final,652.18',
  'Date,Description,Reference,Amount',
  '14/10/2026,PUMA SANTA ELENA,,30.00',
  '15/10/2026,SUPER SELECTOS ESCALON,,35.00',
  '13/10/2026,COMPRA SOLO EN EL ESTADO,,10.00',
  '',
].join('\n');

async function subirCsv(page: Page, contenido: string, nombre = 'estado.csv'): Promise<void> {
  await campo(page, tk.archivo).setInputFiles({
    name: nombre,
    mimeType: 'text/csv',
    buffer: Buffer.from(contenido, 'utf8'),
  });
  await boton(page, tk.revisar).click();
}

async function llenarTarjeta(page: Page, nombre: string, ultimos4: string): Promise<void> {
  await expect(campo(page, n.limiteCredito)).toBeVisible();
  await campo(page, n.nombre).fill(nombre);
  await page.getByRole('radio', { name: 'BAC', exact: true }).click();
  await campo(page, n.ultimos4).fill(ultimos4);
  await campo(page, n.saldo.tarjeta).fill('642.18');
  await campo(page, n.limiteCredito).fill('2500');
  await campo(page, n.tasaAnual).fill('38');
  await campo(page, n.diaCorte).fill('25');
  await campo(page, n.diaPago).fill('15');
  await radio(page, n.red, n.redes.visa).click();
}

// ═══ Cuentas (lista) ════════════════════════════════════════════════════════════════════════════════════════════════════
caso({
  id: 'cuentas__principal',
  ruta: '/cuentas',
  comp: `${APP}/pantalla.tsx`,
  ref: `${E1}/S6-Cuentas`,
  ...A7,
});
caso({
  id: 'cuentas__mastercard-al-frente',
  ruta: '/cuentas',
  comp: 'apps/web/src/componentes/dominio/billetera.tsx',
  ref: `${E1}/S6-Cuentas__tarjeta-con-saldo-a-favor-mastercard-al-frente`,
  nota: 'A.7: Mastercard sin deuda al frente (estado «Sin deuda»). El saldo a favor está en cuentas__saldo-a-favor.',
  ...A7,
  pasos: async (page) => {
    await page
      .locator('[data-billetera] button')
      .filter({ hasText: 'Mastercard' })
      .click({ position: { x: 90, y: 18 } });
    await expect(page.locator('[data-detalle-tarjeta]')).toContainText('Sin deuda');
  },
});
caso({
  id: 'cuentas__archivadas-sin-ninguna',
  ruta: '/cuentas?archivadas=1',
  comp: `${APP}/pantalla.tsx`,
  ref: `${E1}/S6-Cuentas__archivadas-visibles`,
  nota: 'Interruptor encendido sin ninguna cuenta archivada.',
  ...A7,
});
caso({
  id: 'cuentas__sin-conexion',
  ruta: '/cuentas',
  comp: `${APP}/pantalla.tsx`,
  ref: '02-referencias/entrega-2/pantallas/14-sin-conexion-404-y-error-de-pantalla/sin-conexion-en-la-app',
  ...A7,
  pasos: async (page) => {
    await page.context().setOffline(true);
    await expect(page.getByText(/sin conexión/i).first())
      .toBeVisible({ timeout: 8000 })
      .catch(() => undefined);
  },
});

// ═══ Detalle de cuenta ══════════════════════════════════════════════════════════════════════════════════════════════════
caso({
  id: 'cuenta__corriente',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/pantalla.tsx`,
  ref: `${E2}/corriente`,
  ...A7,
  url: de('Cuenta corriente'),
});
caso({
  id: 'cuenta__efectivo-sin-diferencia',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/pantalla.tsx`,
  ref: `${E2}/corriente`,
  nota: 'Cuenta de ahorro de A.7 (la semilla la crea con subtipo corriente): sin conciliaciones, con una programada.',
  ...A7,
  url: de('Cuenta de ahorro'),
});
caso({
  id: 'cuenta__tarjeta',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/por-tipo.tsx`,
  ref: `${E2}/tarjeta`,
  ...A7,
  url: de('Visa Oro'),
});
caso({
  id: 'cuenta__tarjeta-sin-deuda',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/por-tipo.tsx`,
  ref: `${E2}/tarjeta`,
  nota: 'Mastercard Clásica de A.7: sin deuda y sin movimientos (cara plata).',
  ...A7,
  url: de('Mastercard Clásica'),
});
caso({
  id: 'cuenta__prestamo',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/por-tipo.tsx`,
  ref: `${E2}/prestamo`,
  nota: 'Préstamo sin modelo de cálculo (sin tabla). Con tabla: cuenta__prestamo-con-amortizacion.',
  ...A7,
  url: de('Préstamo personal'),
});
caso({
  id: 'cuenta__inversion',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/cabecera.tsx`,
  ref: `${E2}/inversion`,
  ...A7,
  url: de('Depósito a plazo'),
});
caso({
  id: 'cuenta__mas-acciones',
  ruta: '/cuentas/[cuentaId]',
  comp: 'apps/web/src/componentes/marco/mas-acciones.tsx',
  ref: `${E2}/mas-acciones`,
  ...A7,
  url: de('Cuenta corriente'),
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Más acciones' }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();
  },
});
caso({
  id: 'cuenta__mas-acciones-tarjeta',
  ruta: '/cuentas/[cuentaId]',
  comp: 'apps/web/src/componentes/marco/mas-acciones.tsx',
  ref: `${E2}/mas-acciones-tarjeta`,
  ...A7,
  url: de('Visa Oro'),
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Más acciones' }).first().click();
    await expect(page.getByRole('menu')).toBeVisible();
  },
});
caso({
  id: 'cuenta__filtro-sin-resultados',
  ruta: '/cuentas/[cuentaId]?tipo=cobro',
  comp: `${APP}/[cuentaId]/movimientos.tsx`,
  ref: `${E2}/vacia`,
  nota: 'Filtros de tipo y estado del detalle: sin referencia propia.',
  ...A7,
  url: de('Cuenta corriente', '?tipo=cobro'),
});
caso({
  id: 'cuenta__periodo-anterior',
  ruta: '/cuentas/[cuentaId]?periodo=2026-08-21',
  comp: `${APP}/[cuentaId]/pantalla.tsx`,
  ref: `${E2}/corriente`,
  nota: 'Selector de período dentro del detalle: sin referencia propia.',
  ...A7,
  url: de('Cuenta corriente', '?periodo=2026-08-21'),
});
caso({
  id: 'cuenta__no-encontrada',
  ruta: '/cuentas/[cuentaId]',
  comp: 'apps/web/src/app/(finn)/not-found.tsx',
  ref: '02-referencias/entrega-2/pantallas/14-sin-conexion-404-y-error-de-pantalla/no-encontrado',
  ...A7,
  url: '/cuentas/00000000-0000-4000-8000-0000000000ff',
});

// ═══ Nueva cuenta ═══════════════════════════════════════════════════════════════════════════════════════════════════════
const NUEVA = { ruta: '/cuentas/nueva', comp: `${FLU}/cuentas-nueva/formulario.tsx` } as const;
caso({
  id: 'cuenta-nueva__inicial',
  ...NUEVA,
  ref: `${E2}/nueva-tipo`,
  nota: 'La app no tiene el paso «¿Qué tipo de cuenta es?»: abre el formulario de efectivo · corriente.',
  ...A7,
});
caso({
  id: 'cuenta-nueva__efectivo-ahorro',
  ...NUEVA,
  ref: `${E2}/nueva-tarjeta`,
  nota: 'DECISIONES «Cuentas de efectivo»: segmentado Corriente · Ahorro · Billetera.',
  ...A7,
  pasos: async (page) => {
    await radio(page, s.etiqueta, s.opciones.ahorro).click();
    await campo(page, n.saldo.efectivo).fill('3120');
  },
});
caso({
  id: 'cuenta-nueva__efectivo-billetera',
  ...NUEVA,
  ref: `${E2}/nueva-tarjeta`,
  nota: 'DECISIONES «Cuentas de efectivo»: billetera sin institución ni últimos 4.',
  ...A7,
  pasos: async (page) => {
    await radio(page, s.etiqueta, s.opciones.billetera).click();
    await campo(page, n.saldo.efectivo).fill('40');
  },
});
caso({
  id: 'cuenta-nueva__tarjeta',
  ...NUEVA,
  ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
  url: '/cuentas/nueva?tipo-cuenta=tarjeta',
  ref: `${E2}/nueva-tarjeta`,
  ...A7,
  pasos: async (page, info) => {
    await expect(campo(page, n.limiteCredito)).toBeVisible();
    await capturar(page, info, 'cuenta-nueva__tarjeta-sin-llenar', {
      ...NUEVA,
      ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
      ref: `${E2}/nueva-tarjeta`,
      nota: 'Tarjeta recién elegida, sin datos.',
    });
    await llenarTarjeta(page, 'Visa Platino', '9912');
  },
});
caso({
  id: 'cuenta-nueva__color-oro',
  ...NUEVA,
  comp: `${FLU}/cuentas-nueva/color-tarjeta.tsx`,
  ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
  url: '/cuentas/nueva?tipo-cuenta=tarjeta',
  ref: `${E2}/nueva-tarjeta`,
  nota: 'DECISIONES «Tarjetas de crédito»: 8 colores con vista previa en vivo.',
  ...A7,
  pasos: async (page, info: TestInfo) => {
    await llenarTarjeta(page, 'Visa Platino', '9912');
    const colores = ['plata', 'grafito', 'zafiro', 'rubi', 'esmeralda', 'amatista', 'cobre'];
    for (const [i, color] of colores.entries()) {
      await page
        .locator('[data-color-tarjeta] label')
        .nth(i + 1)
        .click();
      await capturar(page, info, `cuenta-nueva__color-${color}`, {
        ...NUEVA,
        comp: `${FLU}/cuentas-nueva/color-tarjeta.tsx`,
        ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
        ref: `${E2}/nueva-tarjeta`,
      });
    }
    await page.locator('[data-color-tarjeta] label').nth(0).click();
  },
});
caso({
  id: 'cuenta-nueva__nombre-repetido',
  ...NUEVA,
  ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
  url: '/cuentas/nueva?tipo-cuenta=tarjeta',
  ref: `${E2}/nueva-nombre-repetido`,
  ...A7,
  pasos: async (page) => {
    await llenarTarjeta(page, 'visa oro', '9912');
    await expect(page.getByText(n.nombreEnUso('Visa Oro'))).toBeVisible();
  },
});
caso({
  id: 'cuenta-nueva__rechazo-del-servidor',
  ...NUEVA,
  ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
  url: '/cuentas/nueva?tipo-cuenta=tarjeta',
  ref: `${E2}/nueva-nombre-repetido`,
  nota: 'Después de enviar: el servidor rechaza el nombre repetido.',
  ...A7,
  pasos: async (page) => {
    await llenarTarjeta(page, 'visa oro', '9912');
    await boton(page, n.guardar).click();
    await expect(page.getByText(/Ya existe/).first()).toBeVisible();
  },
});
caso({
  id: 'cuenta-nueva__campos-con-error',
  ...NUEVA,
  ruta: '/cuentas/nueva?tipo-cuenta=tarjeta',
  url: '/cuentas/nueva?tipo-cuenta=tarjeta',
  ref: `${E2}/nueva-tarjeta`,
  nota: 'Enviar vacío: errores de validación en cada campo obligatorio.',
  ...A7,
  pasos: async (page) => {
    await expect(campo(page, n.limiteCredito)).toBeVisible();
    await boton(page, n.guardar).click();
    await expect(page.getByText(n.obligatorio).first()).toBeVisible();
  },
});
caso({
  id: 'cuenta-nueva__prestamo',
  ...NUEVA,
  comp: `${FLU}/cuentas-nueva/campos-de-tipo.tsx`,
  ruta: '/cuentas/nueva?tipo-cuenta=prestamo',
  url: '/cuentas/nueva?tipo-cuenta=prestamo',
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: prestamo-alta.',
  ...A7,
  pasos: async (page) => {
    await expect(campo(page, n.contraparte)).toBeVisible();
  },
});
caso({
  id: 'cuenta-nueva__inversion',
  ...NUEVA,
  comp: `${FLU}/cuentas-nueva/campos-de-tipo.tsx`,
  ruta: '/cuentas/nueva?tipo-cuenta=inversion',
  url: '/cuentas/nueva?tipo-cuenta=inversion',
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: inversion-alta.',
  ...A7,
  pasos: async (page) => {
    await expect(campo(page, n.rendimiento)).toBeVisible();
  },
});
caso({
  id: 'cuenta-nueva__revisar-impacto',
  ...NUEVA,
  comp: 'apps/web/src/componentes/formularios/confirmacion-impacto.tsx',
  ref: 'SIN DISEÑO',
  nota: 'Confirmación con AV-01 (apertura en un período cerrado) antes de crear.',
  ...A7,
  pasos: async (page) => {
    await campo(page, n.nombre).fill('Cuenta nueva');
    await campo(page, n.apertura).fill('2026-08-25');
    await campo(page, n.saldo.efectivo).fill('500');
    await boton(page, n.guardar).click();
    await expect(page.getByRole('heading', { name: n.revisar })).toBeVisible();
  },
});
caso({
  id: 'cuenta-nueva__sin-conexion',
  ...NUEVA,
  ref: '02-referencias/entrega-2/pantallas/14-sin-conexion-404-y-error-de-pantalla/sin-conexion-en-la-app',
  ...A7,
  pasos: async (page) => {
    await page.context().setOffline(true);
    await expect(boton(page, n.guardar))
      .toBeDisabled({ timeout: 8000 })
      .catch(() => undefined);
  },
});

// ═══ Editar y condiciones ═══════════════════════════════════════════════════════════════════════════════════════════════
caso({
  id: 'cuenta-editar__principal',
  ruta: '/cuentas/[cuentaId]/editar',
  comp: `${FLU}/cuentas-editar/formulario.tsx`,
  ref: `${E2}/editar`,
  ...A7,
  url: de('Cuenta corriente', '/editar'),
});
caso({
  id: 'cuenta-editar__tarjeta',
  ruta: '/cuentas/[cuentaId]/editar',
  comp: `${FLU}/cuentas-editar/formulario.tsx`,
  ref: `${E2}/editar`,
  nota: 'Editar una tarjeta: la referencia edita la Visa Oro.',
  ...A7,
  url: de('Visa Oro', '/editar'),
});
caso({
  id: 'cuenta-condiciones__sin-modelo',
  ruta: '/cuentas/[cuentaId]/condiciones',
  comp: `${FLU}/cuentas-condiciones/formulario.tsx`,
  ref: `${E2}/condiciones-sin-modelo`,
  ...A7,
  url: de('Préstamo personal', '/condiciones'),
});
caso({
  id: 'cuenta-condiciones__tarjeta',
  ruta: '/cuentas/[cuentaId]/condiciones',
  comp: `${FLU}/cuentas-condiciones/lector.tsx`,
  ref: `${E2}/mas-acciones-tarjeta`,
  nota: '«Condiciones» del menú de una tarjeta: la ruta redirige al detalle.',
  ...A7,
  url: de('Visa Oro'),
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Más acciones' }).first().click();
    await page.getByRole('menuitem', { name: d.acciones.condiciones, exact: true }).click();
    await page.waitForLoadState('networkidle').catch(() => undefined);
    await quieta(page);
  },
});

// ═══ Pagar tarjeta ══════════════════════════════════════════════════════════════════════════════════════════════════════
const PAGAR = {
  ruta: '/cuentas/[cuentaId]/pagar',
  comp: `${FLU}/cuentas-pagar/formulario.tsx`,
} as const;
caso({
  id: 'cuenta-pagar__principal',
  ...PAGAR,
  ref: `${E2}/pagar-tarjeta`,
  ...A7,
  url: de('Visa Oro', '/pagar'),
});
caso({
  id: 'cuenta-pagar__mas-que-la-deuda',
  ...PAGAR,
  ref: `${E2}/pagar-saldo-a-favor`,
  ...A7,
  url: de('Visa Oro', '/pagar'),
  pasos: async (page) => {
    await hidratado(page, tp.desde);
    await campo(page, tp.desde).selectOption({ label: 'Cuenta corriente' });
    await campo(page, tp.monto).fill('700');
    await page.getByRole('button', { name: /^Pagar \$/ }).click();
    await expect(page.getByRole('heading', { name: tp.revisar })).toBeVisible();
  },
});
caso({
  id: 'cuenta-pagar__sin-origen',
  ...PAGAR,
  ref: `${E2}/pagar-tarjeta`,
  nota: 'Enviar sin monto: error de validación en el campo.',
  ...A7,
  url: de('Visa Oro', '/pagar'),
  pasos: async (page) => {
    await hidratado(page, tp.desde);
    await campo(page, tp.monto).fill('');
    await page.getByRole('button', { name: /^Pagar/ }).click();
    await expect(page.getByText(tp.completar).first())
      .toBeVisible()
      .catch(() => undefined);
  },
});
caso({
  id: 'cuenta-pagar__sin-deuda',
  ...PAGAR,
  ref: `${E2}/pagar-tarjeta`,
  nota: 'Tarjeta sin deuda: sin atajos de monto.',
  ...A7,
  url: de('Mastercard Clásica', '/pagar'),
});

// ═══ Cuota de préstamo ══════════════════════════════════════════════════════════════════════════════════════════════════
const CUOTA = {
  ruta: '/cuentas/[cuentaId]/cuota',
  comp: `${FLU}/cuentas-cuota/formulario.tsx`,
} as const;
caso({
  id: 'cuenta-cuota__principal',
  ...CUOTA,
  ref: `${E2}/cuota`,
  nota: 'Préstamo sin modelo: desglose a mano.',
  ...A7,
  url: de('Préstamo personal', '/cuota?modalidad=cuota'),
});
caso({
  id: 'cuenta-cuota__no-cuadra',
  ...CUOTA,
  ref: `${E2}/cuota-no-cuadra`,
  ...A7,
  url: de('Préstamo personal', '/cuota?modalidad=cuota'),
  pasos: async (page) => {
    await radio(page, tc.origen, 'Cuenta de ahorro', false).click();
    await campo(page, tc.categoria).click();
    await page.getByRole('option', { name: 'Cuota del préstamo' }).click();
    await campo(page, tc.capital).fill('150');
    await campo(page, tc.interes).fill('50');
    await campo(page, tc.seguro).fill('9');
    await boton(page, tc.guardarCuota).click();
    await expect(page.getByText(/suman \$209\.00/).first()).toBeVisible();
  },
});
caso({
  id: 'cuenta-cuota__categoria-abierta',
  ...CUOTA,
  comp: 'apps/web/src/componentes/base/seleccion.tsx',
  ref: `${E2}/cuota`,
  nota: 'Lista desplegable de la categoría (más de 7 opciones).',
  ...A7,
  url: de('Préstamo personal', '/cuota?modalidad=cuota'),
  pasos: async (page) => {
    await campo(page, tc.categoria).click();
    await expect(page.getByRole('option').first()).toBeVisible();
  },
});
caso({
  id: 'cuenta-cuota__abono',
  ...CUOTA,
  ruta: '/cuentas/[cuentaId]/cuota?modalidad=abono',
  ref: 'SIN DISEÑO',
  nota: 'Abonar a capital: la referencia solo trae «Pagar cuota».',
  ...A7,
  url: de('Préstamo personal', '/cuota?modalidad=abono'),
});

// ═══ Archivar y eliminar (bloqueados) ═══════════════════════════════════════════════════════════════════════════════════
caso({
  id: 'cuenta-archivar__bloqueado',
  ruta: '/cuentas/[cuentaId]/archivar',
  comp: `${FLU}/cuentas-archivar/formulario.tsx`,
  ref: `${E2}/archivar-bloqueado`,
  ...A7,
  url: de('Cuenta corriente', '/archivar'),
});
caso({
  id: 'cuenta-archivar__tarjeta',
  ruta: '/cuentas/[cuentaId]/archivar',
  comp: `${FLU}/cuentas-archivar/formulario.tsx`,
  ref: `${E2}/archivar`,
  nota: 'Tarjeta sin deuda: pregunta por las asignaciones futuras de su categoría de pago.',
  ...A7,
  url: de('Mastercard Clásica', '/archivar'),
});
caso({
  id: 'cuenta-eliminar__bloqueado',
  ruta: '/cuentas/[cuentaId]/eliminar',
  comp: `${FLU}/cuentas-eliminar/formulario.tsx`,
  ref: `${E2}/eliminar-bloqueado`,
  ...A7,
  url: de('Cuenta corriente', '/eliminar'),
});

// ═══ Verificar saldo ════════════════════════════════════════════════════════════════════════════════════════════════════
const VERIF = {
  ruta: '/cuentas/[cuentaId]/verificar-saldo',
  comp: `${FLU}/cuentas-verificar-saldo/formulario.tsx`,
} as const;
caso({
  id: 'cuenta-verificar-saldo__datos',
  ...VERIF,
  ref: `${E2}/verificar-saldo`,
  nota: 'Paso 1: fecha y saldo del banco, antes de pedir la diferencia.',
  ...A7,
  url: de('Cuenta corriente', '/verificar-saldo'),
});
caso({
  id: 'cuenta-verificar-saldo__coincide',
  ...VERIF,
  ref: `${E2}/verificar-saldo`,
  ...A7,
  url: de('Cuenta corriente', '/verificar-saldo'),
  pasos: async (page) => {
    await campo(page, tv.saldoBanco).fill('1284.60');
    await boton(page, tv.verDiferencia).click();
    await expect(page.getByText(tv.coincide)).toBeVisible();
  },
});
caso({
  id: 'cuenta-verificar-saldo__diferencia',
  ...VERIF,
  ref: `${E2}/verificar-diferencia`,
  ...A7,
  url: de('Cuenta corriente', '/verificar-saldo'),
  pasos: async (page) => {
    await campo(page, tv.saldoBanco).fill('1272.20');
    await boton(page, tv.verDiferencia).click();
    await expect(page.getByText(tv.noCoincide)).toBeVisible();
  },
});
caso({
  id: 'cuenta-verificar-saldo__revisar',
  ...VERIF,
  comp: 'apps/web/src/componentes/formularios/confirmacion-impacto.tsx',
  ref: `${E2}/verificar-diferencia`,
  nota: 'Paso 3: «Revisá la verificación» antes de confirmar.',
  ...A7,
  url: de('Cuenta corriente', '/verificar-saldo'),
  pasos: async (page) => {
    await campo(page, tv.saldoBanco).fill('1272.20');
    await boton(page, tv.verDiferencia).click();
    await expect(page.getByText(tv.noCoincide)).toBeVisible();
    await boton(page, tv.revisar).click();
    await expect(page.getByRole('heading', { name: tv.tituloRevisar })).toBeVisible();
  },
});
caso({
  id: 'cuenta-verificar-saldo__tarjeta',
  ...VERIF,
  ref: `${E2}/verificar-saldo`,
  nota: 'Tarjeta: «Deuda que muestra tu banco» con Debo / Tengo a favor.',
  ...A7,
  url: de('Visa Oro', '/verificar-saldo'),
});

// ═══ Ordenar ════════════════════════════════════════════════════════════════════════════════════════════════════════════
caso({
  id: 'cuentas-ordenar__principal',
  ruta: '/cuentas/ordenar',
  comp: `${FLU}/cuentas-ordenar/formulario.tsx`,
  ref: `${E2}/ordenar`,
  ...A7,
});

// ═══ Conciliar con CSV (lo último sobre A.7: subir no escribe, pero se deja al final por las dudas) ═════════════════════
const CONC = {
  ruta: '/cuentas/[cuentaId]/conciliar',
  comp: `${FLU}/cuentas-conciliar/formulario.tsx`,
} as const;
caso({
  id: 'cuenta-conciliar__subir',
  ...CONC,
  ref: `${E2}/conciliar-subir`,
  ...A7,
  url: de('Visa Oro', '/conciliar'),
});
caso({
  id: 'cuenta-conciliar__falta-archivo',
  ...CONC,
  ref: `${E2}/conciliar-subir`,
  nota: '«Revisar» sin haber elegido el archivo.',
  ...A7,
  url: de('Visa Oro', '/conciliar'),
  pasos: async (page) => {
    await boton(page, tk.revisar).click();
    await expect(page.getByText(tk.falta)).toBeVisible();
  },
});
caso({
  id: 'cuenta-conciliar__error',
  ...CONC,
  ref: `${E2}/conciliar-error`,
  ...A7,
  url: de('Visa Oro', '/conciliar'),
  pasos: async (page) => {
    await subirCsv(page, 'hola;mundo\n1;2\n', 'estado-de-cuenta-septiembre.csv');
    await expect(page.locator('[role="alert"], [role="status"]').filter({ hasText: /./ }).first())
      .toBeVisible({ timeout: 15_000 })
      .catch(() => undefined);
    await page.waitForTimeout(1500);
  },
});
caso({
  id: 'cuenta-conciliar__resultado',
  ...CONC,
  ref: `${E2}/conciliar-resultado`,
  ...A7,
  soloLectura: false,
  url: de('Visa Oro', '/conciliar'),
  pasos: async (page) => {
    await subirCsv(page, CSV_VISA);
    await expect(page.getByRole('heading', { name: /^Coinciden/ })).toBeVisible({
      timeout: 20_000,
    });
  },
});

// ═══ Otras semillas de solo lectura ═════════════════════════════════════════════════════════════════════════════════════
caso({
  id: 'cuentas__sin-cuentas',
  ruta: '/cuentas',
  comp: `${APP}/pantalla.tsx`,
  ref: `${E1}/S1-Inicio__primer-uso-sin-cuentas`,
  nota: 'Cuentas sin ninguna cuenta no tiene referencia propia; la más cercana es el primer uso de Inicio y PANTALLAS §2.19.',
  ops: [],
  hoy: HOY,
  soloLectura: true,
});
caso({
  id: 'cuentas-ordenar__sin-cuentas',
  ruta: '/cuentas/ordenar',
  comp: `${FLU}/cuentas-ordenar/formulario.tsx`,
  ref: `${E2}/ordenar`,
  nota: 'Ordenar sin cuentas (se llega por URL).',
  ops: [],
  hoy: HOY,
  soloLectura: true,
});
const UNA: Op[] = [
  { op: 'OP-01', cuenta: 'Cuenta corriente', saldo: 1284.6, apertura: HOY },
  {
    op: 'OP-01',
    cuenta: 'Visa Oro',
    tipo: 'tarjeta',
    saldo: 18.75,
    limite: 2500,
    apertura: HOY,
    ultimos4: '4821',
  },
];
caso({
  id: 'cuentas__una-tarjeta',
  ruta: '/cuentas',
  comp: 'apps/web/src/componentes/dominio/billetera.tsx',
  ref: `${E1}/S6-Cuentas`,
  nota: 'Una sola tarjeta (sin billetera apilada) y una sola cuenta de efectivo.',
  ops: UNA,
  hoy: HOY,
  soloLectura: true,
});
caso({
  id: 'cuenta__vacia',
  ruta: '/cuentas/[cuentaId]',
  comp: `${APP}/[cuentaId]/movimientos.tsx`,
  ref: `${E2}/vacia`,
  ops: [...UNA, { op: 'OP-01', cuenta: 'Cuenta nueva', saldo: 0, apertura: HOY }],
  hoy: HOY,
  soloLectura: true,
  url: de('Cuenta nueva'),
});

// ═══ Cargando ═══════════════════════════════════════════════════════════════════════════════════════════════════════════
test('cuentas__cargando', async ({ page, context, baseURL }, info) => {
  await sembrarOps(UNA, HOY);
  await entrar(context, baseURL);
  await page.goto('/presupuesto');
  await quieta(page);
  // La navegación de cliente pide el RSC de /cuentas: se demora para que quede a la vista el estado de carga
  await page.route(/\/cuentas(\?|$)/, async (route) => {
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
  await page.getByRole('link', { name: 'Cuentas', exact: true }).first().click();
  await expect(page.locator('[aria-busy="true"]').first()).toBeVisible({ timeout: 8000 });
  await capturar(
    page,
    info,
    'cuentas__cargando',
    meta(
      '/cuentas',
      'apps/web/src/app/(finn)/loading.tsx',
      'SIN DISEÑO',
      'Estado de carga genérico del marco (05 §7.1).',
    ),
    { carga: true },
  );
});

// ═══ Recorridos que escriben ════════════════════════════════════════════════════════════════════════════════════════════
test('cta-escribe__archivar-eliminar', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(
    escenarioX('SEM-A7-CTA-ARCH', [
      { op: 'OP-01', cuenta: 'Cuenta vieja', saldo: 0, apertura: HOY, hoy: HOY },
    ]),
    HOY,
  );
  await entrar(context, baseURL);
  const id = await idDe(page, 'Cuenta vieja');
  const base = `/cuentas/${id}`;

  await page.goto(`${base}/archivar`);
  await quieta(page);
  await capturar(
    page,
    info,
    'cuenta-archivar__principal',
    meta(
      '/cuentas/[cuentaId]/archivar',
      `${FLU}/cuentas-archivar/formulario.tsx`,
      `${E2}/archivar`,
    ),
  );

  await page.goto(`${base}/eliminar`);
  await quieta(page);
  await capturar(
    page,
    info,
    'cuenta-eliminar__principal',
    meta(
      '/cuentas/[cuentaId]/eliminar',
      `${FLU}/cuentas-eliminar/formulario.tsx`,
      `${E2}/eliminar-bloqueado`,
      'Eliminar permitido (cuenta sin movimientos): la referencia solo trae el bloqueado.',
    ),
  );
  if ((await boton(page, g.eliminar.verCambios).count()) > 0) {
    await boton(page, g.eliminar.verCambios).click();
    await expect(page.getByRole('heading', { name: g.comunes.revisar })).toBeVisible();
    await capturar(
      page,
      info,
      'cuenta-eliminar__confirmar',
      meta(
        '/cuentas/[cuentaId]/eliminar',
        'apps/web/src/componentes/formularios/confirmacion-impacto.tsx',
        'SIN DISEÑO',
        'Confirmación de eliminar con el impacto (AV-15).',
      ),
    );
  }

  await page.goto(`${base}/archivar`);
  await quieta(page);
  await boton(page, g.archivar.archivar).click();
  await expect(page).toHaveURL(new RegExp(`${id}$`));
  await expect(page.getByText(d.soloLectura)).toBeVisible();
  await capturar(
    page,
    info,
    'cuenta__archivada',
    meta('/cuentas/[cuentaId]', `${APP}/[cuentaId]/acciones.tsx`, `${E2}/archivada`),
  );

  await page.getByRole('button', { name: 'Más acciones' }).first().click();
  await expect(page.getByRole('menu')).toBeVisible();
  await capturar(
    page,
    info,
    'cuenta__archivada-mas-acciones',
    meta(
      '/cuentas/[cuentaId]',
      'apps/web/src/componentes/marco/mas-acciones.tsx',
      `${E2}/mas-acciones`,
      'Menú de una cuenta archivada: acciones que escriben deshabilitadas con motivo.',
    ),
  );
  await page.keyboard.press('Escape');

  await page.goto('/cuentas?archivadas=1');
  await quieta(page);
  await capturar(
    page,
    info,
    'cuentas__archivadas',
    meta('/cuentas?archivadas=1', `${APP}/pantalla.tsx`, `${E1}/S6-Cuentas__archivadas-visibles`),
  );

  await page.goto(base);
  await quieta(page);
  await boton(page, d.desarchivar).click();
  await expect(page.getByText(d.desarchivada)).toBeVisible();
  await capturar(
    page,
    info,
    'cuenta__desarchivada',
    meta(
      '/cuentas/[cuentaId]',
      `${APP}/[cuentaId]/desarchivar.tsx`,
      `${E2}/archivada`,
      'Resultado en el lugar con «Archivar de nuevo».',
    ),
  );
});

test('cta-escribe__crear-subtipos-y-tarjeta', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(escenarioX('SEM-A7-CTA-CREAR'), HOY);
  await entrar(context, baseURL);
  const crear = async (llenar: () => Promise<void>, ruta = '/cuentas/nueva') => {
    await page.goto(ruta);
    await quieta(page);
    await llenar();
    await boton(page, n.guardar).click();
    await expect(page).toHaveURL(/\/cuentas$/, { timeout: 20_000 });
    await quieta(page);
  };
  await crear(async () => {
    await radio(page, s.etiqueta, s.opciones.billetera).click();
    await campo(page, n.saldo.efectivo).fill('40');
  });
  await crear(async () => {
    await radio(page, s.etiqueta, s.opciones.ahorro).click();
    await campo(page, n.nombre).fill('Ahorro BAC');
    await page.getByRole('radio', { name: 'BAC', exact: true }).click();
    await campo(page, n.saldo.efectivo).fill('500');
  });
  await crear(async () => {
    await llenarTarjeta(page, 'Visa Platino', '9912');
    await page.locator('[data-color-tarjeta] label').nth(3).click();
  }, '/cuentas/nueva?tipo-cuenta=tarjeta');

  await capturar(
    page,
    info,
    'cuentas__subtipos-y-tres-tarjetas',
    meta(
      '/cuentas',
      `${APP}/pantalla.tsx`,
      `${E1}/S6-Cuentas`,
      'Billetera y ahorro creadas desde la app (identidad por subtipo) y tres tarjetas apiladas.',
    ),
  );

  for (const [nombre, idCaptura, nota] of [
    [
      'Billetera',
      'cuenta__billetera',
      'FALTANTES: identidad de la billetera (ícono wallet provisorio).',
    ],
    [
      'Ahorro BAC',
      'cuenta__ahorro',
      'Cuenta de ahorro creada desde la app: identidad con anillos.',
    ],
    [
      'Visa Platino',
      'cuenta__tarjeta-zafiro',
      'Tarjeta creada desde la app con red Visa y color zafiro.',
    ],
  ] as const) {
    const id = await idDe(page, nombre);
    await page.goto(`/cuentas/${id}`);
    await quieta(page);
    await capturar(
      page,
      info,
      idCaptura,
      meta(
        '/cuentas/[cuentaId]',
        `${APP}/[cuentaId]/cabecera.tsx`,
        nombre === 'Visa Platino' ? `${E2}/tarjeta` : `${E2}/corriente`,
        nota,
      ),
    );
  }
  const billetera = await idDe(page, 'Billetera');
  await page.goto(`/cuentas/${billetera}/editar`);
  await quieta(page);
  await capturar(
    page,
    info,
    'cuenta-editar__billetera',
    meta(
      '/cuentas/[cuentaId]/editar',
      `${FLU}/cuentas-editar/formulario.tsx`,
      `${E2}/editar`,
      'Editar una billetera: sin institución ni últimos 4.',
    ),
  );
});

test('cta-escribe__pagar-cuota-verificar-conciliar', async ({ page, context, baseURL }, info) => {
  await sembrarEscenario(escenarioX('SEM-A7-CTA-FLUJOS'), HOY);
  await entrar(context, baseURL);
  const visa = await idDe(page, 'Visa Oro');
  const master = await idDe(page, 'Mastercard Clásica');
  const corriente = await idDe(page, 'Cuenta corriente');
  const prestamo = await idDe(page, 'Préstamo personal');
  const PAG = meta(
    '/cuentas/[cuentaId]/pagar',
    `${FLU}/cuentas-pagar/formulario.tsx`,
    `${E2}/pagar-tarjeta`,
  );

  // Pagar la Visa: resultado
  await page.goto(`/cuentas/${visa}/pagar`);
  await quieta(page);
  await hidratado(page, tp.desde);
  await campo(page, tp.desde).selectOption({ label: 'Cuenta corriente' });
  await campo(page, tp.monto).fill('100');
  await page.getByRole('button', { name: /^Pagar \$/ }).click();
  await expect(page.getByRole('heading', { name: tp.tituloListo })).toBeVisible({
    timeout: 20_000,
  });
  await capturar(page, info, 'cuenta-pagar__listo', {
    ...PAG,
    nota: 'Resultado del pago: la referencia no trae este estado.',
  });

  // Pagar la Mastercard sin deuda: queda saldo a favor
  await page.goto(`/cuentas/${master}/pagar`);
  await quieta(page);
  await hidratado(page, tp.desde);
  await campo(page, tp.desde).selectOption({ label: 'Cuenta corriente' });
  await campo(page, tp.monto).fill('25');
  await page.getByRole('button', { name: /^Pagar \$/ }).click();
  await expect(page.getByRole('heading', { name: tp.revisar })).toBeVisible({ timeout: 20_000 });
  await boton(page, tp.confirmar).click();
  await expect(page.getByRole('heading', { name: tp.tituloListo })).toBeVisible({
    timeout: 20_000,
  });
  await capturar(page, info, 'cuenta-pagar__listo-con-excedente', {
    ...PAG,
    ref: `${E2}/pagar-saldo-a-favor`,
    nota: 'Resultado con el aviso de pago excedente (AV-04).',
  });

  await page.goto('/cuentas');
  await quieta(page);
  await page
    .locator('[data-billetera] button')
    .filter({ hasText: 'Mastercard' })
    .click({ position: { x: 90, y: 18 } });
  await expect(page.locator('[data-detalle-tarjeta]')).toContainText('Saldo a favor');
  await capturar(
    page,
    info,
    'cuentas__saldo-a-favor',
    meta(
      '/cuentas',
      'apps/web/src/componentes/dominio/billetera.tsx',
      `${E1}/S6-Cuentas__tarjeta-con-saldo-a-favor-mastercard-al-frente`,
    ),
  );
  await page.goto(`/cuentas/${master}`);
  await quieta(page);
  await capturar(
    page,
    info,
    'cuenta__tarjeta-saldo-a-favor',
    meta(
      '/cuentas/[cuentaId]',
      `${APP}/[cuentaId]/por-tipo.tsx`,
      `${E2}/tarjeta`,
      'Tarjeta con saldo a favor.',
    ),
  );

  // Cuota del préstamo: resultado
  await page.goto(`/cuentas/${prestamo}/cuota?modalidad=cuota`);
  await quieta(page);
  await radio(page, tc.origen, 'Cuenta de ahorro', false).click();
  await campo(page, tc.categoria).click();
  await page.getByRole('option', { name: 'Cuota del préstamo' }).click();
  await campo(page, tc.capital).fill('150');
  await campo(page, tc.interes).fill('50');
  await campo(page, tc.seguro).fill('10');
  await boton(page, tc.guardarCuota).click();
  await expect(page.getByRole('heading', { name: tc.listoCuota })).toBeVisible({ timeout: 20_000 });
  await capturar(
    page,
    info,
    'cuenta-cuota__listo',
    meta(
      '/cuentas/[cuentaId]/cuota',
      `${FLU}/cuentas-cuota/formulario.tsx`,
      `${E2}/cuota`,
      'Resultado de pagar la cuota: la referencia no trae este estado.',
    ),
  );

  // Verificar saldo con diferencia: resultado con la propuesta de ajuste
  await page.goto(`/cuentas/${corriente}/verificar-saldo`);
  await quieta(page);
  await campo(page, tv.saldoBanco).fill('1172.20');
  await boton(page, tv.verDiferencia).click();
  await expect(page.getByText(tv.noCoincide)).toBeVisible({ timeout: 20_000 });
  await boton(page, tv.revisar).click();
  await expect(page.getByRole('heading', { name: tv.tituloRevisar })).toBeVisible();
  await boton(page, tv.confirmar).click();
  await expect(page.getByRole('heading', { name: tv.tituloListo })).toBeVisible({
    timeout: 20_000,
  });
  await capturar(
    page,
    info,
    'cuenta-verificar-saldo__listo-con-ajuste',
    meta(
      '/cuentas/[cuentaId]/verificar-saldo',
      `${FLU}/cuentas-verificar-saldo/formulario.tsx`,
      `${E2}/verificar-diferencia`,
      'Resultado con la propuesta de ajuste (AV-21).',
    ),
  );
  await page.goto(`/cuentas/${corriente}`);
  await quieta(page);
  await capturar(
    page,
    info,
    'cuenta__corriente-dos-conciliaciones',
    meta(
      '/cuentas/[cuentaId]',
      `${APP}/[cuentaId]/conciliaciones.tsx`,
      `${E2}/corriente`,
      'Con un estado de cuenta y una verificación de saldo, como la referencia.',
    ),
  );

  // Conciliar la Visa: terminar
  await page.goto(`/cuentas/${visa}/conciliar`);
  await quieta(page);
  await subirCsv(page, CSV_VISA);
  await expect(page.getByRole('heading', { name: /^Coinciden/ })).toBeVisible({ timeout: 20_000 });
  await boton(page, tk.terminar).click();
  await expect(page.getByRole('heading', { name: tk.tituloListo })).toBeVisible({
    timeout: 20_000,
  });
  await capturar(
    page,
    info,
    'cuenta-conciliar__listo',
    meta(
      '/cuentas/[cuentaId]/conciliar',
      `${FLU}/cuentas-conciliar/formulario.tsx`,
      `${E2}/conciliar-resultado`,
      'Conciliación terminada, con la propuesta de ajuste.',
    ),
  );
});

test('cta-escribe__condiciones-con-modelo', async ({ page, context, baseURL }, info) => {
  const hoy = '2027-02-16';
  await sembrarOps(
    [
      { op: 'OP-01', cuenta: 'Cuenta de ahorro', saldo: 3120 },
      {
        op: 'OP-01',
        cuenta: 'Préstamo personal',
        tipo: 'prestamo',
        saldo: 10000,
        apertura: '2027-01-15',
        prestamo: {
          contraparte: 'Banco Agrícola',
          montoOriginal: 10000,
          cuota: 350,
          plazoCuotas: 36,
          cuotasPagadas: 0,
        },
      },
      { op: 'OP-07', categoria: 'Cuota del préstamo' },
      { op: 'OP-21', monto: 1000, cuenta: 'Cuenta de ahorro' },
      { op: 'OP-14', categoria: 'Cuota del préstamo', monto: 350, periodo: 'P1' },
    ],
    hoy,
  );
  await entrar(context, baseURL);
  const id = await idDe(page, 'Préstamo personal');
  await page.goto(`/cuentas/${id}/condiciones`);
  await quieta(page);
  await campo(page, tcond.comunes.tasaAnual).fill('12');
  await campo(page, tcond.seguroPrimerMes).fill('5');
  await radio(page, tcond.comunes.modelo, 'Banco Agrícola').click();
  await capturar(
    page,
    info,
    'cuenta-condiciones__principal',
    meta(
      '/cuentas/[cuentaId]/condiciones',
      `${FLU}/cuentas-condiciones/formulario.tsx`,
      `${E2}/condiciones`,
    ),
  );
  await boton(page, tcond.guardar).click();
  await expect(page).toHaveURL(new RegExp(`/cuentas/${id}$`), { timeout: 20_000 });
  await quieta(page);
  await expect(page.locator('[data-bloque="prestamo"] tbody tr').first()).toBeVisible();
  await capturar(
    page,
    info,
    'cuenta__prestamo-con-amortizacion',
    meta('/cuentas/[cuentaId]', `${APP}/[cuentaId]/por-tipo.tsx`, `${E2}/prestamo`),
  );
  await page.goto(`/cuentas/${id}/cuota?modalidad=cuota`);
  await quieta(page);
  await capturar(
    page,
    info,
    'cuenta-cuota__con-propuesta',
    meta(
      '/cuentas/[cuentaId]/cuota',
      `${FLU}/cuentas-cuota/formulario.tsx`,
      `${E2}/cuota`,
      'Con modelo: el desglose llega propuesto.',
    ),
  );
  await page.goto('/cuentas');
  await quieta(page);
  await capturar(
    page,
    info,
    'cuentas__prestamo-con-cuota',
    meta(
      '/cuentas',
      'apps/web/src/componentes/dominio/identidad-cuenta.tsx',
      `${E1}/S6-Cuentas`,
      'Boleto del préstamo con el talón de la próxima cuota.',
    ),
  );
});

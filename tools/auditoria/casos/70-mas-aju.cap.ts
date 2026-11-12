// Auditoría de diseño · sección MAS + AJU (Programadas, Por cobrar, Reglas, Notificaciones, Ajustes y todas sus subpáginas).
// Casos de solo lectura con la semilla A.7 (hoy servidor 2026-10-15) cuando se puede; los demás, con su propia semilla.
import {
  caso,
  capturar,
  entrar,
  escenarioA7,
  expect,
  quieta,
  sembrarEscenario,
  fijarRelojServidor,
  variable,
  test,
  type Escenario,
  type Op,
  type Page,
} from '../lib.ts';
import { codigoDe } from '../../../apps/web/e2e/ayudas/totp.ts';
import { SECRETO_RESPALDO_E2E } from '../../pruebas/e2e/respaldo.ts';
import { clienteAal2, quitarRespaldos } from '../../../apps/web/e2e/ayudas/factores.ts';
import {
  completarInscripcion,
  iniciarInscripcion,
} from '../../../packages/aplicacion/src/autenticacion/supabase.ts';

const E2 = '02-referencias/entrega-2/pantallas';
const E3 = 'entrega-3/pantallas/16-salir';
const APP = 'apps/web/src/app/(finn)';
const FLU = 'apps/web/src/flujos';

// ── Semillas ────────────────────────────────────────────────────────────────────────────────────────────────────────────
const a7 = escenarioA7();
/** A.7 más operaciones; `id` distinto por semilla para que el arnés no confunda la base. */
const esc = (id: string, extra: Op[] = []): Escenario => ({
  ...a7,
  id,
  estadoInicial: [...(a7.estadoInicial ?? []), ...extra],
});
const SIN_NADA: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-07', categoria: 'Streaming' },
  { op: 'OP-21', monto: 1000 },
];
const P_ATRASADA = { hoyServidor: '2026-10-19' } as const;

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// PROGRAMADAS
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const PROG = `${APP}/programadas`;
const RP = `${E2}/09b-programadas`;

caso({
  id: 'programadas__lista',
  ruta: '/programadas',
  comp: `${PROG}/pantalla.tsx`,
  ref: `${RP}/lista`,
  nota: 'A.7 con hoy 19/10: Netflix (17/10) atrasada, cuota 20/10 próxima. La referencia usa Luz y agua / Salario / Gimnasio (datos distintos).',
  escenario: esc('SEM-MAS-A7-P19'),
  ...P_ATRASADA,
  soloLectura: true,
});
caso({
  id: 'programadas__lista-7-dias',
  ruta: '/programadas?horizonte=7',
  comp: `${PROG}/pantalla.tsx`,
  ref: `${RP}/lista`,
  nota: 'Horizonte de 7 días.',
  escenario: esc('SEM-MAS-A7-P19'),
  ...P_ATRASADA,
  soloLectura: true,
});
caso({
  id: 'programadas__vacia',
  ruta: '/programadas',
  comp: `${PROG}/pantalla.tsx`,
  ref: `${RP}/vacia`,
  ops: SIN_NADA,
  hoy: '2027-02-10',
  soloLectura: true,
});

/** La programada de Netflix de A.7 con su ocurrencia ya registrada (calendario bloqueado, ocurrencia resuelta). */
const NETFLIX_REGISTRADA = esc('SEM-MAS-A7-NETFLIX-REG', [
  { op: 'OP-43', modo: 'toque', programada: 'Netflix', fecha: '2026-10-17', hoy: '2026-10-17' },
]);

/** El id de la programada cuyo comercio se nombra, leído de la lista. */
async function idProgramada(page: Page, comercio: string): Promise<string> {
  await page.goto('/programadas');
  await quieta(page);
  const fila = page.locator('[data-programada]').filter({ hasText: comercio }).first();
  return (await fila.getAttribute('data-programada')) ?? '';
}

caso({
  id: 'programada__nueva',
  ruta: '/programadas/nueva',
  comp: `${FLU}/programadas-nueva/formulario.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: programada-nueva.',
  escenario: esc('SEM-MAS-A7-P19'),
  ...P_ATRASADA,
  soloLectura: true,
});
caso({
  id: 'programada__editar',
  ruta: '/programadas/[programadaId]',
  comp: `${FLU}/programadas-programada/lector.tsx`,
  ref: `${RP}/editar`,
  nota: 'Netflix con una ocurrencia registrada: primera fecha y frecuencia en solo lectura.',
  escenario: NETFLIX_REGISTRADA,
  ...P_ATRASADA,
  soloLectura: true,
  url: async (page) => `/programadas/${await idProgramada(page, 'NETFLIX')}`,
});
caso({
  id: 'programada__editar-sin-historial',
  ruta: '/programadas/[programadaId]',
  comp: `${FLU}/programadas-programada/lector.tsx`,
  ref: `${RP}/editar`,
  nota: 'Cuota del préstamo sin ocurrencias: calendario editable y Eliminar disponible (sin referencia propia).',
  escenario: esc('SEM-MAS-A7-P19'),
  ...P_ATRASADA,
  soloLectura: true,
  url: async (page) => `/programadas/${await idProgramada(page, 'CUOTA')}`,
});

const URL_OCURRENCIA = async (page: Page): Promise<string> =>
  `/programadas/${await idProgramada(page, 'NETFLIX')}/ocurrencias/2026-10-17`;

/** Abre la ocurrencia tocando el aviso «Registrar» de la lista: así sale como hoja sobre Programadas. */
async function abrirOcurrenciaDesdeLista(page: Page, fecha = '2026-10-17'): Promise<void> {
  await page.goto('/programadas');
  await quieta(page);
  await page.locator(`a[href$="/ocurrencias/${fecha}"]`).first().click();
  await expect(page.getByRole('button', { name: /^Omitir/ }).first()).toBeVisible();
  await quieta(page);
}

caso({
  id: 'programada__ocurrencia',
  ruta: '/programadas/[programadaId]/ocurrencias/[fechaEsperada]',
  comp: `${FLU}/programadas-ocurrencias-fecha-esperada/formulario.tsx`,
  ref: `${RP}/ocurrencia`,
  nota: 'Abierta desde el aviso «Registrar» de la lista (hoja interceptada en @superpuesto).',
  escenario: esc('SEM-MAS-A7-P19'),
  ...P_ATRASADA,
  soloLectura: true,
  pasos: async (page) => abrirOcurrenciaDesdeLista(page),
});
caso({
  id: 'programada__ocurrencia-pagina',
  ruta: '/programadas/[programadaId]/ocurrencias/[fechaEsperada]',
  comp: `${APP}/programadas/[programadaId]/ocurrencias/[fechaEsperada]/page.tsx`,
  ref: `${RP}/ocurrencia`,
  nota: 'Carga directa de la URL (sin hoja): lo que ve quien recarga o abre el enlace.',
  escenario: esc('SEM-MAS-A7-P19'),
  ...P_ATRASADA,
  soloLectura: true,
  url: URL_OCURRENCIA,
});
caso({
  id: 'programada__ocurrencia-resuelta',
  ruta: '/programadas/[programadaId]/ocurrencias/[fechaEsperada]',
  comp: `${FLU}/programadas-ocurrencias-fecha-esperada/resuelta.tsx`,
  ref: `${RP}/ocurrencia-resuelta`,
  nota: 'Ocurrencia del 17/10 ya registrada, abierta por URL directa.',
  escenario: NETFLIX_REGISTRADA,
  ...P_ATRASADA,
  soloLectura: true,
  url: URL_OCURRENCIA,
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// POR COBRAR
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const COB = `${APP}/por-cobrar`;
const RC = `${E2}/09c-por-cobrar`;
/** A.7 ya trae a Carlos ($40, débito). Se agregan PRICESMART con la Visa (cobrado $10) y una partida de Ana. */
const COBRAR_EXTRA: Op[] = [
  {
    op: 'OP-20',
    cuenta: 'Visa Oro',
    monto: 40,
    etiqueta: 'pricesmart',
    fecha: '2026-10-15',
    hoy: '2026-10-15',
    lineas: [
      { categoria: 'Supermercado', monto: 20 },
      { deudor: 'Carlos', monto: 20 },
    ],
  },
  { op: 'OP-31', cobro: 'pricesmart', monto: 10, cuenta: 'Cuenta corriente', hoy: '2026-10-15' },
  {
    op: 'OP-20',
    cuenta: 'Cuenta corriente',
    monto: 30,
    etiqueta: 'ana',
    fecha: '2026-10-02',
    hoy: '2026-10-15',
    lineas: [
      { categoria: 'Restaurantes', monto: 15 },
      { deudor: 'Ana', monto: 15 },
    ],
  },
];
const COBRAR = esc('SEM-MAS-COBRAR', COBRAR_EXTRA);
const COBRAR_CON_CERRADO = esc('SEM-MAS-COBRAR-CERRADO', [
  ...COBRAR_EXTRA,
  { op: 'OP-31', cobro: 'ana', monto: 15, cuenta: 'Cuenta corriente', hoy: '2026-10-15' },
]);
const HOY_A7 = { hoyServidor: '2026-10-15' } as const;

caso({
  id: 'por-cobrar__lista',
  ruta: '/por-cobrar',
  comp: `${COB}/pantalla.tsx`,
  ref: `${RC}/lista`,
  nota: 'Carlos con dos partidas (CINEMARK con débito y PRICESMART con Visa, cobrado $10) y Ana con una.',
  escenario: COBRAR,
  ...HOY_A7,
  soloLectura: true,
});
caso({
  id: 'por-cobrar__lista-a7',
  ruta: '/por-cobrar',
  comp: `${COB}/pantalla.tsx`,
  ref: `${RC}/lista`,
  nota: 'A.7 tal cual: solo Carlos con CINEMARK ($40, débito).',
  escenario: a7,
  ...HOY_A7,
  soloLectura: true,
});
caso({
  id: 'por-cobrar__vacia',
  ruta: '/por-cobrar',
  comp: `${COB}/pantalla.tsx`,
  ref: `${RC}/vacia`,
  ops: SIN_NADA,
  hoy: '2027-02-10',
  soloLectura: true,
});
caso({
  id: 'por-cobrar__cerrados',
  ruta: '/por-cobrar?cerrados=1',
  comp: `${COB}/pantalla.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: cerrados. Ana pagó todo: su partida queda cerrada.',
  escenario: COBRAR_CON_CERRADO,
  ...HOY_A7,
  soloLectura: true,
});
caso({
  id: 'por-cobrar__cobrar',
  ruta: '/por-cobrar/cobrar',
  comp: `${FLU}/por-cobrar-cobrar/formulario.tsx`,
  ref: `${RC}/cobrar`,
  nota: 'Se abre desde «Cobrar» de la partida PRICESMART (con tarjeta: casilla «Reservar para Visa Oro»).',
  escenario: COBRAR,
  ...HOY_A7,
  soloLectura: true,
  url: '/por-cobrar',
  pasos: async (page) => {
    await page
      .locator('[data-partida]')
      .filter({ hasText: /Tarjeta/ })
      .first()
      .getByRole('link', { name: /^Cobrar / })
      .click();
    await expect(page.getByRole('button', { name: /^Cobrar \$/ })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'por-cobrar__condonar',
  ruta: '/por-cobrar/condonar/[lineaId]',
  comp: `${APP}/@superpuesto/(.)por-cobrar/condonar/[lineaId]/page.tsx`,
  ref: `${RC}/condonar`,
  nota: 'Desde «Condonar» de la primera partida (hoja interceptada).',
  escenario: COBRAR,
  ...HOY_A7,
  soloLectura: true,
  url: '/por-cobrar',
  pasos: async (page) => {
    await page
      .getByRole('link', { name: /^Condonar / })
      .first()
      .click();
    await expect(page.getByRole('button', { name: /^Condonar \$/ })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'por-cobrar__renombrar',
  ruta: '/por-cobrar/deudores/[deudorId]/renombrar',
  comp: `${APP}/por-cobrar/deudores/[deudorId]/renombrar/page.tsx`,
  ref: `${RC}/renombrar-repetido`,
  nota: 'Renombrar a Carlos, sin error todavía (la referencia solo trae el estado repetido).',
  escenario: COBRAR,
  ...HOY_A7,
  soloLectura: true,
  url: '/por-cobrar',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Renombrar a Carlos' }).click();
    await expect(page.getByRole('button', { name: 'Guardar nombre' })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'por-cobrar__renombrar-repetido',
  ruta: '/por-cobrar/deudores/[deudorId]/renombrar',
  comp: `${APP}/por-cobrar/deudores/[deudorId]/renombrar/page.tsx`,
  ref: `${RC}/renombrar-repetido`,
  nota: 'Carlos renombrado a «Ana»: el servidor rechaza el nombre repetido.',
  escenario: COBRAR,
  ...HOY_A7,
  soloLectura: true,
  url: '/por-cobrar',
  pasos: async (page) => {
    await page.getByRole('link', { name: 'Renombrar a Carlos' }).click();
    await expect(page.getByRole('button', { name: 'Guardar nombre' })).toBeVisible();
    await quieta(page);
    await page.getByLabel('Nombre').fill('Ana');
    await page.getByRole('button', { name: 'Guardar nombre' }).click();
    await expect(page.getByText(/Ya existe un deudor/)).toBeVisible();
  },
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// NOTIFICACIONES (página)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const NOT = `${APP}/notificaciones`;
const RN = `${E2}/10-notificaciones`;
const SIN_DESTINO = '7a1c1f0e-5b7e-4c53-9f0e-2d9a8b6c4d11';
const notificacion = (
  motivo: string,
  titulo: string,
  cuerpo: string,
  creadaEn: string,
  leida: boolean,
  destino?: unknown,
) => ({
  aviso: 'AV-23',
  motivo,
  titulo,
  cuerpo,
  creadaEn: `${creadaEn}-06:00`,
  leida,
  ...(destino === undefined ? {} : { destino }),
});
const NOTIS = (leidas: boolean) => [
  notificacion(
    'pago_tarjeta_proximo',
    'Visa Oro corta el 25/10',
    'Te falta reservar $18.75 para que la deuda quede cubierta antes del corte.',
    '2026-10-15T08:00:00',
    leidas,
    { pantalla: 'cuentas' },
  ),
  notificacion(
    'registro_automatico',
    'Cuota del préstamo el 20/10',
    'Cuota 14 · $210.00 desde Cuenta de ahorro. Se registra sola.',
    '2026-10-15T06:00:00',
    leidas,
  ),
  notificacion(
    'meta_vencida',
    'Netflix tiene su meta cubierta',
    'Ya está asignado lo que pide este período.',
    '2026-10-14T10:00:00',
    true,
  ),
  notificacion(
    'registro_automatico',
    'La regla PIZZA HUT se aplicó',
    '1 movimiento quedó en Restaurantes.',
    '2026-10-13T10:00:00',
    true,
  ),
  notificacion(
    'cierre_periodo',
    'Se cerró el período 21/08 – 20/09',
    'Sobregiros cubiertos: Listo para asignar no cambió.',
    '2026-09-21T10:00:00',
    true,
  ),
  notificacion(
    'registro_automatico',
    'Cuota de Gimnasio registrada',
    'Se registró sola.',
    '2026-10-10T10:00:00',
    true,
    { pantalla: 'transaccion', transaccionId: SIN_DESTINO },
  ),
];
caso({
  id: 'notificaciones__lista',
  ruta: '/notificaciones',
  comp: `${NOT}/contenido.tsx`,
  ref: `${RN}/lista`,
  nota: 'Con 2 sin leer, 3 leídas y una cuya transacción ya no existe.',
  escenario: esc('SEM-MAS-NOTIS'),
  ...HOY_A7,
  notificaciones: NOTIS(false),
  soloLectura: true,
});
caso({
  id: 'notificaciones__solo-sin-leer',
  ruta: '/notificaciones?no-leidas=1',
  comp: `${NOT}/contenido.tsx`,
  ref: `${RN}/lista`,
  nota: 'Filtro «Sin leer».',
  escenario: esc('SEM-MAS-NOTIS'),
  ...HOY_A7,
  notificaciones: NOTIS(false),
  soloLectura: true,
});
caso({
  id: 'notificaciones__todo-leido',
  ruta: '/notificaciones',
  comp: `${NOT}/contenido.tsx`,
  ref: `${RN}/todo-leido`,
  nota: 'Todas leídas desde la semilla.',
  escenario: esc('SEM-MAS-NOTIS-LEIDAS'),
  ...HOY_A7,
  notificaciones: NOTIS(true),
  soloLectura: true,
});
caso({
  id: 'notificaciones__marcar-todo',
  ruta: '/notificaciones',
  comp: `${NOT}/marcar-todo.tsx`,
  ref: `${RN}/todo-leido`,
  nota: 'Resultado de «Marcar todo como leído» tocado en la pantalla con 2 sin leer.',
  escenario: esc('SEM-MAS-NOTIS-MARCAR'),
  ...HOY_A7,
  notificaciones: NOTIS(false),
  pasos: async (page) => {
    await page.getByRole('button', { name: 'Marcar todo como leído' }).click();
    await expect(page.getByText('Todo leído').first()).toBeVisible();
  },
});
caso({
  id: 'notificaciones__vacia',
  ruta: '/notificaciones',
  comp: `${NOT}/pantalla.tsx`,
  ref: `${RN}/vacia`,
  escenario: esc('SEM-MAS-NOTIS-VACIA'),
  ...HOY_A7,
  soloLectura: true,
});
caso({
  id: 'notificaciones__panel',
  ruta: '/notificaciones (panel)',
  comp: `${APP}/@superpuesto/(.)notificaciones/page.tsx`,
  ref: 'entrega-1/componentes/K5-Nuevos__panel-de-notificaciones',
  nota: 'La campana desde Presupuesto abre el panel interceptado; la referencia es K5 (no es parte de 10-notificaciones).',
  escenario: esc('SEM-MAS-NOTIS'),
  ...HOY_A7,
  notificaciones: NOTIS(false),
  soloLectura: true,
  url: '/presupuesto',
  pasos: async (page) => {
    await page
      .locator('[data-marco-barra]')
      .getByRole('link', { name: /^Notificaciones/ })
      .click();
    await expect(page).toHaveURL(/\/notificaciones/);
    await quieta(page);
  },
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// REGLAS (solo lectura; las listas con reglas van al final con UI, porque las reglas solo se crean por la pantalla)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const REG = `${APP}/reglas`;
const RR = `${E2}/09d-reglas`;
caso({
  id: 'reglas__vacia',
  ruta: '/reglas',
  comp: `${REG}/pantalla.tsx`,
  ref: `${RR}/vacia`,
  escenario: a7,
  ...HOY_A7,
  soloLectura: true,
});
caso({
  id: 'regla__nueva-vacia',
  ruta: '/reglas/nueva',
  comp: `${FLU}/reglas-nueva/formulario.tsx`,
  ref: `${RR}/nueva`,
  nota: 'Formulario recién abierto.',
  escenario: a7,
  ...HOY_A7,
  soloLectura: true,
});
caso({
  id: 'regla__nueva',
  ruta: '/reglas/nueva',
  comp: `${FLU}/reglas-nueva/formulario.tsx`,
  ref: `${RR}/nueva`,
  nota: 'Con patrón y categoría llenos: la referencia muestra «Coincide con: …».',
  escenario: a7,
  ...HOY_A7,
  soloLectura: true,
  pasos: async (page) => {
    await page.getByLabel('El comercio contiene').fill('SUPER SELECTOS');
    await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Supermercado' });
  },
});

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// AJUSTES · solo lectura
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const AJU = `${APP}/ajustes`;
const RA = `${E2}/11-ajustes`;
const A7_AJU = { escenario: a7, ...HOY_A7, soloLectura: true } as const;

caso({
  id: 'ajustes__indice',
  ruta: '/ajustes',
  comp: `${AJU}/page.tsx`,
  ref: `${E3}/ajustes-indice`,
  nota: 'Primeros pasos sin ocultar en Inicio.',
  ...A7_AJU,
});
caso({
  id: 'ajustes__indice-primeros-pasos-ocultos',
  ruta: '/ajustes',
  comp: `${AJU}/recordatorio-primeros-pasos.tsx`,
  ref: `${RA}/indice`,
  nota: 'Primeros pasos ocultos: la referencia muestra «Primeros pasos: 2 de 3 · Mostrar en Inicio».',
  ...A7_AJU,
  antes: async (page) => {
    await page.addInitScript(() => window.localStorage.setItem('finn:primeros-pasos:oculto', '1'));
  },
});
caso({
  id: 'ajustes__indice-sin-cuentas',
  ruta: '/ajustes',
  comp: `${AJU}/page.tsx`,
  ref: `${E3}/ajustes-indice`,
  nota: 'Base sin cuentas ni categorías (Primeros pasos incompletos) con los pasos ocultos.',
  ops: [],
  hoy: '2027-02-10',
  soloLectura: true,
  antes: async (page) => {
    await page.addInitScript(() => window.localStorage.setItem('finn:primeros-pasos:oculto', '1'));
  },
});
caso({
  id: 'ajustes__cargando',
  ruta: '/ajustes (loading)',
  comp: `${AJU}/loading.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Proxy: /pruebas/estados/carga dibuja el mismo loading.tsx global de (finn) que Ajustes y todas sus subpáginas re-exportan.',
  ...A7_AJU,
  url: '/pruebas/estados/carga',
  carga: true,
});
caso({
  id: 'ajustes__error',
  ruta: '/ajustes (error)',
  comp: `${APP}/error.tsx`,
  ref: `${E2}/14-sin-conexion-404-y-error-de-pantalla`,
  nota: 'Proxy: /pruebas/estados/error (error.tsx global de (finn)).',
  ...A7_AJU,
  url: '/pruebas/estados/error',
});
caso({
  id: 'ajustes-ciclo__principal',
  ruta: '/ajustes/ciclo',
  comp: `${APP}/ajustes/ciclo/page.tsx`,
  ref: `${RA}/ciclo`,
  ...A7_AJU,
});
caso({
  id: 'ajustes-ciclo__aviso',
  ruta: '/ajustes/ciclo',
  comp: `${FLU}/ajustes-ciclo/panel.tsx`,
  ref: `${RA}/ciclo`,
  nota: 'Nuevo día 1 → «Ver el cambio» → aviso «Antes de confirmar».',
  ...A7_AJU,
  url: '/ajustes/ciclo',
  pasos: async (page) => {
    await page.getByLabel('Nuevo día de inicio', { exact: true }).selectOption('1');
    await page.getByRole('button', { name: 'Ver el cambio', exact: true }).click();
    await expect(page.getByRole('region', { name: 'Antes de confirmar' })).toBeVisible();
  },
});
caso({
  id: 'ajustes-notificaciones__sin-pedir',
  ruta: '/ajustes/notificaciones',
  comp: `${AJU}/notificaciones/panel.tsx`,
  ref: `${RA}/notificaciones`,
  nota: 'Permiso sin decidir, sin suscripción. FALTANTES: permiso-push.',
  ...A7_AJU,
  antes: async (page) => simularPush(page, 'default', false),
});
caso({
  id: 'ajustes-notificaciones__denegado',
  ruta: '/ajustes/notificaciones',
  comp: `${AJU}/notificaciones/panel.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Permiso denegado (la referencia solo trae «concedido»).',
  ...A7_AJU,
  antes: async (page) => simularPush(page, 'denied', false),
});
caso({
  id: 'ajustes-notificaciones__concedido',
  ruta: '/ajustes/notificaciones',
  comp: `${AJU}/notificaciones/panel.tsx`,
  ref: `${RA}/notificaciones`,
  nota: 'Permiso concedido con la suscripción de este dispositivo.',
  escenario: a7,
  ...HOY_A7,
  antes: async (page) => simularPush(page, 'granted', true),
});
caso({
  id: 'ajustes-exportar__principal',
  ruta: '/ajustes/exportar',
  comp: `${AJU}/exportar/page.tsx`,
  ref: `${RA}/exportar`,
  ...A7_AJU,
});
caso({
  id: 'ajustes-apariencia__sistema',
  ruta: '/ajustes/apariencia',
  comp: `${AJU}/apariencia/panel.tsx`,
  ref: `${RA}/apariencia`,
  nota: 'Según el sistema (valor por omisión).',
  ...A7_AJU,
});
caso({
  id: 'ajustes-apariencia__claro',
  ruta: '/ajustes/apariencia',
  comp: `${AJU}/apariencia/panel.tsx`,
  ref: `${RA}/apariencia`,
  nota: 'Tema Claro guardado (finn-tema=claro): sale claro en todas las variantes.',
  ...A7_AJU,
  antes: async (page) => {
    await page.addInitScript(() => window.localStorage.setItem('finn-tema', 'claro'));
  },
});
caso({
  id: 'ajustes-apariencia__oscuro',
  ruta: '/ajustes/apariencia',
  comp: `${AJU}/apariencia/panel.tsx`,
  ref: `${RA}/apariencia`,
  nota: 'Tema Oscuro guardado (finn-tema=oscuro): sale oscuro en todas las variantes. Comparar con la referencia telefono-oscuro.',
  ...A7_AJU,
  antes: async (page) => {
    await page.addInitScript(() => window.localStorage.setItem('finn-tema', 'oscuro'));
  },
});
caso({
  id: 'ajustes-formatos__lista',
  ruta: '/ajustes/formatos',
  comp: `${AJU}/formatos/lista.tsx`,
  ref: `${RA}/formatos`,
  ...A7_AJU,
});
caso({
  id: 'ajustes-formatos__detalle',
  ruta: '/ajustes/formatos/[formatoId]',
  comp: `${AJU}/formatos/[formatoId]/page.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Detalle/edición de un formato: sin tablero (FALTANTES solo lista formato-nuevo).',
  ...A7_AJU,
  url: '/ajustes/formatos',
  pasos: async (page) => {
    await page.locator('a[href^="/ajustes/formatos/"]:not([href$="/nuevo"])').first().click();
    await expect(page.getByLabel('Nombre del formato', { exact: true })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'ajustes-formatos__nuevo',
  ruta: '/ajustes/formatos/nuevo',
  comp: `${AJU}/formatos/nuevo/page.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: formato-nuevo.',
  ...A7_AJU,
});
caso({
  id: 'ajustes-instituciones__lista',
  ruta: '/ajustes/instituciones',
  comp: `${AJU}/instituciones/lista.tsx`,
  ref: `${RA}/formatos`,
  nota: 'La referencia formatos__* trae las instituciones al pie de la lista de formatos; la app las separa en otra ruta.',
  ...A7_AJU,
});
caso({
  id: 'ajustes-instituciones__detalle',
  ruta: '/ajustes/instituciones/[institucionId]',
  comp: `${AJU}/instituciones/[institucionId]/page.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: institucion.',
  ...A7_AJU,
  url: '/ajustes/instituciones',
  pasos: async (page) => {
    await page.locator('a[href^="/ajustes/instituciones/"]:not([href$="/nueva"])').first().click();
    await expect(page.getByLabel('Nombre', { exact: true })).toBeVisible();
    await quieta(page);
  },
});
caso({
  id: 'ajustes-instituciones__nueva',
  ruta: '/ajustes/instituciones/nueva',
  comp: `${AJU}/instituciones/nueva/page.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'FALTANTES: institucion.',
  ...A7_AJU,
});
caso({
  id: 'ajustes-seguridad__un-factor',
  ruta: '/ajustes/seguridad',
  comp: `${AJU}/seguridad/lista-factores.tsx`,
  ref: `${RA}/seguridad-factor-unico`,
  nota: 'El usuario de prueba tiene un solo factor TOTP verificado. DECISIONES «Un solo factor».',
  ...A7_AJU,
});
caso({
  id: 'ajustes-seguridad__quitar-un-factor',
  ruta: '/ajustes/seguridad/factores/[factorId]/quitar',
  comp: `${FLU}/ajustes-seguridad-factores-quitar/formulario.tsx`,
  ref: `${RA}/seguridad-factor-unico`,
  nota: 'Con un solo factor, «Quitar» abre una pantalla aparte. DECISIONES: no hay pantalla «Quitar un factor» con un solo factor.',
  ...A7_AJU,
  url: '/ajustes/seguridad',
  pasos: async (page) => {
    await page
      .getByRole('link', { name: /^Quitar/ })
      .first()
      .click();
    await expect(page).toHaveURL(/\/quitar$/);
    await quieta(page);
  },
});

// ── Simulación del permiso y la suscripción push (como en apps/web/e2e/pantallas/ajustes/notificaciones.e2e.ts) ──────────────
async function simularPush(
  page: Page,
  permiso: 'default' | 'denied' | 'granted',
  conSuscripcion: boolean,
): Promise<void> {
  await page.addInitScript(
    ([p, con]) => {
      const punto = 'https://push.example.test/send/auditoria-0123456789';
      const suscripcion = () => ({
        endpoint: punto,
        toJSON: () => ({ endpoint: punto, keys: { p256dh: 'clave-p256dh', auth: 'clave-auth' } }),
        unsubscribe: () => Promise.resolve(true),
      });
      const pushManager = {
        getSubscription: () => Promise.resolve(con === 'si' ? suscripcion() : null),
        subscribe: () => Promise.resolve(suscripcion()),
      };
      Object.assign(window, {
        Notification: { permission: p, requestPermission: () => Promise.resolve(p) },
      });
      Object.defineProperty(navigator, 'serviceWorker', {
        configurable: true,
        value: {
          ready: Promise.resolve({ pushManager }),
          addEventListener: () => undefined,
          removeEventListener: () => undefined,
          register: () => Promise.reject(new Error('sin service worker')),
        },
      });
    },
    [permiso, conSuscripcion ? 'si' : 'no'],
  );
}

// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
// CASOS QUE ESCRIBEN EN LA BASE (siempre al final; cada uno con su semilla propia, que ningún otro caso reutiliza)
// ═══════════════════════════════════════════════════════════════════════════════════════════════════════════════════════
const meta = (ruta: string, comp: string, ref: string, nota?: string) => ({
  ruta,
  comp,
  ref,
  ...(nota === undefined ? {} : { nota }),
});

caso({
  id: 'ajustes-instituciones__nueva-repetida',
  ruta: '/ajustes/instituciones/nueva',
  comp: `${AJU}/instituciones/nueva/page.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Nombre repetido («bac»): el servidor lo rechaza, nada se escribe.',
  ...A7_AJU,
  url: '/ajustes/instituciones/nueva',
  pasos: async (page) => {
    await page.getByLabel('Nombre', { exact: true }).fill('bac');
    await page.getByRole('button', { name: /^Guardar/ }).click();
    await expect(page.getByText('Ya hay una institución con ese nombre.')).toBeVisible();
  },
});

// Programadas: desactivar, y la ocurrencia registrada y omitida
caso({
  id: 'programadas__desactivada',
  ruta: '/programadas',
  comp: `${PROG}/activar.tsx`,
  ref: `${RP}/lista`,
  nota: 'Resultado de «Desactivar» en Netflix (la referencia muestra Gimnasio «Desactivada · Reactivar»).',
  escenario: esc('SEM-MAS-A7-DESACTIVAR'),
  ...P_ATRASADA,
  pasos: async (page) => {
    await page
      .locator('[data-programada]')
      .filter({ hasText: 'NETFLIX' })
      .getByRole('button', { name: 'Desactivar' })
      .click();
    await expect(page.getByTestId('resultado')).toBeVisible();
  },
});
caso({
  id: 'programada__ocurrencia-registrada',
  ruta: '/programadas/[programadaId]/ocurrencias/[fechaEsperada]',
  comp: `${FLU}/programadas-ocurrencias-fecha-esperada/formulario.tsx`,
  ref: `${RP}/ocurrencia-resuelta`,
  nota: 'Resultado de «Registrar $15.49» tocado en la hoja.',
  escenario: esc('SEM-MAS-A7-REGISTRAR'),
  ...P_ATRASADA,
  pasos: async (page) => {
    await abrirOcurrenciaDesdeLista(page);
    await page.getByRole('button', { name: /^Registrar \$/ }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
  },
});
caso({
  id: 'programada__ocurrencia-omitida',
  ruta: '/programadas/[programadaId]/ocurrencias/[fechaEsperada]',
  comp: `${FLU}/programadas-ocurrencias-fecha-esperada/formulario.tsx`,
  ref: 'SIN DISEÑO',
  nota: 'Resultado de «Omitir» (no hay tablero del resultado de omitir).',
  escenario: esc('SEM-MAS-A7-OMITIR'),
  ...P_ATRASADA,
  pasos: async (page) => {
    await abrirOcurrenciaDesdeLista(page);
    await page.getByRole('button', { name: 'Omitir', exact: true }).click();
    await expect(page.getByTestId('resultado')).toBeVisible();
  },
});

// Reglas: crear tres por la pantalla y archivar la categoría de una
test('reglas__flujo', async ({ page, context, baseURL }, info) => {
  test.setTimeout(120_000);
  await sembrarEscenario(
    esc('SEM-MAS-REGLAS', [{ op: 'OP-07', categoria: 'Cafetería', hoy: '2026-10-15' }]),
    '2026-10-15',
  );
  await entrar(context, baseURL);
  const crear = async (patron: string, categoria: string): Promise<void> => {
    await page.goto('/reglas/nueva');
    await quieta(page);
    await page.getByLabel('El comercio contiene').fill(patron);
    await page.getByLabel('Categoría', { exact: true }).selectOption({ label: categoria });
    await page.getByRole('button', { name: 'Guardar regla' }).click();
    await expect(page).toHaveURL(/\/reglas$/);
    await quieta(page);
  };
  await crear('SUPER SELECTOS', 'Supermercado');
  await crear('PUMA', 'Gasolina');
  await crear('STARBUCKS', 'Cafetería');
  await page.goto('/presupuesto/estructura');
  await quieta(page);
  await page.getByRole('link', { name: 'Editar Cafetería', exact: true }).click();
  await page.getByRole('link', { name: 'Archivar', exact: true }).click();
  await page.getByRole('button', { name: 'Archivar', exact: true }).click();
  await page.getByRole('button', { name: 'Confirmar', exact: true }).click();
  await expect(page).toHaveURL(/\/presupuesto\/categorias\/[0-9a-f-]+$/);

  await page.goto('/reglas');
  await quieta(page);
  await capturar(
    page,
    info,
    'reglas__lista',
    meta(
      '/reglas',
      `${REG}/pantalla.tsx`,
      `${RR}/lista`,
      'Tres reglas; STARBUCKS→Cafetería con la categoría archivada («No se aplica»).',
    ),
  );
  await page.getByRole('searchbox').fill('zzzz');
  await quieta(page);
  await capturar(
    page,
    info,
    'reglas__sin-coincidencias',
    meta('/reglas', `${REG}/pantalla.tsx`, 'SIN DISEÑO', 'Búsqueda sin resultados.'),
  );
  await page.goto('/reglas');
  await quieta(page);
  await page.locator('a[href^="/reglas/"]:not([href$="/nueva"])').first().click();
  await expect(page.getByRole('button', { name: 'Guardar regla' })).toBeVisible();
  await quieta(page);
  await capturar(
    page,
    info,
    'regla__editar',
    meta(
      '/reglas/[reglaId]',
      `${FLU}/reglas-regla/lector.tsx`,
      `${RR}/nueva`,
      'Editar regla: no hay tablero propio; la referencia más cercana es «nueva».',
    ),
  );
  await page.getByRole('button', { name: 'Eliminar regla' }).click();
  await quieta(page);
  await capturar(
    page,
    info,
    'regla__eliminar-confirmar',
    meta(
      '/reglas/[reglaId]',
      `${FLU}/reglas-regla/lector.tsx`,
      'SIN DISEÑO',
      'Confirmación de eliminar.',
    ),
  );
  await page.goto('/reglas/nueva');
  await quieta(page);
  await page.getByLabel('El comercio contiene').fill('PUMA');
  await page.getByLabel('Categoría', { exact: true }).selectOption({ label: 'Gasolina' });
  await page.getByRole('button', { name: 'Guardar regla' }).click();
  await expect(page.getByText(/Ya hay una regla/)).toBeVisible();
  await capturar(
    page,
    info,
    'regla__nueva-repetida',
    meta('/reglas/nueva', `${FLU}/reglas-nueva/formulario.tsx`, `${RR}/nueva-repetida`),
  );
});

// Conectar los SMS (webhook): sin token, token recién generado, conectado y cambiar token
test('ajustes-conectar-sms__flujo', async ({ page, context, baseURL }, info) => {
  test.setTimeout(120_000);
  await sembrarEscenario(esc('SEM-MAS-WEBHOOK'), '2026-10-15');
  await entrar(context, baseURL);
  const m = (ref: string, nota?: string) =>
    meta('/ajustes/webhook', `${AJU}/webhook/page.tsx`, ref, nota);
  await page.goto('/ajustes/webhook');
  await quieta(page);
  await capturar(
    page,
    info,
    'ajustes-conectar-sms__sin-token',
    m(`${RA}/conectar-sms`, 'Aún sin token (la referencia ya está conectada).'),
  );
  await page.getByRole('button', { name: 'Generar token', exact: true }).click();
  await expect(page.getByTestId('token')).toBeVisible();
  await quieta(page);
  await capturar(
    page,
    info,
    'ajustes-conectar-sms__token-generado',
    m(`${RA}/conectar-sms`, 'Token recién generado, se muestra completo una sola vez.'),
  );
  await page.getByRole('button', { name: 'Ya lo pegué en MacroDroid' }).click();
  await page.goto('/ajustes/webhook');
  await quieta(page);
  await capturar(
    page,
    info,
    'ajustes-conectar-sms__con-token',
    m(`${RA}/conectar-sms`, 'Token guardado, sin SMS recibido todavía.'),
  );
  await page.getByRole('button', { name: 'Cambiar token', exact: true }).click();
  await expect(page.getByRole('button', { name: 'Sí, cambiar el token' })).toBeVisible();
  await quieta(page);
  await capturar(
    page,
    info,
    'ajustes-conectar-sms__cambiar',
    m('SIN DISEÑO', 'Advertencia antes de cambiar el token.'),
  );
});

// Respaldo y diagnóstico: avisos como los haría GitHub Actions
test('ajustes-respaldo-diagnostico__flujo', async ({ page, context, baseURL, request }, info) => {
  test.setTimeout(120_000);
  const dia = '2026-10-15';
  await sembrarEscenario(esc('SEM-MAS-RESPALDO'), dia);
  await entrar(context, baseURL);
  const informar = async (
    evento: 'respaldo' | 'restauracion',
    token = SECRETO_RESPALDO_E2E,
  ): Promise<number> =>
    (
      await request.post(`/api/respaldo/${evento}`, {
        headers: { authorization: `Bearer ${token}` },
        data:
          evento === 'respaldo'
            ? { objeto: 'diarios/2026-10-15.dump', revision: 1, bytes: 1000 }
            : {},
      })
    ).status();
  const ir = async (ruta: string): Promise<void> => {
    await page.goto(ruta);
    await quieta(page);
  };
  const rr = (r: string, c: string, ref: string, nota?: string) =>
    meta(r, `${AJU}/${c}`, ref, nota);
  await ir('/ajustes/respaldo');
  await capturar(
    page,
    info,
    'ajustes-respaldo__sin-respaldo',
    rr('/ajustes/respaldo', 'respaldo/page.tsx', `${RA}/respaldo`, 'Nunca hubo respaldo.'),
  );
  await ir('/ajustes/diagnostico');
  await capturar(
    page,
    info,
    'ajustes-diagnostico__sin-eventos',
    rr('/ajustes/diagnostico', 'diagnostico/panel.tsx', `${RA}/diagnostico`, 'Sin eventos.'),
  );
  const estados = [await informar('respaldo'), await informar('restauracion')];
  fijarRelojServidor(`${dia}T22:00:00-06:00`);
  await ir('/ajustes');
  await capturar(
    page,
    info,
    'ajustes__indice-respaldo-al-dia',
    rr(
      '/ajustes',
      'page.tsx',
      `${E3}/ajustes-indice`,
      `Respaldo al día en el índice. POST respaldo/restauración: ${estados.join(',')}`,
    ),
  );
  await ir('/ajustes/respaldo');
  await capturar(
    page,
    info,
    'ajustes-respaldo__al-dia',
    rr(
      '/ajustes/respaldo',
      'respaldo/page.tsx',
      `${RA}/respaldo`,
      'Respaldo y restauración al día (la referencia es «atrasado»).',
    ),
  );
  fijarRelojServidor('2026-10-17T00:00:00-06:00');
  await ir('/ajustes');
  await capturar(
    page,
    info,
    'ajustes__indice-respaldo-atrasado',
    rr('/ajustes', 'lista-ajustes.tsx', `${E3}/ajustes-indice`, 'Respaldo atrasado en el índice.'),
  );
  await ir('/ajustes/respaldo');
  await capturar(
    page,
    info,
    'ajustes-respaldo__atrasado',
    rr('/ajustes/respaldo', 'respaldo/page.tsx', `${RA}/respaldo`),
  );
  await informar('respaldo', 'x'.repeat(40));
  await ir('/ajustes/diagnostico');
  await capturar(
    page,
    info,
    'ajustes-diagnostico__con-referencia',
    rr(
      '/ajustes/diagnostico',
      'diagnostico/panel.tsx',
      `${RA}/diagnostico`,
      'Un evento (token inválido del aviso de respaldo).',
    ),
  );
  await page.getByRole('searchbox').fill('no-existe');
  await quieta(page);
  await capturar(
    page,
    info,
    'ajustes-diagnostico__sin-resultados',
    rr('/ajustes/diagnostico', 'diagnostico/panel.tsx', 'SIN DISEÑO', 'Búsqueda sin resultados.'),
  );
  await ir('/ajustes/diagnostico');
  await page.getByRole('button', { name: 'Ejecutar tareas ahora', exact: true }).click();
  await expect(page.getByText(/tareas/i).first()).toBeVisible();
  // [repaso AJU] esperar a que termine «Ejecutando…» para capturar el resultado
  await expect(page.getByText('Ejecutando…')).toHaveCount(0, { timeout: 30_000 });
  await capturar(
    page,
    info,
    'ajustes-diagnostico__tareas-ejecutadas',
    rr(
      '/ajustes/diagnostico',
      'diagnostico/panel.tsx',
      `${RA}/diagnostico`,
      'Resultado de «Ejecutar tareas ahora».',
    ),
  );
});

// Seguridad: dos factores, quitar, agregar. El factor del usuario de prueba no se toca: solo se agrega y se quita un respaldo.
test('ajustes-seguridad__flujo', async ({ page, context, baseURL }, info) => {
  test.setTimeout(150_000);
  await sembrarEscenario(esc('SEM-MAS-SEGURIDAD'), '2026-10-15');
  await quitarRespaldos();
  try {
    const cliente = await clienteAal2();
    const usuario = variable('FINN_USUARIO_ID');
    const inicio = await iniciarInscripcion(cliente.auth, usuario, { nombre: 'Respaldo' });
    if (!inicio.ok) throw new Error('no se pudo iniciar el respaldo');
    const fin = await completarInscripcion(cliente.auth, usuario, {
      factorId: inicio.valor.factorId,
      codigo: codigoDe(inicio.valor.secreto),
    });
    if (!fin.ok) throw new Error('no se pudo completar el respaldo');
    await entrar(context, baseURL);
    await page.goto('/ajustes/seguridad');
    await quieta(page);
    await capturar(
      page,
      info,
      'ajustes-seguridad__dos-factores',
      meta('/ajustes/seguridad', `${AJU}/seguridad/lista-factores.tsx`, `${RA}/seguridad`),
    );
    await page
      .locator(`[data-factor="${inicio.valor.factorId}"]`)
      .getByRole('link', { name: /^Quitar/ })
      .click();
    await expect(page).toHaveURL(/\/quitar$/);
    await quieta(page);
    await capturar(
      page,
      info,
      'ajustes-seguridad__quitar-factor',
      meta(
        '/ajustes/seguridad/factores/[factorId]/quitar',
        `${FLU}/ajustes-seguridad-factores-quitar/formulario.tsx`,
        'SIN DISEÑO',
        'FALTANTES: factor-quitar. Confirmación con 2 factores, sin tocar «Quitar».',
      ),
    );
  } finally {
    await quitarRespaldos();
  }
  try {
    await page.goto('/ajustes/seguridad/factores/nuevo');
    await quieta(page);
    await capturar(
      page,
      info,
      'ajustes-seguridad__agregar-factor',
      meta(
        '/ajustes/seguridad/factores/nuevo',
        `${FLU}/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx`,
        'SIN DISEÑO',
        'FALTANTES: factor-nuevo. Código de verificación: DECISIONES pide 6 casillas de 44 × 52.',
      ),
    );
    const campo = page.getByRole('textbox').first();
    if (await campo.isVisible().catch(() => false)) {
      await campo.fill('000000');
      // [repaso AJU] enviar el código para que aparezca el error (no cambia ningún factor: el código es inválido)
      await page.keyboard.press('Enter');
      await expect(page.locator('[role=alert], [aria-invalid=true]').first()).toBeVisible({
        timeout: 15_000,
      });
      await quieta(page);
      await capturar(
        page,
        info,
        'ajustes-seguridad__agregar-factor-codigo-malo',
        meta(
          '/ajustes/seguridad/factores/nuevo',
          `${FLU}/ajustes-seguridad-factores-nuevo/inscribir-factor.tsx`,
          'SIN DISEÑO',
          'Código equivocado (000000).',
        ),
      );
    }
    await page.goto('/ajustes/seguridad');
    await quieta(page);
    await capturar(
      page,
      info,
      'ajustes-seguridad__inscripcion-sin-terminar',
      meta(
        '/ajustes/seguridad',
        `${AJU}/seguridad/lista-factores.tsx`,
        `${RA}/seguridad`,
        'Segundo factor «Inscripción sin terminar» (como en la referencia seguridad).',
      ),
    );
  } finally {
    await quitarRespaldos();
  }
});

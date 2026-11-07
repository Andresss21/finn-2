// Lo común a los presupuestos de tiempo de la web (05 §13.4, FE-48; 07 §6.6): el registro en test-results/ren/web.json, que lee
// tools/pruebas/volumen/registrar.ts para abrir el aviso y fijar FINN_REN_ROJO, y el método de INP de V5-27a.
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import type { Page } from '@playwright/test';
import { sembrar } from '../configuracion/semilla.ts';
import { fijarRelojServidor } from '../../../../tools/pruebas/e2e/reloj.ts';
import type { Presupuestos } from '../../../../tools/pruebas/rendimiento/clasificar.ts';
import type { Escenario, Op } from '../../../../packages/dominio/escenarios/tipos.ts';

export const leer = (f: string): unknown => JSON.parse(readFileSync(f, 'utf8'));
export const P = leer('presupuestos.json') as Presupuestos;
export const SESION = 'test-results/sesion.json'; // ARCHIVO_SESION de configuracion/inicio-sesion.setup.ts
export const soloNocturno = process.env['FINN_REN'] !== '1';
export const NOCTURNO = 'Presupuesto de tiempo: corre en el job `ren` del nocturno (07 §6.6)';
const WEB_JSON = '../../test-results/ren/web.json';

const HOY = '2027-02-20';
const sms = (etiqueta: string, monto: number, recibido: string): Op => ({
  op: 'OP-35',
  etiqueta,
  cuenta: 'T',
  monto,
  comercio: 'Super',
  recibido: `${HOY}T${recibido}`,
  fecha: HOY,
});
// Dos cuentas y dos categorías con dinero; una compra en Super ya aprobada (los SMS siguientes traen la categoría sugerida y se
// aprueban con un toque, 05 §4.15) y tres SMS por aprobar, uno por corrida de INP: las pantallas medidas tienen contenido.
const ESTADO: Op[] = [
  { op: 'OP-01', cuenta: 'Ahorro' },
  { op: 'OP-01', cuenta: 'T', tipo: 'tarjeta', ultimos4: '1234' },
  { op: 'OP-07', categoria: 'Super' },
  { op: 'OP-07', categoria: 'Restaurantes' },
  { op: 'OP-21', monto: 5000 },
  { op: 'OP-14', categoria: 'Super', monto: 1000, periodo: 'P1' },
  { op: 'OP-14', categoria: 'Restaurantes', monto: 1000, periodo: 'P1' },
  sms('anterior', 30, '09:00'),
  { op: 'OP-37', etiqueta: 'anterior', categoria: 'Super', aprobado: `${HOY}T09:30` },
  sms('a0', 11, '15:00'),
  sms('a1', 12, '15:10'),
  sms('a2', 13, '15:20'),
];

/** La base de las medidas de tiempo, con operaciones reales (DP-17) y el reloj del servidor fijo (DP-04). */
export async function sembrarBase(): Promise<void> {
  fijarRelojServidor(`${HOY}T20:00:00-06:00`);
  const semilla: Escenario = {
    id: 'SEM-REN-WEB',
    titulo: 'Semilla de los presupuestos de tiempo de la web',
    refs: [],
    hoy: HOY,
    estadoInicial: ESTADO,
    pasos: [],
  };
  await sembrar(semilla, HOY);
}

export interface MedidaWeb {
  id: string;
  nombre: string;
  medianaMs: number;
  presupuestoMs: number | null;
  unidad?: string;
}

export function registrar(medidas: MedidaWeb[]): void {
  mkdirSync('../../test-results/ren', { recursive: true });
  const antes = existsSync(WEB_JSON) ? (leer(WEB_JSON) as MedidaWeb[]) : [];
  writeFileSync(WEB_JSON, JSON.stringify([...antes, ...medidas], null, 2) + '\n');
}

/** CPU ×4 por CDP (05 §13.4, V5-27a). Vale para la pestaña: sigue igual después de navegar. */
export async function ralentizar(page: Page): Promise<void> {
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Emulation.setCPUThrottlingRate', { rate: 4 });
}

/** Un `PerformanceObserver` de tipo `event` en el documento actual (V5-27a); hay que ponerlo de nuevo en cada documento. */
export async function observarEventos(page: Page): Promise<void> {
  await page.evaluate(() => {
    const w = window as unknown as { duraciones: number[]; observador: PerformanceObserver };
    w.duraciones = [];
    w.observador = new PerformanceObserver((l) => {
      w.duraciones.push(...l.getEntries().map((e) => e.duration));
    });
    w.observador.observe({
      type: 'event',
      durationThreshold: 16,
      buffered: true,
    } as PerformanceObserverInit);
  });
}

/** Método de V5-27a completo: CPU ×4 y el observador. */
export async function prepararInp(page: Page): Promise<void> {
  await ralentizar(page);
  await observarEventos(page);
}

/** La interacción más lenta desde que se puso el observador o desde el último `olvidarEventos`. */
export const inpMedido = (page: Page): Promise<number> =>
  page.evaluate(async () => {
    // Una entrada de Event Timing se entrega después del cuadro que siguió al evento: dos cuadros alcanzan
    await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)));
    const w = window as unknown as { duraciones: number[]; observador: PerformanceObserver };
    w.duraciones.push(...w.observador.takeRecords().map((e) => e.duration));
    return Math.max(0, ...w.duraciones);
  });

export const olvidarEventos = (page: Page): Promise<void> =>
  page.evaluate(() => {
    const w = window as unknown as { duraciones: number[]; observador: PerformanceObserver };
    w.observador.takeRecords();
    w.duraciones = [];
  });

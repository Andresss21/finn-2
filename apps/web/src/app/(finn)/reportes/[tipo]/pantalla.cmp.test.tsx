// FT-60 Reportes, plantilla común (CH-146; 07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo
// dibuja lo que trae el DTO de `reporte()` (04 §6.9.2): los números salen del motor (PF-3).
import axe from 'axe-core';
import { page } from 'vitest/browser';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { ReporteDto } from '@finn/aplicacion/consultas/reporte';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../../globals.css';
import Cargando from './loading';
import { PantallaReporte, type Nombres, type Parametros } from './pantalla';
import type { TipoDeUrl } from './tipos';

// Solo el límite externo: `next/link` necesita el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(async () => {
  await page.viewport(414, 896);
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  document.documentElement.removeAttribute('data-theme');
});

const periodo = (ingresos: number, gastos: number) => ({
  periodo: '2027-01-21',
  ingresos,
  gastos,
  diferencia: ingresos - gastos,
  otrasEntradas: 0,
  restituciones: 0,
});
const dto = (periodos: ReturnType<typeof periodo>[]) =>
  ({
    revision: 'r1',
    hoy: '2027-02-21',
    periodoActivo: {
      inicio: '2027-02-21',
      fin: '2027-03-20',
      dias: 28,
      estado: 'activo',
      transicion: false,
      diasTranscurridos: 0,
      diasRestantes: 28,
    },
    notificacionesNoLeidas: 0,
    bandejaPorRevisar: 0,
    periodos,
  }) as unknown as ReporteDto;
const NOMBRES = {
  cuentas: [{ id: 'k1', nombre: 'Ahorro' }],
  grupos: [],
  categorias: [],
} as unknown as Nombres;

const mostrar = (
  datos: ReporteDto,
  parametros: Parametros = {},
  url: TipoDeUrl = 'ingresos-gastos',
): HTMLElement => {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(
      <PantallaReporte url={url} dto={datos} nombres={NOMBRES} parametros={parametros} />,
    );
  });
  montados.push({ raiz, nodo });
  return nodo;
};
const enlace = (raiz: HTMLElement, nombre: string): HTMLAnchorElement => {
  const a = [...raiz.querySelectorAll('a')].find((x) => x.textContent === nombre);
  if (a === undefined) throw new Error(`falta el enlace «${nombre}»`);
  return a;
};

describe('PRU-CMP-REP-150 reportes: plantilla común', () => {
  it('PRU-CMP-REP-150 [FT-60, CA-E5-3] los períodos son una barra de cinco enlaces iguales de 44 px con nombre accesible completo y el elegido marcado, y el filtro de cuentas es un botón de 48 px', () => {
    const raiz = mostrar(dto([periodo(92500, 63560)]), { ventana: 'ultimos_6' });
    const periodos = raiz.querySelector('nav[aria-label="Períodos"]');
    expect(raiz.querySelector('[data-reporte-filtros]')?.textContent).toContain('Períodos');
    expect([...(periodos?.querySelectorAll('a') ?? [])].map((a) => a.textContent)).toEqual([
      'Actual',
      '1',
      '3',
      '6',
      '12',
    ]);
    const seis = periodos?.querySelector('a[aria-label="Últimos 6 períodos"]');
    expect(seis?.getAttribute('aria-current')).toBe('true');
    expect(seis?.getAttribute('href')).toBe('/reportes/ingresos-gastos?ventana=ultimos-6');
    expect(
      periodos?.querySelector('a[aria-label="Últimos 3 períodos"]')?.getAttribute('href'),
    ).toBe('/reportes/ingresos-gastos?ventana=ultimos-3');
    for (const a of periodos?.querySelectorAll('a') ?? [])
      expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(
      new Set([...(periodos?.querySelectorAll('li') ?? [])].map((li) => li.className)).size,
    ).toBe(1);
    const cuentas = raiz.querySelector<HTMLButtonElement>(
      'button[aria-haspopup="dialog"][aria-label^="Cuentas"]',
    );
    expect(cuentas?.textContent).toBe('Todas');
    expect(cuentas?.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
  });

  it('PRU-CMP-REP-701 [CA-E5-2, CA-E5-3] el selector tiene 15 enlaces en tres grupos con el actual en aria-current; en teléfono es un botón que abre la hoja y en computadora la lista de 232 px sin pestañas', async () => {
    const raiz = mostrar(dto([periodo(92500, 63560)]), { ventana: 'ultimos_6' });
    const lista = raiz.querySelector('nav[data-selector-reportes]');
    const grupos = [...(lista?.querySelectorAll('section') ?? [])];
    expect(lista?.querySelectorAll('a')).toHaveLength(15);
    expect(grupos.map((g) => g.getAttribute('aria-label'))).toEqual([
      'Tu dinero',
      'Tu presupuesto',
      'Hábitos y tarjetas',
    ]);
    expect(grupos.map((g) => g.querySelectorAll('a').length)).toEqual([7, 5, 3]);
    const actual = lista?.querySelectorAll('a[aria-current="page"]');
    expect(actual).toHaveLength(1);
    expect(actual?.[0]?.textContent).toBe('Ingresos y gastos');
    expect(actual?.[0]?.getAttribute('href')).toBe('/reportes/ingresos-gastos?ventana=ultimos-6');
    expect(raiz.querySelector('[role="tablist"], [role="tab"]')).toBeNull();
    // Teléfono: la lista no se ve y el botón dice el grupo y el reporte.
    const boton = raiz.querySelector<HTMLButtonElement>('button[aria-label^="Reporte:"]');
    expect(boton?.getAttribute('aria-label')).toBe(
      'Reporte: Tu dinero Ingresos y gastos. Elegir otro reporte',
    );
    expect(boton?.textContent).toBe('Tu dinero Ingresos y gastos');
    expect(boton?.getBoundingClientRect().height).toBeGreaterThanOrEqual(60);
    expect(lista?.getBoundingClientRect().width).toBe(0);
    await act(() => {
      boton?.click();
      return Promise.resolve();
    });
    await vi.waitFor(async () => {
      await act(() => Promise.resolve());
      expect(document.querySelector('[role="dialog"] nav')).not.toBeNull();
    });
    const hoja = document.querySelector('[role="dialog"]');
    const filas = [...(hoja?.querySelectorAll('a') ?? [])];
    expect(filas).toHaveLength(15);
    for (const fila of filas)
      expect(fila.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    expect(hoja?.querySelector('a[aria-current="page"]')?.textContent).toBe('Ingresos y gastos');
    expect(hoja?.querySelector('a[aria-current="page"] svg')).not.toBeNull();
    // El enlace simulado de `next/link` es un `<a>` real: sin esto el clic recarga el iframe de la prueba.
    hoja?.addEventListener('click', (e) => {
      e.preventDefault();
    });
    await act(() => {
      hoja?.querySelector<HTMLAnchorElement>('a[href^="/reportes/hormiga"]')?.click();
      return Promise.resolve();
    });
    await vi.waitFor(async () => {
      await act(() => Promise.resolve());
      expect(document.querySelector('[role="dialog"]')).toBeNull();
    });
    // Computadora: la lista fija a la vista, de 232 px, y el botón no se ve.
    await page.viewport(1280, 900);
    expect(Math.round(lista?.getBoundingClientRect().width ?? 0)).toBe(232);
    expect(boton?.getBoundingClientRect().width).toBe(0);
  });

  it('PRU-CMP-REP-151 [FT-60] sin movimientos dice «No hay movimientos en estos períodos» con «Ver 3 períodos» de 48 px; si ya se miran 3 o más, no ofrece ampliar', () => {
    const vacio = dto([periodo(0, 0)]);
    const raiz = mostrar(vacio, { ventana: 'actual' });
    expect(raiz.textContent).toContain('No hay movimientos en estos períodos');
    expect(raiz.querySelector('[data-vista-grafico]')).toBeNull();
    const ver = enlace(raiz, 'Ver 3 períodos');
    expect(ver.getAttribute('href')).toBe('/reportes/ingresos-gastos?ventana=ultimos-3');
    expect(ver.getBoundingClientRect().height).toBeGreaterThanOrEqual(48);
    const otra = mostrar(vacio, { ventana: 'ultimos_6' });
    expect(otra.textContent).toContain('No hay movimientos en estos períodos');
    expect([...otra.querySelectorAll('a')].some((a) => a.textContent === 'Ver 3 períodos')).toBe(
      false,
    );
  });

  it('PRU-CMP-REP-152 [FT-60] el estado de carga anuncia «Cargando reportes» una vez, con las pestañas y la tarjeta como bloques, sin números', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<Cargando />);
    });
    montados.push({ raiz, nodo });
    expect(nodo.querySelector('[role="status"]')?.textContent).toBe('Cargando reportes');
    expect(nodo.querySelector('[aria-busy="true"]')).not.toBeNull();
    expect(nodo.querySelector('h1')?.textContent).toBe('Reportes');
    expect(nodo.querySelector('[data-centavos]')).toBeNull();
  });

  it('PRU-CMP-REP-153 [FT-60] la plantilla con gráfico y la de sin movimientos no tienen violaciones de axe en claro ni en oscuro', async () => {
    for (const tema of ['claro', 'oscuro']) {
      document.documentElement.setAttribute('data-theme', tema);
      for (const datos of [dto([periodo(92500, 63560)]), dto([periodo(0, 0)])]) {
        const raiz = mostrar(datos, { ventana: 'ultimos_3' });
        const resultado = await axe.run(raiz);
        expect(
          resultado.violations.map((v) => `${tema}: ${v.id} ${v.nodes[0]?.html.slice(0, 120)}`),
        ).toEqual([]);
        act(() => {
          montados[0]?.raiz.unmount();
        });
        montados.shift()?.nodo.remove();
      }
    }
  });
});

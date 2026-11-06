// FT-60 Reportes, plantilla común (CH-146; 07 §17: un texto, un estado o el foco de un componente es una CMP). La pantalla solo
// dibuja lo que trae el DTO de `reporte()` (04 §6.9.2): los números salen del motor (PF-3).
import axe from 'axe-core';
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
afterEach(() => {
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
  it('PRU-CMP-REP-150 [FT-60] las diez pestañas son enlaces de 44 px con el activo en la tinta de la marca, y los períodos una barra de cinco opciones iguales con la elegida marcada', () => {
    const raiz = mostrar(dto([periodo(92500, 63560)]), { ventana: 'ultimos_6' });
    const nav = raiz.querySelector('nav[aria-label="Reportes"]');
    expect(nav?.querySelectorAll('a')).toHaveLength(10);
    const activa = enlace(raiz, 'Ingresos y gastos');
    expect(activa.getAttribute('aria-current')).toBe('page');
    expect(activa.className).toContain('bg-marca');
    expect(enlace(raiz, 'Tendencia').className).not.toContain('bg-marca');
    expect(activa.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);

    const periodos = raiz.querySelector('nav[aria-label="Períodos"]');
    expect(raiz.querySelector('[data-reporte-filtros]')?.textContent).toContain('Períodos');
    expect(periodos?.querySelectorAll('a')).toHaveLength(5);
    const seis = enlace(raiz, '6 períodos');
    expect(seis.getAttribute('aria-current')).toBe('true');
    expect(seis.getAttribute('href')).toBe('/reportes/ingresos-gastos?ventana=ultimos-6');
    for (const a of periodos?.querySelectorAll('a') ?? [])
      expect(a.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(
      new Set([...(periodos?.querySelectorAll('li') ?? [])].map((li) => li.className)).size,
    ).toBe(1);
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

  it('PRU-CMP-REP-152 [FT-60] el estado de carga anuncia «Cargando la pantalla» una vez, con las pestañas y la tarjeta como bloques, sin números', () => {
    const nodo = document.createElement('div');
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(<Cargando />);
    });
    montados.push({ raiz, nodo });
    const region = nodo.querySelector('[role="status"]');
    expect(region?.getAttribute('aria-busy')).toBe('true');
    expect(region?.textContent).toBe('Cargando la pantalla');
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

import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { GraficoBarras, type PuntoBarra } from '../graficos/grafico-barras';
import { TablaEquivalente } from '../graficos/tabla-equivalente';
import { VistaGrafico } from '../graficos/vista-grafico';
import { MovimientoBandeja, vistaDe, type MovimientoDto } from './movimiento-bandeja';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene (el enrutado se prueba en E2E).
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
  delete document.documentElement.dataset['theme'];
  document.body.removeAttribute('style');
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText =
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo); width: 390px';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

function textoAccesible(n: Node): string {
  if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
  if (!(n instanceof Element) || n.getAttribute('aria-hidden') === 'true') return '';
  return [...n.childNodes].map(textoAccesible).join('');
}

const c = (n: number): Centavos => n as Centavos;
const temas = ['claro', 'oscuro'] as const;

const base: MovimientoDto = {
  id: 'm1',
  estado: 'pendiente',
  sms: { texto: 'BAC: compra por $45.00 en SUPER SELECTOS' },
  cuenta: { nombre: 'Cuenta corriente' },
  fecha: '2026-10-28',
  monto: c(-4500),
  comercio: 'SUPER SELECTOS',
  categoriaSugerida: { nombre: 'Supermercado', porRegla: true },
  aprobacion: { posible: true, faltantes: [] },
};
// Los siete estados de 06 2.12: vista, movimiento, texto del estado y color del círculo.
const SIETE: readonly (readonly [string, MovimientoDto, string, string])[] = [
  ['listo', base, 'Listo para aprobar', 'positivo'],
  [
    'falta',
    { ...base, categoriaSugerida: null, aprobacion: { posible: false, faltantes: ['destino'] } },
    'Falta la categoría',
    'advertencia',
  ],
  ['coincidencia', { ...base, estado: 'con_coincidencia' }, 'Con coincidencia', 'informacion'],
  ['duplicado', { ...base, estado: 'posible_duplicado' }, 'Posible duplicado', 'advertencia'],
  [
    'noReconocido',
    { ...base, estado: 'no_reconocido', comercio: null, monto: null },
    'No reconocido',
    'cero',
  ],
  ['error', { ...base, estado: 'error' }, 'Con error', 'problema'],
  [
    'faltaOtro',
    { ...base, aprobacion: { posible: false, faltantes: ['cuenta'] } },
    'Datos faltantes',
    'advertencia',
  ],
];

const semanas: PuntoBarra[] = [
  { clave: 's1', etiqueta: 'S1', valor: c(8000), referencia: c(10000) },
  { clave: 's2', etiqueta: 'S2', valor: c(12500), referencia: c(10000), excedido: true },
  { clave: 's3', etiqueta: 'S3', valor: c(5000), referencia: c(10000), actual: true },
  {
    clave: 's4',
    etiqueta: 'S4',
    valor: c(0),
    referencia: c(10000),
    futura: true,
    nota: 'faltan 2 días',
  },
];

describe('PRU-CMP-CTA-102 bandeja y gráficos', () => {
  it.each(SIETE)(
    'PRU-CMP-CTA-102 fila de la bandeja en estado %s [FE-44]',
    (vista, mov, etiqueta, estado) => {
      expect(vistaDe(mov)).toBe(vista);
      const raiz = montar(<MovimientoBandeja movimiento={mov} hrefRevisar="/bandeja/m1" />);
      const fila = raiz.querySelector('[data-movimiento]');
      expect(fila?.getAttribute('data-vista')).toBe(vista);
      expect(textoAccesible(fila as Element)).toContain(etiqueta);
      expect(fila?.querySelector('svg[aria-hidden="true"]')?.parentElement?.className).toContain(
        `${estado}-fondo`,
      );
      for (const el of raiz.querySelectorAll('[data-movimiento] button, [data-movimiento] a')) {
        expect(el.getBoundingClientRect().height, el.textContent).toBeGreaterThanOrEqual(44);
      }
    },
  );

  it('PRU-CMP-CTA-102 fila de la bandeja: acciones de un toque con el comercio en su nombre y pista por regla [FE-44]', () => {
    const llamadas: string[] = [];
    const raiz = montar(
      <>
        <MovimientoBandeja
          movimiento={base}
          hrefRevisar="/b/1"
          alAccionar={(a, id) => llamadas.push(`${a}:${id}`)}
        />
        <MovimientoBandeja
          movimiento={{ ...base, id: 'm2', estado: 'posible_duplicado' }}
          hrefRevisar="/b/2"
        />
        <MovimientoBandeja
          movimiento={{ ...base, id: 'm3', estado: 'no_reconocido' }}
          hrefRevisar="/b/3"
        />
        <MovimientoBandeja movimiento={{ ...base, id: 'm4', estado: 'error' }} hrefRevisar="/b/4" />
        <MovimientoBandeja
          movimiento={{ ...base, id: 'm5', aprobacion: { posible: false, faltantes: ['cuenta'] } }}
          hrefRevisar="/b/5"
        />
      </>,
    );
    expect(textoAccesible(raiz)).toContain('→ Supermercado (por regla)');
    const aprobar = raiz.querySelector<HTMLButtonElement>(
      'button[aria-label="Aprobar SUPER SELECTOS"]',
    );
    act(() => {
      aprobar?.click();
    });
    expect(llamadas).toEqual(['aprobar:m1']);
    const nombres = [...raiz.querySelectorAll('button')].map((b) => b.getAttribute('aria-label'));
    expect(nombres).toEqual([
      'Aprobar SUPER SELECTOS',
      'Es otro gasto SUPER SELECTOS',
      'Descartar SUPER SELECTOS',
      'Intentar de nuevo SUPER SELECTOS',
      'Copiar referencia SUPER SELECTOS',
    ]);
    expect(raiz.querySelector('blockquote')?.textContent).toContain('compra por $45.00');
    expect(raiz.querySelector('a[href="/b/3"]')?.textContent).toBe('Registrar a mano');
    expect(raiz.querySelector('a[href="/b/5"]')?.textContent).toBe('Completar datos');
  });

  it('PRU-CMP-CTA-102 gráfico de barras: role="img" con nombre, tope de referencia, semana futura y tabla equivalente [FE-44]', () => {
    const raiz = montar(
      <>
        <GraficoBarras titulo="Gasto semanal" resumen="$50.00 en la semana 3" puntos={semanas} />
        <TablaEquivalente titulo="Gasto semanal" puntos={semanas} />
      </>,
    );
    const svg = raiz.querySelector('svg[role="img"]');
    expect(svg?.getAttribute('aria-label')).toBe('Gasto semanal: $50.00 en la semana 3');
    expect(svg?.querySelectorAll('[data-punto]').length).toBe(4);
    expect(svg?.querySelectorAll('path[stroke-width="2"]').length).toBe(4);
    expect(svg?.querySelector('[data-punto="s4"] rect')?.getAttribute('stroke-dasharray')).toBe(
      '3 3',
    );
    const tabla = raiz.querySelector('table');
    expect(tabla?.querySelector('caption')?.textContent).toBe('Gasto semanal');
    expect(tabla?.querySelectorAll('tbody th[scope="row"]').length).toBe(4);
    const filas = [...(tabla?.querySelectorAll('tbody tr') ?? [])].map(textoAccesible);
    expect(filas[1]).toContain('$125.00');
    expect(filas[1]).toContain('Se pasó');
    expect(filas[3]).toContain('faltan 2 días');
  });

  it('PRU-CMP-CTA-102 gráfico de barras sin datos y con un solo punto [FE-44]', () => {
    const vacio = montar(<GraficoBarras titulo="Historial" resumen="" puntos={[]} />);
    expect(vacio.querySelector('[data-grafico-vacio]')?.textContent).toContain(
      'Todavía no hay datos',
    );
    const uno = montar(
      <GraficoBarras titulo="Historial" resumen="$10.00" puntos={[semanas[0] as PuntoBarra]} />,
    );
    expect(uno.querySelectorAll('[data-punto]').length).toBe(1);
  });

  it('PRU-CMP-CTA-102 selector Gráfico / Tabla: radiogroup que alterna la vista sin sacar la tabla del árbol [FE-44]', () => {
    const raiz = montar(
      <VistaGrafico
        grafico={<GraficoBarras titulo="Historial" resumen="$50.00" puntos={semanas} />}
        tabla={<TablaEquivalente titulo="Historial" puntos={semanas} />}
      />,
    );
    const grupo = raiz.querySelector('[role="radiogroup"]');
    expect(grupo?.getAttribute('aria-label')).toBe('Vista');
    const opciones = [...raiz.querySelectorAll<HTMLElement>('[role="radio"]')];
    expect(opciones.map((o) => o.textContent)).toEqual(['Gráfico', 'Tabla']);
    for (const o of opciones) expect(o.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    const tabla = raiz.querySelector('table') as HTMLElement;
    expect(tabla.parentElement?.className).toContain('sr-only');
    expect(tabla.closest('[aria-hidden="true"]')).toBeNull();
    act(() => {
      opciones[1]?.click();
    });
    expect(raiz.querySelector('[data-vista-grafico]')?.getAttribute('data-vista-grafico')).toBe(
      'tabla',
    );
    expect(tabla.parentElement?.className).not.toContain('sr-only');
    expect((raiz.querySelector('svg[role="img"]') as Element).parentElement?.className).toContain(
      'sr-only',
    );
  });

  it.each(temas)('PRU-CMP-CTA-102 axe sin violaciones en el tema %s [FE-44]', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(
      <>
        {SIETE.map(([v, m]) => (
          <MovimientoBandeja key={v} movimiento={{ ...m, id: v }} hrefRevisar={`/bandeja/${v}`} />
        ))}
        <VistaGrafico
          grafico={<GraficoBarras titulo="Gasto semanal" resumen="$50.00" puntos={semanas} />}
          tabla={<TablaEquivalente titulo="Gasto semanal" puntos={semanas} />}
        />
      </>,
    );
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });
});

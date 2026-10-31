import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it } from 'vitest';
import '../../app/globals.css';
import { IndicadorEstado, type EstadoFinanciero } from './indicador-estado';
import { Monto } from './monto';

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
    'background: var(--fondo); color: var(--texto); font-family: var(--fuente-cuerpo)';
  const nodo = document.createElement('main');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

// Lo que un lector de pantalla recorre: el texto fuera de subárboles `aria-hidden` ni `svg` decorativos.
function textoAccesible(n: Node): string {
  if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
  if (!(n instanceof Element) || n.getAttribute('aria-hidden') === 'true') return '';
  return [...n.childNodes].map(textoAccesible).join('');
}

const ESTADOS: readonly (readonly [EstadoFinanciero, string])[] = [
  ['positivo', 'Meta cubierta'],
  ['cero', 'Sin saldo'],
  ['problema', 'Sobregiro con débito o efectivo'],
  ['advertencia', 'Falta para la meta'],
  ['deuda', 'Deuda de tarjeta'],
  ['deuda-sin-respaldo', 'Deuda sin reservar'],
  ['informacion', 'En camino'],
];
const temas = ['claro', 'oscuro'] as const;
const c = (n: number): Centavos => n as Centavos;

describe('PRU-CMP-VAL-005 Monto e IndicadorEstado en el árbol de accesibilidad [V5-25]', () => {
  it('PRU-CMP-VAL-005 Monto negativo se lee "menos $1,234.50", con data-centavos y el visible fuera del árbol', () => {
    const raiz = montar(<Monto centavos={c(-123450)} />);
    const m = raiz.querySelector('[data-centavos]');
    expect(m?.getAttribute('data-centavos')).toBe('-123450');
    expect(textoAccesible(raiz)).toBe('menos $1,234.50');
    expect(m?.querySelector('[aria-hidden="true"]')?.textContent).toBe('−$1,234.50');
  });

  it('PRU-CMP-VAL-005 Monto positivo, cero y absoluto', () => {
    const raiz = montar(
      <>
        <Monto centavos={c(4500)} />
        <Monto centavos={c(0)} />
        <Monto centavos={c(-4500)} presentacion="absoluto" estado="problema" rol="cifra" />
      </>,
    );
    expect(textoAccesible(raiz)).toBe('$45.00$0.00$45.00');
    const [a, , abs] = [...raiz.querySelectorAll('[data-centavos]')];
    expect(a?.className).toContain('tabular-nums');
    expect(abs?.getAttribute('data-centavos')).toBe('-4500');
    expect(abs?.className).toContain('text-problema-texto');
  });

  it.each(ESTADOS)(
    'PRU-CMP-VAL-005 IndicadorEstado %s aporta su etiqueta y un glifo oculto',
    (estado, etiqueta) => {
      const raiz = montar(<IndicadorEstado estado={estado} etiqueta={etiqueta} />);
      const el = raiz.querySelector('[data-estado]');
      expect(el?.getAttribute('data-estado')).toBe(estado);
      expect(textoAccesible(raiz)).toBe(etiqueta);
      const glifo = el?.querySelector('svg');
      expect(glifo?.getAttribute('aria-hidden')).toBe('true');
      expect(glifo?.querySelector('path, circle, rect')).not.toBeNull();
    },
  );

  it('PRU-CMP-VAL-005 con visible=false el nombre queda solo para lectores y el glifo sigue', () => {
    const raiz = montar(
      <IndicadorEstado estado="deuda" etiqueta="Deuda de tarjeta" visible={false} />,
    );
    expect(textoAccesible(raiz)).toBe('Deuda de tarjeta');
    expect(raiz.querySelector('.sr-only')?.textContent).toBe('Deuda de tarjeta');
    expect(raiz.querySelector('svg')).not.toBeNull();
  });

  it('PRU-CMP-VAL-005 cada estado tiene un glifo distinto (forma, no solo color)', () => {
    const raiz = montar(
      <>
        {ESTADOS.map(([e, t]) => (
          <IndicadorEstado key={e} estado={e} etiqueta={t} />
        ))}
      </>,
    );
    const formas = [...raiz.querySelectorAll('svg')].map((s) => s.innerHTML);
    expect(new Set(formas).size).toBe(ESTADOS.length);
  });

  it.each(temas)('PRU-CMP-VAL-005 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(
      <>
        <Monto centavos={c(-123450)} rol="cifra-principal" estado="problema" />
        {ESTADOS.map(([e, t]) => (
          <IndicadorEstado key={e} estado={e} etiqueta={t} />
        ))}
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

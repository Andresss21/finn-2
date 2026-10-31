import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import type { Centavos } from '@finn/dominio/valores';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { SelectorPeriodo, type PeriodoDto } from '../navegacion/selector-periodo';
import { ResumenListoParaAsignar } from './billete';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene (y el enrutado se prueba en E2E):
// se sustituye por un ancla, con el mismo contrato de `EnlaceFinn` (href y atributos) y sin navegación pendiente.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  // `next/link` es CommonJS: el módulo es la propia función, con `useLinkStatus` como propiedad.
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

function textoAccesible(n: Node | undefined | null): string {
  if (n === undefined || n === null) return '';
  if (n.nodeType === Node.TEXT_NODE) return n.textContent ?? '';
  if (!(n instanceof Element) || n.getAttribute('aria-hidden') === 'true') return '';
  return [...n.childNodes].map(textoAccesible).join('');
}

const c = (n: number): Centavos => n as Centavos;
const temas = ['claro', 'oscuro'] as const;

const activo: PeriodoDto = {
  inicio: '2026-09-21',
  fin: '2026-10-20',
  dias: 30,
  estado: 'activo',
  transicion: false,
  diasTranscurridos: 25,
  diasRestantes: 5,
};
const otro = (p: Partial<PeriodoDto>): PeriodoDto => ({
  ...activo,
  inicio: '2026-08-21',
  fin: '2026-09-20',
  estado: 'cerrado',
  diasTranscurridos: 0,
  diasRestantes: 0,
  ...p,
});

const billetes = (
  <>
    <ResumenListoParaAsignar
      variante="billete"
      lpa={c(31240)}
      enCamino={c(4000)}
      lpaNegativo={false}
      accion={{ href: '/presupuesto/asignar', texto: 'Asignar $312.40' }}
    />
    <ResumenListoParaAsignar variante="billete" lpa={c(0)} enCamino={c(0)} lpaNegativo={false} />
    <ResumenListoParaAsignar
      variante="billete"
      lpa={c(-8615)}
      enCamino={c(0)}
      lpaNegativo
      accion={{ href: '/presupuesto/quitar', texto: 'Quitar $86.15 de una categoría' }}
    />
    <ResumenListoParaAsignar
      variante="franja"
      lpa={c(31240)}
      enCamino={c(4000)}
      lpaNegativo={false}
      accion={{ href: '/a', texto: 'Asignar' }}
    />
  </>
);
const selectores = (
  <>
    <SelectorPeriodo
      periodo={activo}
      periodoActivo={activo}
      anterior="2026-08-21"
      siguiente="2026-10-21"
      ruta="/presupuesto"
      parametros={{}}
    />
    <SelectorPeriodo
      periodo={otro({})}
      periodoActivo={activo}
      siguiente="2026-09-21"
      ruta="/presupuesto"
      parametros={{ vista: 'x' }}
    />
    <SelectorPeriodo
      periodo={otro({ inicio: '2026-10-21', fin: '2026-11-20', estado: 'futuro' })}
      periodoActivo={activo}
      anterior="2026-09-21"
      siguiente="2026-11-21"
      ruta="/presupuesto"
      parametros={{}}
    />
    <SelectorPeriodo
      periodo={otro({ transicion: true })}
      periodoActivo={activo}
      anterior="2026-07-21"
      siguiente="2026-09-21"
      ruta="/presupuesto"
      parametros={{}}
    />
  </>
);

describe('PRU-CMP-PRES-102 billete y selector de período [FE-31, CF-13]', () => {
  it('PRU-CMP-PRES-102 billete de LPA: positivo con En camino, cero, negativo y franja', () => {
    const raiz = montar(billetes);
    const [pos, cero, neg, franja] = [...raiz.querySelectorAll('[data-resumen-lpa]')];
    expect(textoAccesible(pos)).toContain('Listo para asignar');
    expect(pos?.querySelector('[data-centavos]')?.getAttribute('data-centavos')).toBe('31240');
    expect(textoAccesible(pos?.querySelector('[data-centavos]'))).toBe('$312.40');
    expect(textoAccesible(pos?.querySelector('[data-en-camino]'))).toBe('En camino $40.00');
    expect(pos?.querySelector('a')?.getAttribute('href')).toBe('/presupuesto/asignar');
    expect(pos?.querySelector('[data-estado]')).toBeNull();
    expect(cero?.querySelector('[data-estado="cero"]')?.textContent).toBe('Todo asignado');
    expect(cero?.querySelector('[data-en-camino]')).toBeNull();
    expect(neg?.querySelector('[data-estado="problema"]')?.textContent).toBe(
      'Asignaste más de lo que tenés',
    );
    expect(textoAccesible(neg?.querySelector('[data-centavos]'))).toBe('menos $86.15');
    expect(neg?.querySelector('a')?.textContent).toBe('Quitar $86.15 de una categoría');
    expect(franja?.getAttribute('data-resumen-lpa')).toBe('franja');
    expect(franja?.querySelector('a')?.textContent).toBe('Asignar');
    // Las cifras ruedan con 90 ms entre dígitos.
    const digitos = [
      ...(pos?.querySelectorAll('[data-centavos] [aria-hidden="true"] > span') ?? []),
    ];
    expect(digitos.slice(0, 3).map((d) => (d as HTMLElement).style.animationDelay)).toEqual([
      '0ms',
      '90ms',
      '180ms',
    ]);
  });

  it('PRU-CMP-PRES-102 selector: enlaces, activo sin parámetro y los cuatro estados', () => {
    const raiz = montar(selectores);
    const [a, ce, fu, tr] = [...raiz.querySelectorAll('[data-selector-periodo]')];
    expect(a?.getAttribute('data-selector-periodo')).toBe('activo');
    expect(textoAccesible(a)).toContain('21 sep – 20 oct 2026');
    expect(textoAccesible(a)).toContain('Actual · 25 días transcurridos · quedan 5');
    expect(a?.querySelector('a[aria-label="Período anterior"]')?.getAttribute('href')).toBe(
      '/presupuesto?periodo=2026-08-21',
    );
    expect(a?.querySelector('a[aria-label="Período siguiente"]')?.getAttribute('href')).toBe(
      '/presupuesto?periodo=2026-10-21',
    );
    expect(a?.textContent).not.toContain('Ir al período actual');
    expect(textoAccesible(ce)).toContain('Cerrado');
    // El enlace al período activo quita `?periodo=` y conserva los demás parámetros.
    expect(ce?.querySelector('a[aria-label="Período siguiente"]')?.getAttribute('href')).toBe(
      '/presupuesto?vista=x',
    );
    expect(ce?.querySelector('a[aria-label="Período anterior"]')).toBeNull();
    const actual = [...(ce?.querySelectorAll('a') ?? [])].find(
      (l) => l.textContent === 'Ir al período actual',
    );
    expect(actual?.getAttribute('href')).toBe('/presupuesto?vista=x');
    expect(textoAccesible(fu)).toContain('Futuro');
    expect(textoAccesible(tr)).toContain('De transición');
  });

  it.each(temas)('PRU-CMP-PRES-102 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(
      <>
        {billetes}
        {selectores}
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

import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { Pastillas } from './pastillas';
import { SelectorSegmentado } from './selector-segmentado';

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
  // Como globals.css: el fondo y el texto de la página vienen de los tokens.
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

const filtros = [
  { valor: 'todas', etiqueta: 'Todas' },
  { valor: 'sobregiradas', etiqueta: 'Sobregiradas' },
  { valor: 'cubiertas', etiqueta: 'Cubiertas' },
];
const vistas = [
  { valor: 'grafico', etiqueta: 'Gráfico' },
  { valor: 'tabla', etiqueta: 'Tabla' },
];

function Galeria() {
  const [f, setF] = useState('todas');
  const [v, setV] = useState('grafico');
  return (
    <>
      <Pastillas etiqueta="Filtro" opciones={filtros} valor={f} alCambiar={setF} />
      <SelectorSegmentado etiqueta="Vista" opciones={vistas} valor={v} alCambiar={setV} />
    </>
  );
}

const temas = ['claro', 'oscuro'] as const;

describe('PRU-CMP-VAL-105 pastillas y selector segmentado', () => {
  it.each(temas)('PRU-CMP-VAL-105 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(<Galeria />);
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });

  it('PRU-CMP-VAL-105 todo control mide al menos 44 × 44 px', () => {
    const raiz = montar(<Galeria />);
    const controles = [...raiz.querySelectorAll<HTMLElement>('button')];
    expect(controles).toHaveLength(5);
    const chicos = controles
      .map((el) => ({ texto: el.textContent, r: el.getBoundingClientRect() }))
      .filter((m) => m.r.width < 44 || m.r.height < 44);
    expect(chicos).toEqual([]);
  });

  it('PRU-CMP-VAL-105 cada control tiene nombre accesible y el foco se ve', () => {
    const raiz = montar(<Galeria />);
    expect(raiz.querySelector('[role=group]')?.getAttribute('aria-label')).toBe('Filtro');
    expect(raiz.querySelector('[role=radiogroup]')?.getAttribute('aria-label')).toBe('Vista');
    for (const el of raiz.querySelectorAll<HTMLElement>('button')) {
      expect(el.textContent, el.outerHTML).toBeTruthy();
      act(() => {
        el.focus();
      });
      const estilo = getComputedStyle(el);
      expect(el.matches(':focus-visible'), el.outerHTML).toBe(true);
      expect(estilo.outlineStyle, el.outerHTML).toBe('solid');
      expect(Number(estilo.outlineWidth.slice(0, -2))).toBeGreaterThanOrEqual(2);
    }
  });

  it('PRU-CMP-VAL-105 la pastilla activa se marca por atributo y por peso, no solo por color', async () => {
    const elegida = vi.fn();
    const raiz = montar(
      <Pastillas etiqueta="Filtro" opciones={filtros} valor="todas" alCambiar={elegida} />,
    );
    const [activa, otra] = [...raiz.querySelectorAll<HTMLElement>('button')] as [
      HTMLElement,
      HTMLElement,
    ];
    expect(activa.getAttribute('aria-pressed')).toBe('true');
    expect(otra.getAttribute('aria-pressed')).toBe('false');
    expect(Number(getComputedStyle(activa).fontWeight)).toBeGreaterThan(
      Number(getComputedStyle(otra).fontWeight),
    );
    expect(getComputedStyle(activa).backgroundColor).not.toBe(
      getComputedStyle(otra).backgroundColor,
    );
    await userEvent.click(otra);
    expect(elegida).toHaveBeenCalledWith('sobregiradas');
  });

  it('PRU-CMP-VAL-105 el selector segmentado marca lo activo por atributo y peso, y las flechas cambian la opción', async () => {
    const elegida = vi.fn();
    const raiz = montar(
      <SelectorSegmentado etiqueta="Vista" opciones={vistas} valor="grafico" alCambiar={elegida} />,
    );
    const [activa, otra] = [...raiz.querySelectorAll<HTMLElement>('[role=radio]')] as [
      HTMLElement,
      HTMLElement,
    ];
    expect(activa.getAttribute('aria-checked')).toBe('true');
    expect(otra.getAttribute('aria-checked')).toBe('false');
    expect(Number(getComputedStyle(activa).fontWeight)).toBeGreaterThan(
      Number(getComputedStyle(otra).fontWeight),
    );
    // Radix responde al puntero y al teclado solo: se opera fuera de `act`.
    const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
    entorno.IS_REACT_ACT_ENVIRONMENT = false;
    try {
      activa.focus();
      expect(document.activeElement).toBe(activa);
      // Radix mueve el foco con un temporizador: la tecla se mantiene hasta que lo hace.
      await userEvent.keyboard('{ArrowRight>}');
      await vi.waitFor(() => {
        expect(elegida).toHaveBeenCalledWith('tabla');
      });
      await userEvent.keyboard('{/ArrowRight}');
    } finally {
      entorno.IS_REACT_ACT_ENVIRONMENT = true;
    }
  });
});

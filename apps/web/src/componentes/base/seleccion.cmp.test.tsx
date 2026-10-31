import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { Buscador, Seleccion, type Opcion } from './seleccion';

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

const pocas: Opcion[] = [
  { valor: 'a', etiqueta: 'Efectivo', descripcion: 'Billetera' },
  { valor: 'b', etiqueta: 'Débito' },
];
const muchas: Opcion[] = Array.from({ length: 10 }, (_, i) => ({
  valor: String(i),
  etiqueta: `Cuenta ${i}`,
}));

function Galeria() {
  const [v, setV] = useState('a');
  const [lista, setLista] = useState('3');
  return (
    <>
      <Seleccion etiqueta="Tipo" opciones={pocas} valor={v} alCambiar={setV} />
      <Seleccion etiqueta="Cuenta" opciones={muchas} valor={lista} alCambiar={setLista} />
      <Buscador
        etiqueta="Categoría"
        buscar={() => Promise.resolve(pocas)}
        valor={null}
        alCambiar={() => {}}
      />
    </>
  );
}

const temas = ['claro', 'oscuro'] as const;

// El objetivo de los radios es la etiqueta que los envuelve.
function objetivos(raiz: HTMLElement): HTMLElement[] {
  return [
    ...raiz.querySelectorAll<HTMLElement>(
      'button:not([role=radio]), input, label:has([role=radio])',
    ),
  ];
}

// Radix abre con el puntero y el buscador responde solo: se opera fuera de `act`.
async function sinAct(accion: () => Promise<void>): Promise<void> {
  const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  entorno.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await accion();
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
  }
}

describe('PRU-CMP-VAL-104 selección y buscador', () => {
  it.each(temas)('PRU-CMP-VAL-104 axe sin violaciones en el tema %s', async (tema) => {
    document.documentElement.dataset['theme'] = tema;
    const raiz = montar(<Galeria />);
    const { violations } = await axe.run(raiz, {
      runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
    });
    expect(
      violations.map((v) => `${v.id}: ${v.nodes.map((n) => n.target.join(' ')).join(', ')}`),
    ).toEqual([]);
  });

  it('PRU-CMP-VAL-104 todo control mide al menos 44 × 44 px', () => {
    const raiz = montar(<Galeria />);
    const medidas = objetivos(raiz).map((el) => {
      const r = el.getBoundingClientRect();
      return { texto: el.textContent || el.tagName, ancho: r.width, alto: r.height };
    });
    expect(medidas.length).toBe(4);
    expect(medidas.filter((m) => m.ancho < 44 || m.alto < 44)).toEqual([]);
  });

  it('PRU-CMP-VAL-104 cada control tiene nombre accesible y el foco se ve', () => {
    const raiz = montar(<Galeria />);
    for (const el of raiz.querySelectorAll<HTMLElement>('button, input, [role=radio]')) {
      const nombre =
        el.getAttribute('aria-label') ||
        (el as HTMLInputElement).labels?.[0]?.textContent ||
        el.closest('label')?.textContent;
      expect(nombre, el.outerHTML).toBeTruthy();
      act(() => {
        el.focus();
      });
      const estilo = getComputedStyle(el);
      expect(el.matches(':focus-visible'), el.outerHTML).toBe(true);
      expect(estilo.outlineStyle, el.outerHTML).toBe('solid');
      expect(Number(estilo.outlineWidth.slice(0, -2))).toBeGreaterThanOrEqual(2);
    }
  });

  it('PRU-CMP-VAL-104 hasta 7 opciones se ven como radios y con más se abre una lista', async () => {
    const elegida = vi.fn();
    const raiz = montar(
      <>
        <Seleccion etiqueta="Tipo" opciones={pocas} valor="a" alCambiar={() => {}} />
        <Seleccion etiqueta="Cuenta" opciones={muchas} valor="3" alCambiar={elegida} />
      </>,
    );
    expect(raiz.querySelectorAll('[role=radio]')).toHaveLength(2);
    expect(raiz.querySelector('[role=radio][aria-checked=true]')?.getAttribute('value')).toBe('a');
    expect(raiz.querySelector('[role=radiogroup]')?.getAttribute('aria-labelledby')).toBeTruthy();
    const lista = raiz.querySelector('button[role=combobox]') as HTMLButtonElement;
    expect(lista.labels[0]?.textContent).toContain('Cuenta');
    expect(lista.textContent).toBe('Cuenta 3');
    await sinAct(async () => {
      await userEvent.click(lista);
      await vi.waitFor(() => {
        expect(document.querySelectorAll('[role=option]')).toHaveLength(10);
      });
      await userEvent.click(document.querySelectorAll('[role=option]')[4] as HTMLElement);
      await vi.waitFor(() => {
        expect(elegida).toHaveBeenCalledWith('4');
      });
    });
  });

  it('PRU-CMP-VAL-104 el buscador es un combobox que anuncia la cantidad de resultados y se maneja con teclado', async () => {
    const elegido = vi.fn();
    const raiz = montar(
      <Buscador
        etiqueta="Categoría"
        buscar={() => Promise.resolve(pocas)}
        valor={null}
        alCambiar={elegido}
      />,
    );
    const caja = raiz.querySelector('input') as HTMLInputElement;
    expect(caja.getAttribute('role')).toBe('combobox');
    await sinAct(async () => {
      await userEvent.type(caja, 'e');
      await vi.waitFor(() => {
        expect(raiz.querySelector('[role=status]')?.textContent).toBe('2 resultados');
      });
      expect(caja.getAttribute('aria-expanded')).toBe('true');
      await userEvent.keyboard('{ArrowDown}');
      await vi.waitFor(() => {
        expect(caja.getAttribute('aria-activedescendant')).toBe(
          raiz.querySelector('[role=option]')?.id,
        );
      });
      await userEvent.keyboard('{Enter}');
    });
    expect(elegido).toHaveBeenCalledWith(pocas[0]);
    expect(caja.value).toBe('Efectivo');
  });

  it('PRU-CMP-VAL-104 el buscador descarta la respuesta tardía de una búsqueda anterior', async () => {
    const pendientes = new Map<string, (r: readonly Opcion[]) => void>();
    const raiz = montar(
      <Buscador
        etiqueta="Categoría"
        buscar={(t) =>
          new Promise<readonly Opcion[]>((resolver) => {
            pendientes.set(t, resolver);
          })
        }
        valor={null}
        alCambiar={() => {}}
      />,
    );
    const caja = raiz.querySelector('input') as HTMLInputElement;
    await sinAct(async () => {
      await userEvent.type(caja, 'ab');
      await vi.waitFor(() => {
        expect(pendientes.size).toBe(2);
      });
      pendientes.get('ab')?.([{ valor: 'n', etiqueta: 'Nueva' }]);
      await vi.waitFor(() => {
        expect(raiz.querySelector('[role=status]')?.textContent).toBe('1 resultado');
      });
      pendientes.get('a')?.([
        { valor: 'x', etiqueta: 'Vieja 1' },
        { valor: 'y', etiqueta: 'Vieja 2' },
      ]);
      await Promise.resolve();
    });
    expect(raiz.querySelector('[role=status]')?.textContent).toBe('1 resultado');
    expect([...raiz.querySelectorAll('[role=option]')].map((o) => o.textContent)).toEqual([
      'Nueva',
    ]);
  });
});

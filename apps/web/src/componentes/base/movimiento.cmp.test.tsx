// Utilidades de movimiento compartidas de la entrega 3 (CH-220 d; FIXES §3): escalonado por índice, presionado, indicador del
// segmentado, vacíos, Más secciones y el hook de movimiento reducido. La duración sale de los tokens y se mide en el estilo
// calculado: ninguna prueba espera el reloj.
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { navegacion } from '../../textos/navegacion';
import { indice } from '../movimiento/indice';
import { useMovimientoReducido } from '../movimiento/use-movimiento-reducido';
import { MasSecciones } from '../navegacion/navegacion-app';
import { SECCIONES } from '../navegacion/secciones';
import { SelectorSegmentado } from './selector-segmentado';
import { Vacio } from './vacio';

// Solo el límite externo: `next/link` y `next/navigation` necesitan el enrutador de Next, que el navegador de prueba no tiene.
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('next/navigation', () => ({
  usePathname: () => '/',
  useSearchParams: () => new URLSearchParams(),
  useRouter: () => ({ refresh: () => undefined, replace: () => undefined, back: () => undefined }),
}));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  vi.restoreAllMocks();
});

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

// El navegador de prueba opera de verdad (puntero y teclado): fuera de `act`, como en las demás pruebas de componentes.
async function sinAct(accion: () => Promise<void>): Promise<void> {
  const entorno = globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean };
  entorno.IS_REACT_ACT_ENVIRONMENT = false;
  try {
    await accion();
  } finally {
    entorno.IS_REACT_ACT_ENVIRONMENT = true;
  }
}

const segundos = (valor: string): number => Number(valor.replace('s', ''));
const estilo = (el: Element) => getComputedStyle(el);

/** Reglas de `globals.css` (aplanadas dentro de `@media`/`@layer`) con la condición de medios que las envuelve. */
function reglas(): { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] {
  const salida: { selector: string; condicion: string; estilo: CSSStyleDeclaration }[] = [];
  const recorrer = (lista: CSSRuleList, condicion: string) => {
    for (const r of Array.from(lista)) {
      if (r instanceof CSSStyleRule)
        salida.push({ selector: r.selectorText, condicion, estilo: r.style });
      else if (r instanceof CSSMediaRule) recorrer(r.cssRules, r.conditionText);
      else if ('cssRules' in r) recorrer((r as CSSGroupingRule).cssRules, condicion);
    }
  };
  for (const hoja of Array.from(document.styleSheets)) {
    try {
      recorrer(hoja.cssRules, '');
    } catch {
      // una hoja de otro origen no se lee
    }
  }
  return salida;
}

function Segmentado() {
  const [v, setV] = useState('a');
  return (
    <SelectorSegmentado
      etiqueta="Tipo"
      valor={v}
      alCambiar={setV}
      opciones={[
        { valor: 'a', etiqueta: 'Gasto' },
        { valor: 'b', etiqueta: 'Ingreso largo' },
        { valor: 'c', etiqueta: 'Mov' },
      ]}
    />
  );
}

function Lector() {
  return <p>{useMovimientoReducido() ? 'reducido' : 'normal'}</p>;
}

describe('PRU-CMP-PWA', () => {
  it('PRU-CMP-PWA-310 [] los bloques de pantalla y las filas reciben su retraso escalonado (60 ms, 40 ms en opciones) con tope de 8, y con movimiento reducido no hay animation activa', () => {
    const nodo = document.createElement('div');
    nodo.id = 'contenido';
    document.body.append(nodo);
    const raiz = createRoot(nodo);
    act(() => {
      raiz.render(
        <main>
          <header>Encabezado</header>
          {Array.from({ length: 11 }, (_, k) => (
            <section key={k}>Bloque {k}</section>
          ))}
          <ul>
            {Array.from({ length: 12 }, (_, k) => (
              <li key={k} className="fz-item" style={indice(k)}>
                Fila {k}
              </li>
            ))}
          </ul>
          <ol>
            {Array.from({ length: 12 }, (_, k) => (
              <li key={k} className="fz-opcion" style={indice(k)}>
                Opción {k}
              </li>
            ))}
          </ol>
        </main>,
      );
    });
    montados.push({ raiz, nodo });
    const main = nodo.querySelector('main') as HTMLElement;
    const encabezado = main.children[0] as HTMLElement;
    expect(estilo(encabezado).animationName).toBe('none');
    // Bloques (hijos 2 en adelante): 0, 60, 120 … 420 ms y el resto con el tope de 8 × 60 = 480 ms.
    const bloques = Array.from(main.children).slice(1, 13);
    expect(
      bloques.slice(0, 9).map((b) => Math.round(segundos(estilo(b).animationDelay) * 1000)),
    ).toEqual([0, 60, 120, 180, 240, 300, 360, 420, 480]);
    expect(
      bloques.slice(9).map((b) => Math.round(segundos(estilo(b).animationDelay) * 1000)),
    ).toEqual([480, 480, 480]);
    expect(estilo(bloques[1] as Element).animationName).toBe('fz-item');
    expect(segundos(estilo(bloques[1] as Element).animationDuration)).toBeCloseTo(0.4, 3);
    const filas = Array.from(main.querySelectorAll('ul > li'));
    expect(filas.map((f) => Math.round(segundos(estilo(f).animationDelay) * 1000))).toEqual([
      0, 60, 120, 180, 240, 300, 360, 420, 480, 480, 480, 480,
    ]);
    const opciones = Array.from(main.querySelectorAll('ol > li'));
    expect(opciones.map((f) => Math.round(segundos(estilo(f).animationDelay) * 1000))).toEqual([
      0, 40, 80, 120, 160, 200, 240, 280, 320, 320, 320, 320,
    ]);
    expect(segundos(estilo(opciones[0] as Element).animationDuration)).toBeCloseTo(0.3, 3);
    // Con «reducir movimiento» la regla anula toda animación y transición.
    const anula = reglas().find(
      (r) => r.condicion.includes('prefers-reduced-motion: reduce') && r.selector.includes('*'),
    );
    expect(anula?.estilo.getPropertyValue('animation-name')).toBe('none');
    expect(anula?.estilo.getPropertyPriority('animation-name')).toBe('important');
    expect(anula?.estilo.getPropertyValue('transition-property')).toBe('none');
  });

  it('PRU-CMP-PWA-311 [] el indicador del segmentado se desplaza a la opción elegida (posición y ancho) y el presionado aplica scale(.97)', async () => {
    const nodo = montar(<Segmentado />);
    const opciones = () => Array.from(nodo.querySelectorAll<HTMLElement>('[role=radio]'));
    const indicador = () => nodo.querySelector<HTMLElement>('[data-segmento-indicador]');
    const alineado = (k: number) => {
      const op = opciones()[k] as HTMLElement;
      const ind = indicador() as HTMLElement;
      expect(ind.style.transform).toBe(
        `translate(${String(op.offsetLeft)}px, ${String(op.offsetTop)}px)`,
      );
      expect(ind.style.width).toBe(`${String(op.offsetWidth)}px`);
      expect(ind.style.height).toBe(`${String(op.offsetHeight)}px`);
    };
    alineado(0);
    expect(nodo.querySelector('[role=radiogroup]')?.hasAttribute('data-indicador')).toBe(true);
    await sinAct(() => userEvent.click(opciones()[1] as HTMLElement));
    alineado(1);
    // Las opciones tienen anchos distintos: el ancho del indicador sigue a la elegida.
    expect(opciones()[1]?.offsetWidth).not.toBe(opciones()[2]?.offsetWidth);
    await sinAct(() => userEvent.click(opciones()[2] as HTMLElement));
    alineado(2);
    // El indicador se desliza con `--duracion-normal` y `--curva-estandar` (220 ms).
    const t = estilo(indicador() as Element);
    expect(t.transitionProperty).toContain('transform');
    expect(t.transitionDuration.split(', ')[0]).toBe('0.22s');
    // Presionado: scale(.97) en botones, pastillas y segmentos; fondo y color con 220 ms y el presionado con 120 ms.
    const presion = reglas().find(
      (r) => r.selector.includes(':active') && r.estilo.transform !== '',
    );
    expect(presion?.estilo.transform).toBe('scale(0.97)');
    expect(presion?.selector).toContain('button');
    expect(presion?.selector).toContain('[role="radio"]');
    const op = estilo(opciones()[0] as Element);
    expect(op.transitionProperty).toContain('background-color');
    expect(op.transitionProperty).toContain('transform');
    expect(op.transitionDuration).toContain('0.22s');
    expect(op.transitionDuration).toContain('0.12s');
  });

  it('PRU-CMP-PWA-312 [] useMovimientoReducido refleja matchMedia y su cambio', () => {
    let reducido = true;
    const oyentes = new Set<() => void>();
    const consultas: string[] = [];
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (consulta: string) =>
        ({
          get matches() {
            return reducido;
          },
          media: consulta,
          addEventListener: (_: string, f: () => void) => {
            consultas.push(consulta);
            oyentes.add(f);
          },
          removeEventListener: (_: string, f: () => void) => {
            oyentes.delete(f);
          },
        }) as unknown as MediaQueryList,
    );
    const nodo = montar(<Lector />);
    expect(nodo.textContent).toBe('reducido');
    expect(consultas).toContain('(prefers-reduced-motion: reduce)');
    reducido = false;
    act(() => {
      oyentes.forEach((f) => {
        f();
      });
    });
    expect(nodo.textContent).toBe('normal');
    reducido = true;
    act(() => {
      oyentes.forEach((f) => {
        f();
      });
    });
    expect(nodo.textContent).toBe('reducido');
    act(() => {
      montados[0]?.raiz.unmount();
    });
    expect(oyentes.size).toBe(0);
    montados.length = 0;
  });

  it('PRU-CMP-PWA-313 [] Vacio entra con el disco (fz-pop-in 400 ms) y el texto (fz-item con 80 ms de retraso); las opciones de Más secciones entran con 40 ms × i', async () => {
    const nodo = montar(<Vacio titulo="Nada por acá" texto="Todavía no hay nada." />);
    const disco = nodo.querySelector('[data-glifo]') as Element;
    expect(estilo(disco).animationName).toBe('fz-pop-in');
    expect(segundos(estilo(disco).animationDuration)).toBeCloseTo(0.4, 3);
    expect(segundos(estilo(disco).animationDelay)).toBe(0);
    for (const texto of [nodo.querySelector('h2'), nodo.querySelector('p')]) {
      expect(estilo(texto as Element).animationName).toBe('fz-item');
      expect(segundos(estilo(texto as Element).animationDelay)).toBeCloseTo(0.08, 3);
    }

    const hoja = montar(
      <MasSecciones
        secciones={SECCIONES}
        seccionActiva={null}
        contadores={{ bandeja: null, notificaciones: null }}
      />,
    );
    await sinAct(async () => {
      await userEvent.click(
        hoja.querySelector(`button[aria-label="${navegacion.secundarias}"]`) as Element,
      );
      await vi.waitFor(() => {
        expect(document.querySelectorAll('li.fz-opcion').length).toBeGreaterThan(2);
      });
    });
    const filas = Array.from(document.querySelectorAll('li.fz-opcion'));
    expect(filas.map((f) => Math.round(segundos(estilo(f).animationDelay) * 1000))).toEqual(
      filas.map((_, k) => Math.min(k, 8) * 40),
    );
    expect(estilo(filas[0] as Element).animationName).toBe('fz-item');
    expect(segundos(estilo(filas[0] as Element).animationDuration)).toBeCloseTo(0.3, 3);
  });
});

// [CH-278] Etiqueta de resultado (C-50; `docs/anexos/finn-aviso-de-resultado/AVISO-DE-RESULTADO.md` §2 a §7), aislada en una
// lista de prueba: la pastilla sobre la fila, el reloj de `--duracion-aviso` con temporizadores simulados (07 §7.1), la pausa,
// Escape, el ↶, la región de estado, el contraste y las posiciones «arriba» y «fila que sale» que van a usar la Bandeja y las
// demás listas (C-50b). Los CA-A-n de PROMPT-AVISO §4 van en el texto del título. El puntero y el foco llegan como eventos.
import axe from 'axe-core';
import { act, useState, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { DeshacerFila, EtiquetaResultado, FilaQueSale, useEtiqueta } from './etiqueta-resultado';

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
  vi.useRealTimers();
  vi.restoreAllMocks();
  delete document.documentElement.dataset['theme'];
  document.documentElement.style.removeProperty('--duracion-aviso');
});

const deshecho = vi.fn<(f: string) => void>();

/** Una lista de prueba: el botón principal de cada fila hace la acción de esa fila. */
function Arnes({
  posicion = 'centro',
  sale = false,
  conAccion = true,
}: {
  readonly posicion?: 'centro' | 'arriba';
  readonly sale?: boolean;
  readonly conAccion?: boolean;
}) {
  const [anuncio, setAnuncio] = useState('');
  const [filas, setFilas] = useState(['Supermercado', 'Farmacia', 'Gasolina']);
  const e = useEtiqueta(setAnuncio);
  return (
    <div style={{ width: 600, paddingTop: 40 }}>
      <p role="status" className="sr-only" data-region>
        {anuncio}
      </p>
      <ul data-tarjeta className="fz-tarjeta-etiqueta rounded-contenedor bg-superficie">
        {filas.map((f) => {
          const contenido = (
            <div
              data-fila={f}
              {...(e.resaltada(f) ? { 'data-resaltada': '' } : {})}
              className="fz-resaltable flex min-h-14 items-center"
            >
              <button
                type="button"
                data-principal={f}
                className="min-h-11 flex-1 text-left"
                onClick={() => {
                  e.mostrar({
                    id: f,
                    palabra: sale ? 'Eliminada' : 'Movida',
                    frase: `Moviste ${f}: ahora es la segunda de Casa.`,
                    ...(conAccion
                      ? {
                          accion: {
                            texto: 'Deshacer',
                            icono: 'undo' as const,
                            alTocar: () => {
                              deshecho(f);
                            },
                          },
                          inverso: `Deshacer: ${f} vuelve a su lugar`,
                        }
                      : {}),
                    ...(sale
                      ? {
                          alIrse: () => {
                            setFilas((xs) => xs.filter((x) => x !== f));
                          },
                        }
                      : {}),
                  });
                }}
              >
                {f}
              </button>
              <DeshacerFila api={e} id={f} />
              <EtiquetaResultado api={e} id={f} posicion={posicion} />
            </div>
          );
          return sale ? (
            <FilaQueSale key={f} api={e} id={f}>
              {contenido}
            </FilaQueSale>
          ) : (
            <li key={f}>{contenido}</li>
          );
        })}
      </ul>
    </div>
  );
}

function montar(ui = <Arnes />): HTMLElement {
  const nodo = document.createElement('main');
  nodo.style.cssText = 'background: var(--fondo); color: var(--texto); padding: 16px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const q = (sel: string): HTMLElement => {
  const e = document.querySelector<HTMLElement>(sel);
  if (e === null) throw new Error(`no hay ${sel}`);
  return e;
};
const etiquetas = (): HTMLElement[] => [
  ...document.querySelectorAll<HTMLElement>('[data-etiqueta]'),
];
const fila = (f: string): HTMLElement => q(`[data-fila="${f}"]`);
const principal = (f: string): HTMLElement => q(`[data-principal="${f}"]`);
const region = (): string => q('[data-region]').textContent;
const accion = (): HTMLElement => q('[data-etiqueta] button, [data-etiqueta] a');
const deshacerFila = (f: string): HTMLElement | null =>
  document.querySelector(`[data-deshacer-fila="${f}"]`);
/** La acción de una fila con el teclado: el puntero no queda sobre la etiqueta. */
function actuar(f: string): void {
  act(() => {
    principal(f).focus();
    principal(f).click();
  });
}
function avanzar(ms: number): void {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
}
function evento(tipo: string, en: Element, extra: Record<string, unknown> = {}): void {
  act(() => {
    en.dispatchEvent(
      tipo.startsWith('pointer')
        ? new PointerEvent(tipo, { bubbles: true, ...extra })
        : new FocusEvent(tipo, { bubbles: true, ...extra }),
    );
  });
}
function contraste(a: string, b: string): number {
  const lum = (c: string) => {
    const [r = 0, g = 0, bl = 0] = (c.match(/[\d.]+/g) ?? []).map(Number).map((v) => {
      const s = v / 255;
      return s <= 0.03928 ? s / 12.92 : ((s + 0.055) / 1.055) ** 2.4;
    });
    return 0.2126 * r + 0.7152 * g + 0.0722 * bl;
  };
  const [x, y] = [lum(a), lum(b)].sort((m, n) => n - m) as [number, number];
  return (x + 0.05) / (y + 0.05);
}
const fakes = (): void => {
  vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
};

describe('PRU-CMP-VAL-880 la etiqueta de resultado sobre la fila', () => {
  it('PRU-CMP-VAL-880 [C-50] CA-A-1 y CA-A-15: la pastilla va dentro de la fila, después de su contenido, centrada contra el borde derecho, con glifo, palabra y «Deshacer» de 44 px; la fila se resalta sin cambiar de alto; la frase va una vez a la región de estado y la etiqueta no es región viva; Tab llega a la acción justo después de la fila', async () => {
    montar();
    const alto = fila('Farmacia').getBoundingClientRect().height;
    actuar('Farmacia');
    for (const a of document.getAnimations()) a.finish();
    expect(etiquetas()).toHaveLength(1);
    const et = q('[data-etiqueta="Farmacia"]');
    expect(fila('Farmacia').lastElementChild).toBe(et);
    expect(et.textContent).toBe('MovidaDeshacer');
    expect(et.querySelector('[data-icono="check"]')).not.toBeNull();
    expect(et.hasAttribute('role')).toBe(false);
    expect(et.closest('[aria-live], [role="status"]')).toBeNull();
    expect(region()).toBe('Moviste Farmacia: ahora es la segunda de Casa.');
    expect(document.querySelectorAll('[role="status"]')).toHaveLength(1);

    const r = fila('Farmacia').getBoundingClientRect();
    const c = et.getBoundingClientRect();
    expect(r.height).toBe(alto);
    expect(Math.abs(c.top + c.height / 2 - (r.top + r.height / 2))).toBeLessThanOrEqual(1);
    expect(r.right - c.right).toBeCloseTo(8, 0);
    expect(c.height).toBeGreaterThanOrEqual(44);
    expect(accion().getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    expect(fila('Farmacia').hasAttribute('data-resaltada')).toBe(true);
    const sonda = document.createElement('div');
    sonda.style.background = 'var(--positivo-fondo)';
    document.body.append(sonda);
    expect(getComputedStyle(fila('Farmacia')).backgroundColor).toBe(
      getComputedStyle(sonda).backgroundColor,
    );
    sonda.remove();

    principal('Farmacia').focus();
    await userEvent.tab();
    expect(document.activeElement).toBe(accion());
  });

  it('PRU-CMP-VAL-880 [C-50] CA-A-2: a los 3000 ms la etiqueta sale con opacidad en --duracion-normal, el resaltado se apaga y queda ↶ de 44 × 44 con su aria-label, que hace el inverso', () => {
    fakes();
    montar();
    actuar('Farmacia');
    avanzar(2999);
    expect(q('[data-etiqueta]').dataset['fase']).toBe('visible');
    expect(deshacerFila('Farmacia')).toBeNull();
    avanzar(1);
    const et = q('[data-etiqueta]');
    expect(et.dataset['fase']).toBe('saliendo');
    expect(getComputedStyle(et).transitionProperty).toContain('opacity');
    expect(getComputedStyle(et).transitionDuration).toBe('0.22s');
    expect(fila('Farmacia').hasAttribute('data-resaltada')).toBe(false);
    expect(deshacerFila('Farmacia')?.getAttribute('aria-label')).toBe(
      'Deshacer: Farmacia vuelve a su lugar',
    );
    avanzar(220);
    expect(etiquetas()).toHaveLength(0);
    const u = deshacerFila('Farmacia');
    expect(u?.getBoundingClientRect().width).toBeGreaterThanOrEqual(44);
    expect(u?.getBoundingClientRect().height).toBeGreaterThanOrEqual(44);
    act(() => {
      u?.click();
    });
    expect(deshecho).toHaveBeenLastCalledWith('Farmacia');
  });

  it('PRU-CMP-VAL-880 [C-50] CA-A-3 y CA-A-4: con el puntero encima o el foco adentro no se va; al salir cuenta 3000 ms desde ese momento; Escape con el foco adentro la quita y el foco vuelve a la fila', () => {
    fakes();
    montar();
    actuar('Farmacia');
    const et = q('[data-etiqueta]');
    evento('pointerover', et);
    avanzar(10_000);
    expect(et.dataset['fase']).toBe('visible');
    evento('pointerout', et, { relatedTarget: document.body });
    avanzar(2999);
    expect(q('[data-etiqueta]').dataset['fase']).toBe('visible');
    avanzar(1);
    expect(q('[data-etiqueta]').dataset['fase']).toBe('saliendo');
    // Si el foco llega mientras se va, vuelve a verse entera y espera.
    act(() => {
      accion().focus();
    });
    expect(q('[data-etiqueta]').dataset['fase']).toBe('visible');
    avanzar(10_000);
    expect(etiquetas()).toHaveLength(1);
    act(() => {
      principal('Farmacia').focus();
    });
    avanzar(2999);
    expect(q('[data-etiqueta]').dataset['fase']).toBe('visible');
    avanzar(1);
    expect(q('[data-etiqueta]').dataset['fase']).toBe('saliendo');

    actuar('Gasolina');
    act(() => {
      accion().focus();
    });
    act(() => {
      accion().dispatchEvent(new KeyboardEvent('keydown', { key: 'Escape', bubbles: true }));
    });
    expect(etiquetas()).toHaveLength(0);
    expect(document.activeElement).toBe(principal('Gasolina'));
  });

  it('PRU-CMP-VAL-880 [C-50] CA-A-5: hay una sola etiqueta a la vez: la acción siguiente la reemplaza y el ↶ anterior se va', () => {
    fakes();
    montar();
    actuar('Farmacia');
    avanzar(3220);
    expect(deshacerFila('Farmacia')).not.toBeNull();
    actuar('Supermercado');
    expect(etiquetas().map((e) => e.dataset['etiqueta'])).toEqual(['Supermercado']);
    expect(deshacerFila('Farmacia')).toBeNull();
    actuar('Gasolina');
    expect(etiquetas().map((e) => e.dataset['etiqueta'])).toEqual(['Gasolina']);
    expect(region()).toBe('Moviste Gasolina: ahora es la segunda de Casa.');
  });

  it.each(['claro', 'oscuro'])(
    'PRU-CMP-VAL-880 [C-50] CA-A-15: en el tema %s la palabra y la acción tienen 4.5:1 sobre --positivo-fondo y axe no reporta violaciones',
    async (tema) => {
      document.documentElement.dataset['theme'] = tema;
      const raiz = montar();
      actuar('Farmacia');
      const et = q('[data-etiqueta]');
      const fondo = getComputedStyle(et).backgroundColor;
      const palabra = q('.fz-etiqueta-palabra');
      expect(contraste(getComputedStyle(palabra).color, fondo)).toBeGreaterThanOrEqual(4.5);
      expect(contraste(getComputedStyle(accion()).color, fondo)).toBeGreaterThanOrEqual(4.5);
      // La animación de entrada termina: axe mide los colores finales.
      for (const a of document.getAnimations()) a.finish();
      const { violations } = await axe.run(raiz, {
        runOnly: ['wcag2a', 'wcag2aa', 'wcag21a', 'wcag21aa', 'wcag22aa'],
      });
      expect(violations.map((v) => v.id)).toEqual([]);
    },
  );

  it('PRU-CMP-VAL-880 [C-50] CA-A-16 y CA-A-17: con --duracion-aviso en 5000ms dura 5000 ms sin tocar el código; con movimiento reducido se quita sin salida, a los mismos ms', () => {
    fakes();
    vi.spyOn(window, 'matchMedia').mockImplementation(
      (m: string) => ({ matches: m.includes('reduce'), media: m }) as MediaQueryList,
    );
    document.documentElement.style.setProperty('--duracion-aviso', '5000ms');
    montar();
    actuar('Farmacia');
    avanzar(4999);
    expect(etiquetas()).toHaveLength(1);
    avanzar(1);
    // La salida es de 0 ms; el reloj simulado corre al ms siguiente lo que se programa durante un avance.
    avanzar(1);
    expect(etiquetas()).toHaveLength(0);
    expect(deshacerFila('Farmacia')).not.toBeNull();
  });
});

describe('PRU-CMP-VAL-881 posiciones para las filas con monto y la fila que sale', () => {
  it('PRU-CMP-VAL-881 [C-50] CA-A-11: «arriba» pega la etiqueta al borde de arriba de la fila, la mitad afuera; en la primera fila se ve entera porque la tarjeta no la recorta', () => {
    montar(<Arnes posicion="arriba" />);
    actuar('Supermercado');
    for (const a of document.getAnimations()) a.finish();
    const et = q('[data-etiqueta]').getBoundingClientRect();
    const r = fila('Supermercado').getBoundingClientRect();
    expect(Math.abs(et.top + et.height / 2 - r.top)).toBeLessThanOrEqual(1);
    const tarjeta = q('[data-tarjeta]');
    expect(getComputedStyle(tarjeta).overflow).toBe('visible');
    expect(et.top).toBeLessThan(tarjeta.getBoundingClientRect().top);
    const radio = getComputedStyle(tarjeta).borderTopLeftRadius;
    expect(radio).not.toBe('0px');
    expect(getComputedStyle(q('[data-fila-sale], [data-tarjeta] > li')).borderTopLeftRadius).toBe(
      radio,
    );
  });

  it('PRU-CMP-VAL-881 [C-50] CA-A-10: la fila que sale se queda 3000 ms con la etiqueta, se recoge y se quita; si tenía el foco, pasa a la fila siguiente, o a la anterior si era la última', () => {
    fakes();
    montar(<Arnes sale conAccion={false} />);
    actuar('Farmacia');
    expect(q('[data-etiqueta]').classList.contains('fz-etiqueta-sola')).toBe(true);
    avanzar(2999);
    expect(q('[data-fila-sale="Farmacia"]').hasAttribute('data-recogiendo')).toBe(false);
    avanzar(1);
    const sale = q('[data-fila-sale="Farmacia"]');
    expect(sale.hasAttribute('data-recogiendo')).toBe(true);
    expect(getComputedStyle(sale).transitionProperty).toContain('grid-template-rows');
    avanzar(220);
    expect(document.querySelector('[data-fila-sale="Farmacia"]')).toBeNull();
    expect(document.activeElement).toBe(principal('Gasolina'));
    expect(deshacerFila('Farmacia')).toBeNull();

    actuar('Gasolina');
    avanzar(3220);
    expect(document.querySelector('[data-fila-sale="Gasolina"]')).toBeNull();
    expect(document.activeElement).toBe(principal('Supermercado'));
  });
});

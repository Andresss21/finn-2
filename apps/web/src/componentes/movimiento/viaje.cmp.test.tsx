// [CH-295] C-52 §8 (docs/anexos/finn-detalle-de-categoria/): el nombre y el Disponible viajan de la fila de Presupuesto al
// encabezado del detalle y de vuelta. Entre documentos lo hace el navegador (View Transitions, con los nombres de cada caja); dentro
// del documento, FLIP con `element.animate`. Con movimiento reducido, nada.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { FilaCategoria } from '../dominio/fila-categoria';
import { PermitirViaje, ViajeDelDetalle, ViajesDePresupuesto, anotarViaje, viajar } from './viaje';
import { nombreDeViaje, viaje } from './viaje-nombres';

vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const ID = '11111111-1111-4111-8111-111111111111';
const montados: { raiz: Root; nodo: HTMLElement }[] = [];
const sueltas: HTMLElement[] = [];
afterEach(() => {
  vi.restoreAllMocks();
  for (const nodo of sueltas.splice(0)) nodo.remove();
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
});
const montar = (contenido: ReactNode): { nodo: HTMLElement; raiz: Root } => {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(contenido);
  });
  montados.push({ raiz, nodo });
  return { nodo, raiz };
};
/** Una caja que viaja, puesta a mano en la página. */
const cajas = (arriba: number, alto: number): HTMLElement => {
  const nodo = document.createElement('div');
  const estilo = (izquierda: number, ancho: number) =>
    `position:absolute;left:${String(izquierda)}px;top:${String(arriba)}px;height:${String(alto)}px;width:${String(ancho)}px`;
  nodo.innerHTML = `<span style="${estilo(20, 80)}" data-viaje="nombre-${ID}"></span><span style="${estilo(200, 60)}" data-viaje="disp-${ID}"></span>`;
  document.body.append(nodo);
  sueltas.push(nodo);
  return nodo;
};
const cuadro = () =>
  new Promise<void>((listo) => {
    requestAnimationFrame(() => {
      listo();
    });
  });
const sinMovimiento = (reducido: boolean) => {
  vi.spyOn(window, 'matchMedia').mockImplementation(
    (consulta: string) =>
      ({
        matches: consulta.includes('reduce') ? reducido : false,
        media: consulta,
        addEventListener: () => undefined,
        removeEventListener: () => undefined,
      }) as unknown as MediaQueryList,
  );
};
const reglas = (): CSSStyleRule[] =>
  [...document.styleSheets].flatMap((h) => {
    try {
      return [...h.cssRules].filter((r): r is CSSStyleRule => r instanceof CSSStyleRule);
    } catch {
      return [];
    }
  });

const fila = {
  categoria: { id: ID, nombre: 'Salidas' },
  grupo: { id: 'g', nombre: 'Diversión' },
  asignado: 45000,
  gastado: 43160,
  disponible: 3080,
  sobregiro: null,
  barra: { cubiertoBp: 9500, excedenteBp: 0, tipoExcedente: null },
  meta: null,
} as unknown as Parameters<typeof FilaCategoria>[0]['fila'];

describe('PRU-CMP-PRES viaje de Presupuesto al detalle (C-52)', () => {
  it('PRU-CMP-PRES-827 [FT-14] CA-D-12: la fila lleva `cat-nombre-{id}` y `cat-disp-{id}` en cajas a la medida, el viaje entre documentos se declara solo sin movimiento reducido y dura `--duracion-transicion` con `--curva-entrada`', () => {
    const { nodo } = montar(
      <>
        <FilaCategoria fila={fila} hrefDetalle={`/presupuesto/categorias/${ID}`} />
        <PermitirViaje />
      </>,
    );
    const nombre = nodo.querySelector(`[data-viaje="nombre-${ID}"]`) as HTMLElement;
    const disponible = nodo.querySelector(`[data-viaje="disp-${ID}"]`) as HTMLElement;
    expect(nombre.textContent).toBe('Salidas');
    expect(nombre.style.viewTransitionName).toBe(`cat-nombre-${ID}`);
    expect(disponible.style.viewTransitionName).toBe(nombreDeViaje(ID, 'disp'));
    expect(disponible.querySelector('[data-centavos="3080"]')).not.toBeNull();
    expect(getComputedStyle(nombre).display).toBe('inline-block');
    expect(nodo.querySelector('a[data-viaje-desde]')?.getAttribute('href')).toBe(
      `/presupuesto/categorias/${ID}`,
    );
    expect(viaje(ID, 'nombre')['data-viaje']).toBe(`nombre-${ID}`);
    expect(nodo.querySelector('style[data-permitir-viaje]')?.textContent).toBe(
      '@media (prefers-reduced-motion: no-preference) { @view-transition { navigation: auto; } }',
    );
    const grupo = reglas().find((r) => r.selectorText.includes('::view-transition-group'));
    expect(grupo?.style.getPropertyValue('animation-duration')).toBe('var(--duracion-transicion)');
    expect(grupo?.style.getPropertyValue('animation-timing-function')).toBe('var(--curva-entrada)');
  });

  it('PRU-CMP-PRES-828 [FT-14] CA-D-12: dentro del documento, FLIP anima cada caja desde donde estaba (translate y scale por el alto) en 340 ms con `--curva-entrada`, una sola vez y solo hacia el otro lado', () => {
    sinMovimiento(false);
    const antes = cajas(400, 16);
    anotarViaje(ID, 'presupuesto', antes);
    antes.remove();
    const despues = cajas(100, 32);
    expect(viajar(ID, 'presupuesto', despues)).toEqual([]);
    const animaciones = viajar(ID, 'detalle', despues);
    expect(animaciones).toHaveLength(2);
    const efecto = animaciones[0]?.effect as KeyframeEffect;
    expect(efecto.getKeyframes()[0]?.transform).toBe('translate(0px, 300px) scale(0.5)');
    expect(efecto.getKeyframes()[1]?.transform).toBe('none');
    expect(efecto.getTiming().duration).toBe(340);
    // `--curva-entrada` es cubic-bezier(.2, .9, .25, 1); el navegador la devuelve normalizada.
    expect(efecto.getTiming().easing).toBe('cubic-bezier(0.2, 0.9, 0.25, 1)');
    // Ya se usó: otra llegada no vuelve a viajar.
    expect(viajar(ID, 'detalle', despues)).toEqual([]);
  });

  it('PRU-CMP-PRES-829 [FT-14] CA-D-12: tocar «Volver» en el detalle mide el encabezado y Presupuesto, al llegar dentro del documento, hace el camino inverso', async () => {
    sinMovimiento(false);
    const detalle = cajas(100, 32);
    const { raiz } = montar(
      <>
        <a href="/presupuesto?periodo=2027-01-21" aria-label="Volver a Presupuesto">
          ←
        </a>
        <ViajeDelDetalle id={ID} />
      </>,
    );
    const volver = document.querySelector<HTMLAnchorElement>(
      'a[aria-label="Volver a Presupuesto"]',
    );
    volver?.addEventListener('click', (e) => {
      e.preventDefault();
    });
    act(() => {
      volver?.click();
    });
    act(() => {
      raiz.unmount();
    });
    detalle.remove();
    const presupuesto = cajas(500, 16);
    montar(<ViajesDePresupuesto />);
    await cuadro();
    const nombre = presupuesto.querySelector(`[data-viaje="nombre-${ID}"]`) as HTMLElement;
    const animacion = nombre.getAnimations()[0];
    expect((animacion?.effect as KeyframeEffect).getKeyframes()[0]?.transform).toBe(
      'translate(0px, -400px) scale(2)',
    );
  });

  it('PRU-CMP-PRES-830 [FT-14] CA-D-14: con movimiento reducido no hay viaje FLIP', () => {
    sinMovimiento(true);
    anotarViaje(ID, 'presupuesto', cajas(400, 16));
    expect(viajar(ID, 'detalle', cajas(100, 32))).toEqual([]);
  });
});

// [CH-281] C-50b (`docs/anexos/finn-aviso-de-resultado/AVISO-DE-RESULTADO.md` §3, §7 y §8): la etiqueta de resultado en las
// listas que dibuja el servidor, cuando el resultado llega en la URL al volver de un flujo. La fila que se queda (Programadas,
// Metas) y la que ya no está (Programadas, Metas, Reglas, Seguridad), con el reloj de `--duracion-aviso` simulado (07 §7.1).
// Los CA-A-n de PROMPT-AVISO §4 van en el texto del título.
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { seguridad } from '../../textos/seguridad';
import { FilaConEtiqueta, FilaQueSeFue } from './etiqueta-al-llegar';

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
});

function montar(ui: ReactNode): HTMLElement {
  const nodo = document.createElement('div');
  nodo.style.cssText = 'width: 600px; padding-top: 40px';
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}
const avanzar = (ms: number) => {
  act(() => {
    vi.advanceTimersByTime(ms);
  });
};
const q = (nodo: ParentNode, s: string) => nodo.querySelector(s) as HTMLElement;

const DESACTIVADA = {
  palabra: 'Desactivada',
  frase: 'Desactivaste Gimnasio: ya no se esperan sus pagos.',
};

function Lista({ conLlegada = true }: { readonly conLlegada?: boolean }) {
  return (
    <ul data-tarjeta className="fz-tarjeta-etiqueta rounded-contenedor bg-superficie">
      {['Gimnasio', 'Netflix'].map((n) => (
        <FilaConEtiqueta
          key={n}
          id={n}
          data-fila={n}
          className="flex min-h-17 items-center justify-between px-4"
          llegada={conLlegada && n === 'Gimnasio' ? DESACTIVADA : undefined}
        >
          <span>{n}</span>
          <span data-monto>−$25.00</span>
        </FilaConEtiqueta>
      ))}
    </ul>
  );
}

describe('PRU-CMP-VAL-891 la etiqueta de resultado que llega con la URL', () => {
  it('PRU-CMP-VAL-891 [C-50] CA-A-13 y CA-A-11: la fila que se queda se resalta con la palabra sin acción, pegada al borde de arriba y la mitad afuera, sin tapar el monto; la tarjeta no la recorta; la frase va a la única región de estado de la pantalla', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const nodo = montar(<Lista />);
    const fila = q(nodo, '[data-fila="Gimnasio"]');
    expect(fila.hasAttribute('data-resaltada')).toBe(true);
    const et = q(fila, '[data-etiqueta="Gimnasio"]');
    expect(et.dataset['posicion']).toBe('arriba');
    expect(et.textContent).toBe('Desactivada');
    expect(et.classList.contains('fz-etiqueta-sola')).toBe(true);
    expect(et.querySelector('button, a')).toBeNull();
    const r = et.getBoundingClientRect();
    const f = fila.getBoundingClientRect();
    expect(r.top).toBeLessThan(f.top);
    expect(r.bottom).toBeGreaterThan(f.top);
    const monto = q(fila, '[data-monto]').getBoundingClientRect();
    expect(r.bottom <= monto.top || r.right <= monto.left || r.left >= monto.right).toBe(true);
    const tarjeta = q(nodo, '[data-tarjeta]');
    expect(getComputedStyle(tarjeta).overflow).toBe('visible');
    expect(getComputedStyle(fila).borderTopLeftRadius).toBe(
      getComputedStyle(tarjeta).borderTopLeftRadius,
    );
    const regiones = nodo.querySelectorAll('[role="status"]');
    expect(regiones).toHaveLength(1);
    expect(regiones[0]?.textContent).toBe(DESACTIVADA.frase);
    expect(et.closest('[role="status"], [aria-live]')).toBeNull();
    expect(q(nodo, '[data-fila="Netflix"]').hasAttribute('data-resaltada')).toBe(false);

    avanzar(2999);
    expect(et.dataset['fase']).toBe('visible');
    avanzar(1);
    expect(q(nodo, '[data-etiqueta]').dataset['fase']).toBe('saliendo');
    expect(fila.hasAttribute('data-resaltada')).toBe(false);
    avanzar(400);
    expect(nodo.querySelector('[data-etiqueta]')).toBeNull();
    expect(nodo.querySelector('[data-fila="Gimnasio"]')).not.toBeNull();
  });

  it('PRU-CMP-VAL-891 [C-50] sin resultado, las filas son las de siempre: sin resaltado, sin etiqueta y sin región de estado', () => {
    const nodo = montar(<Lista conLlegada={false} />);
    expect(nodo.querySelectorAll('li')).toHaveLength(2);
    expect(nodo.querySelector('[data-resaltada], [data-etiqueta], [role="status"]')).toBeNull();
  });

  it('PRU-CMP-VAL-891 [C-50] CA-A-13: quitar un factor deja su fila con «Quitado» 3000 ms, se recoge en --duracion-normal y no queda nada; la fila no hereda la salida de C2 (se ve y se puede tocar)', () => {
    vi.useFakeTimers({ toFake: ['setTimeout', 'clearTimeout'] });
    const nodo = montar(
      <FilaQueSeFue
        id="factor-quitado"
        llegada={{ palabra: seguridad.quitado, frase: seguridad.quitaste('Respaldo') }}
      >
        Respaldo
      </FilaQueSeFue>,
    );
    const sale = q(nodo, '[data-fila-sale="factor-quitado"]');
    expect(sale.textContent).toBe('RespaldoQuitado');
    const estilo = getComputedStyle(sale);
    expect(estilo.animationName).toBe('none');
    expect(estilo.pointerEvents).toBe('auto');
    expect(estilo.opacity).toBe('1');
    expect(q(nodo, '[data-resaltada]')).not.toBeNull();
    expect(q(nodo, '[role="status"]').textContent).toBe('Quitaste Respaldo.');
    const tarjeta = q(nodo, '[data-fila-que-se-fue]');
    expect(q(nodo, '[data-etiqueta]').getBoundingClientRect().top).toBeLessThan(
      tarjeta.getBoundingClientRect().top,
    );

    avanzar(3000);
    expect(sale.hasAttribute('data-recogiendo')).toBe(true);
    expect(getComputedStyle(sale).transitionProperty).toContain('grid-template-rows');
    avanzar(400);
    expect(nodo.querySelector('[data-fila-que-se-fue], [role="status"]')).toBeNull();
  });
});

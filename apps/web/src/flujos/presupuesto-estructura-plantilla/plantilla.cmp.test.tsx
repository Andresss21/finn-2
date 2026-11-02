import axe from 'axe-core';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import '../../app/globals.css';
import { plantilla as t } from '../../textos/plantilla';
import { PanelPlantilla } from './plantilla';

// `next/link` necesita `process` y el enrutador de Next, que el navegador de prueba no tiene: se simula `next/link`, nunca
// `enlace-finn`, que otras suites importan de verdad (`vitest list` no limpia los mocks de cada sesión del navegador).
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  // `next/link` es CommonJS: el módulo es la propia función, con `useLinkStatus` como propiedad.
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});

// `next/navigation` también necesita `process`: el enrutador se simula para ver adónde manda el marco del flujo.
const { replace } = vi.hoisted(() => ({ replace: vi.fn() }));
vi.mock('next/navigation', () => ({ usePathname: () => '/', useRouter: () => ({ replace }) }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  window.sessionStorage.clear();
  replace.mockClear();
});

function montar(ui: ReactNode): HTMLElement {
  document.body.style.cssText = 'background: var(--fondo); color: var(--texto)';
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  act(() => {
    raiz.render(ui);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const boton = (nodo: HTMLElement, nombre: string): HTMLButtonElement => {
  const b = [...nodo.querySelectorAll('button')].find(
    (x) => (x.getAttribute('aria-label') ?? x.textContent) === nombre,
  );
  if (b === undefined) throw new Error(`no hay un botón «${nombre}»`);
  return b;
};

describe('PRU-CMP-INICIO', () => {
  it('PRU-CMP-INICIO-101 con todo quitado, "Crear" queda deshabilitado con el motivo a la vista y sin llamar a la acción', async () => {
    const crearLote = vi.fn();
    const nodo = montar(<PanelPlantilla hayNormales={false} crearLote={crearLote} />);
    expect(boton(nodo, t.crear(36)).disabled).toBe(false);
    for (const g of t.grupos) {
      await act(() => {
        boton(nodo, t.quitarGrupo(g.nombre)).click();
        return Promise.resolve();
      });
    }
    const crear = boton(nodo, t.crear(0));
    expect(crear.disabled).toBe(true);
    expect(nodo.textContent).toContain(t.elegirUna);
    expect(crearLote).not.toHaveBeenCalled();
  });

  it('PRU-CMP-INICIO-104 la lista editable de la plantilla no tiene violaciones de axe', async () => {
    const nodo = montar(<PanelPlantilla hayNormales={false} crearLote={vi.fn()} />);
    const r = await axe.run(nodo);
    expect(r.violations.map((v) => `${v.id}: ${v.nodes.length}`)).toEqual([]);
  });

  it('PRU-CMP-INICIO-102 con categorías normales y sin una aplicación a medias, la plantilla manda a la estructura; con una a medias, ofrece seguir', () => {
    montar(<PanelPlantilla hayNormales crearLote={vi.fn()} />);
    expect(replace).toHaveBeenCalledWith('/presupuesto/estructura');

    const aMedias = {
      elementos: [
        { id: 'a', tipo: 'grupo', nombre: 'Casa' },
        { id: 'b', tipo: 'categoria', nombre: 'Luz', grupoId: 'a' },
      ],
      resultados: { a: null },
    };
    window.sessionStorage.setItem(
      'finn:borrador:v1:/presupuesto/estructura/plantilla:',
      JSON.stringify({ version: 1, campos: aMedias }),
    );
    replace.mockClear();
    const nodo = montar(<PanelPlantilla hayNormales crearLote={vi.fn()} />);
    expect(replace).not.toHaveBeenCalled();
    expect(boton(nodo, t.seguir(1, 2))).toBeTruthy();
  });
});

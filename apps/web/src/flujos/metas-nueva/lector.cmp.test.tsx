// FT-17 `/metas/nueva` (05 §2.3): sin `?categoria=` (el «Nueva meta» de `/metas`) la pantalla pide elegir la categoría entre las
// que no tienen meta, con el título genérico y sin preelegir ninguna; con `?categoria=` (el detalle de una categoría) viene fija y
// el título la nombra. La consulta `formulario` se simula: la pantalla solo dibuja lo que trae (PF-3).
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { formulario } from '@finn/aplicacion/consultas/formulario/index';
import { gestionarMeta } from '../../servidor/acciones/presupuesto';
import { base } from '../../textos/base';
import { metas as tm } from '../../textos/metas';
import { LectorMetasNueva } from './lector';

// El enrutador de Next, las acciones y la consulta son del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/metas/nueva',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
  redirect: vi.fn(),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/presupuesto', () => ({ gestionarMeta: vi.fn() }));
vi.mock('../../servidor/consultar', () => ({
  consultar: (f: () => Promise<unknown>) => f(),
}));
vi.mock('../../servidor/consultas', () => ({ depsDeConsulta: () => Promise.resolve({}) }));
vi.mock('@finn/aplicacion/consultas/formulario/index', () => ({ formulario: vi.fn() }));

(globalThis as { IS_REACT_ACT_ENVIRONMENT?: boolean }).IS_REACT_ACT_ENVIRONMENT = true;

const montados: { raiz: Root; nodo: HTMLElement }[] = [];
afterEach(() => {
  for (const { raiz, nodo } of montados.splice(0)) {
    act(() => {
      raiz.unmount();
    });
    nodo.remove();
  }
  sessionStorage.clear();
  vi.mocked(formulario).mockReset();
  vi.mocked(gestionarMeta).mockClear();
});

const GAS = { id: '0b6f2c1e-1a2b-4c3d-8e4f-000000000001', nombre: 'Gas' };
const PRESTAMO = { id: '0b6f2c1e-1a2b-4c3d-8e4f-000000000002', nombre: 'Pago de préstamo' };
const ROPA = { id: '0b6f2c1e-1a2b-4c3d-8e4f-000000000003', nombre: 'Ropa' };
const VIAJE = { id: '0b6f2c1e-1a2b-4c3d-8e4f-000000000004', nombre: 'Viaje' };

/** Dibuja `/metas/nueva` con lo que devolvería `formulario({ operacion: 'meta' })`. */
async function abrir(
  sinMeta: readonly { id: string; nombre: string }[],
  busqueda: Record<string, string> = {},
): Promise<HTMLElement> {
  vi.mocked(formulario).mockResolvedValue({
    contexto: { categoriasSinMeta: sinMeta },
  } as unknown as Awaited<ReturnType<typeof formulario>>);
  const arbol = await LectorMetasNueva({ busqueda });
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(arbol);
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const titulo = (nodo: HTMLElement) => nodo.querySelector('h1')?.textContent;
/** El disparador de la «Categoría» (lista propia) o `undefined` si la pantalla no la pide. */
const categoria = (nodo: HTMLElement): HTMLElement | undefined =>
  [...nodo.querySelectorAll('label')]
    .filter((l) => l.textContent.trim().startsWith(tm.categoria))
    .map((l) => l.control)
    .find((c): c is HTMLElement => c instanceof HTMLElement) ??
  nodo.querySelector<HTMLElement>(`[role=radiogroup][aria-label="${tm.categoria}"]`) ??
  undefined;
const crear = (nodo: HTMLElement): HTMLButtonElement =>
  [...nodo.querySelectorAll('button')].find((b) =>
    b.textContent.trim().startsWith(tm.crear),
  ) as HTMLButtonElement;
const descrito = (el: Element): string =>
  (el.getAttribute('aria-describedby') ?? '')
    .split(' ')
    .map((id) => document.getElementById(id)?.textContent ?? '')
    .join(' ');

describe('PRU-CMP-META-784 Nueva meta elige la categoría', () => {
  it('PRU-CMP-META-784 [FT-17, C-45] sin ?categoria= y con varias categorías sin meta, el título es «Nueva meta» y la «Categoría» es la lista propia, sin ninguna elegida; elegida, el título no cambia', async () => {
    const nodo = await abrir([GAS, PRESTAMO, ROPA, VIAJE]);
    expect(vi.mocked(formulario).mock.calls[0]?.[1]).toEqual({ operacion: 'meta' });
    expect(titulo(nodo)).toBe(tm.tituloNueva);
    const disparador = categoria(nodo);
    expect(disparador?.getAttribute('aria-haspopup')).toBe('listbox');
    expect(disparador?.textContent).toContain(tm.elegirCategoria);
    expect(disparador?.textContent).not.toContain(GAS.nombre);
    expect(descrito(crear(nodo))).toBe(base.corregirCampos(2));
    await userEvent.click(disparador as HTMLElement);
    const opciones = [...document.querySelectorAll<HTMLElement>('[role=option]')];
    expect(opciones.map((o) => o.textContent)).toEqual([
      GAS.nombre,
      PRESTAMO.nombre,
      ROPA.nombre,
      VIAJE.nombre,
    ]);
    await userEvent.click(opciones[2] as HTMLElement);
    await expect.poll(() => categoria(nodo)?.textContent).toContain(ROPA.nombre);
    expect(titulo(nodo)).toBe(tm.tituloNueva);
  });

  it('PRU-CMP-META-785 [FT-17, C-45] sin ?categoria= y con una sola categoría sin meta, la «Categoría» sigue a la vista como lista propia y no viene elegida; al tocar «Crear meta» la marca y lleva el foco a ella', async () => {
    const nodo = await abrir([PRESTAMO]);
    expect(titulo(nodo)).toBe(tm.tituloNueva);
    const disparador = categoria(nodo) as HTMLElement;
    expect(disparador.getAttribute('aria-haspopup')).toBe('listbox');
    expect(disparador.textContent).not.toContain(PRESTAMO.nombre);
    crear(nodo).focus();
    await userEvent.keyboard('{Enter}');
    await expect
      .poll(() => disparador.closest<HTMLElement>('.campo-fila')?.textContent)
      .toContain(tm.categoriaObligatoria);
    await expect.poll(() => document.activeElement).toBe(disparador);
    expect(gestionarMeta).not.toHaveBeenCalled();
  });

  it('PRU-CMP-META-786 [FT-17] con ?categoria= de una categoría sin meta, viene fija: el título es «Meta para {categoría}» y no hay fila «Categoría»', async () => {
    const nodo = await abrir([GAS, PRESTAMO, ROPA], { categoria: ROPA.id });
    expect(vi.mocked(formulario).mock.calls[0]?.[1]).toEqual({
      operacion: 'meta',
      categoriaId: ROPA.id,
    });
    expect(titulo(nodo)).toBe(tm.tituloPara(ROPA.nombre));
    expect(categoria(nodo)).toBeUndefined();
  });

  it('PRU-CMP-META-787 [FT-17] sin categorías sin meta, dice «Todas tus categorías ya tienen meta.» con el enlace para volver y no muestra el formulario', async () => {
    const nodo = await abrir([]);
    expect(titulo(nodo)).toBe(tm.tituloNueva);
    expect(nodo.textContent).toContain(tm.sinCategorias);
    expect(nodo.querySelector('a')?.getAttribute('href')).toBe('/metas');
    expect(nodo.querySelector('form')).toBeNull();
  });
});

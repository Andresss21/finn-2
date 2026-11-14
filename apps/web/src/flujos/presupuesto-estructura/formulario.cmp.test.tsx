// FT-18 Nueva categoría (07 §17: un texto, un estado o el foco de un componente es una CMP; 05 §2.3): desde el botón de un grupo
// (`?grupo=` válido) la categoría es de ese grupo, sin volver a preguntarlo; sin `?grupo=`, o con uno que no se puede elegir, el
// selector de grupo se muestra como siempre. Quién acepta el grupo lo decide el servidor (OP-07), que prueban la integración y la E2E.
// La lista de la estructura: el nombre accesible de cada enlace y botón contiene su texto visible (WCAG 2.5.3).
import type { GrupoDeEstructura } from '@finn/dominio/selectores';
import { act, type ReactNode } from 'react';
import { createRoot, type Root } from 'react-dom/client';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { userEvent } from 'vitest/browser';
import '../../app/globals.css';
import { crearEnEstructura } from '../../servidor/acciones/categorias';
import { estructura as t } from '../../textos/estructura';
import { FormularioEstructura } from './formulario';
import { ListaEstructura } from './lista';

// `next/link` y `next/navigation` necesitan el enrutador de Next, y las acciones son del servidor: se simulan.
vi.mock('next/navigation', () => ({
  usePathname: () => '/presupuesto/estructura/categorias/nueva',
  useRouter: () => ({ replace: vi.fn(), back: vi.fn(), push: vi.fn(), refresh: vi.fn() }),
}));
vi.mock('next/link', async () => {
  const { createElement } = await import('react');
  const Enlace = ({ href, children, ...resto }: { href: string; children?: ReactNode }) =>
    createElement('a', { href, ...resto }, children);
  return Object.assign(Enlace, { default: Enlace, useLinkStatus: () => ({ pending: false }) });
});
vi.mock('../../servidor/acciones/categorias', () => ({
  crearEnEstructura: vi.fn(() =>
    Promise.resolve({ ok: true, valor: {}, yaAplicada: false, avisos: [] }),
  ),
  editarEnEstructura: vi.fn(),
  eliminarEnEstructura: vi.fn(),
  desarchivarCategoria: vi.fn(),
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
  vi.mocked(crearEnEstructura).mockClear();
  sessionStorage.clear();
});

async function montar(ui: ReactNode): Promise<HTMLElement> {
  const nodo = document.createElement('div');
  document.body.append(nodo);
  const raiz = createRoot(nodo);
  await act(() => {
    raiz.render(ui);
    return Promise.resolve();
  });
  montados.push({ raiz, nodo });
  return nodo;
}

const GASTOS = '11111111-1111-4111-8111-111111111111';
const HOGAR = '22222222-2222-4222-8222-222222222222';
const VIEJO = '33333333-3333-4333-8333-333333333333';
const PAGOS = '44444444-4444-4444-8444-444444444444';
const grupo = (
  id: string,
  nombre: string,
  extra: { archivado?: boolean; sistema?: boolean } = {},
): GrupoDeEstructura => ({
  grupo: {
    id: id as GrupoDeEstructura['grupo']['id'],
    nombre,
    archivado: extra.archivado ?? false,
    sistema: extra.sistema ?? false,
  },
  categorias: [],
});
const GRUPOS: readonly GrupoDeEstructura[] = [
  grupo(GASTOS, 'Gastos'),
  grupo(HOGAR, 'Hogar'),
  grupo(VIEJO, 'Viejo', { archivado: true }),
  grupo(PAGOS, 'Pagos de tarjeta', { sistema: true }),
];

/** Las opciones del selector de grupo (hasta 7, como radios; 05 §10.7). */
const radios = (): HTMLElement[] => [...document.querySelectorAll<HTMLElement>('[role="radio"]')];
/** El rótulo «Grupo» del selector. */
const rotuloGrupo = (): boolean =>
  [...document.querySelectorAll('label, legend, span, p')].some(
    (e) => e.children.length === 0 && e.textContent.trim() === t.grupo,
  );
const nombreDe = (): HTMLInputElement => {
  const etiqueta = [...document.querySelectorAll('label')].find((l) =>
    l.textContent.trim().startsWith(t.nombre),
  );
  const control = etiqueta?.control;
  if (!(control instanceof HTMLInputElement)) throw new Error('no hay campo «Nombre»');
  return control;
};
const boton = (texto: string): HTMLButtonElement => {
  const b = [...document.querySelectorAll('button')].find((x) => x.textContent === texto);
  if (b === undefined) throw new Error(`no hay un botón «${texto}»`);
  return b;
};

describe('PRU-CMP-CATEG-125 nueva categoría desde el botón de un grupo', () => {
  it('PRU-CMP-CATEG-125 [FT-18] con `?grupo=` de un grupo elegible no muestra el selector de grupo, dice «En Hogar» y «Crear» envía OP-07 con ese grupo', async () => {
    await montar(
      <FormularioEstructura
        modo="categoria-nueva"
        superpuesto={false}
        grupos={GRUPOS}
        grupoInicial={HOGAR}
      />,
    );
    expect(radios()).toHaveLength(0);
    expect(rotuloGrupo()).toBe(false);
    expect(document.body.textContent).toContain(t.enGrupo('Hogar'));

    await userEvent.fill(nombreDe(), 'Veterinario');
    await userEvent.click(boton(t.crear));
    await vi.waitFor(() => {
      expect(crearEnEstructura).toHaveBeenCalledTimes(1);
    });
    expect(vi.mocked(crearEnEstructura).mock.calls[0]?.[0]).toMatchObject({
      tipo: 'categoria',
      nombre: 'Veterinario',
      grupoId: HOGAR,
    });
  });
});

describe('PRU-CMP-CATEG-126 nueva categoría sin un grupo válido en la dirección', () => {
  it('PRU-CMP-CATEG-126 [FT-18, CA-18.4] sin `?grupo=`, o con uno archivado, del sistema o que no existe, muestra el selector con los grupos elegibles y el primero marcado, sin «En …»', async () => {
    for (const grupoInicial of [undefined, VIEJO, PAGOS, '55555555-5555-4555-8555-555555555555']) {
      await montar(
        <FormularioEstructura
          modo="categoria-nueva"
          superpuesto={false}
          grupos={GRUPOS}
          {...(grupoInicial === undefined ? {} : { grupoInicial })}
        />,
      );
      const opciones = radios();
      expect(opciones).toHaveLength(2);
      expect(rotuloGrupo()).toBe(true);
      expect(document.body.textContent).toContain('Gastos');
      expect(document.body.textContent).toContain('Hogar');
      expect(document.body.textContent).not.toContain('Pagos de tarjeta');
      expect(document.body.textContent).not.toContain(t.enGrupo('Gastos'));
      expect(opciones.map((r) => r.getAttribute('aria-checked'))).toEqual(['true', 'false']);
      for (const { raiz, nodo } of montados.splice(0)) {
        act(() => {
          raiz.unmount();
        });
        nodo.remove();
      }
    }
  });
});

describe('PRU-CMP-CATEG-127 nombres accesibles de la lista de la estructura', () => {
  it('PRU-CMP-CATEG-127 [FT-18] «Editar grupo», «Nueva categoría», las categorías y Subir/Bajar tienen un nombre accesible que contiene su texto visible, y el de «Editar grupo» nombra el grupo', async () => {
    const conCategorias: readonly GrupoDeEstructura[] = GRUPOS.map((g, i) =>
      i > 1
        ? g
        : {
            ...g,
            categorias: ['Super', 'Luz'].map((nombre, k) => ({
              categoria: {
                id: `${String(i)}${String(k)}000000-0000-4000-8000-000000000000` as GrupoDeEstructura['grupo']['id'],
                nombre,
              },
              clase: 'normal' as const,
              archivada: false,
              tieneMeta: false,
              puedeEliminar: true,
              puedeArchivar: true,
            })),
          },
    );
    const raiz = await montar(<ListaEstructura grupos={conCategorias} />);
    const visible = (e: Element): string => {
      const copia = e.cloneNode(true) as Element;
      for (const x of copia.querySelectorAll('.sr-only')) x.remove();
      return copia.textContent.replace(/\s+/g, ' ').trim();
    };
    const controles = [...raiz.querySelectorAll('a, button')];
    expect(controles.length).toBeGreaterThan(4);
    for (const c of controles) {
      const nombre = c.getAttribute('aria-label') ?? c.textContent;
      expect(nombre.replace(/\s+/g, ' ').trim(), c.outerHTML).toContain(visible(c));
    }
    const editarGrupo = controles.filter((c) => visible(c) === t.editarGrupo);
    expect(editarGrupo.map((c) => c.getAttribute('aria-label'))).toEqual([
      t.editarGrupoDe('Gastos'),
      t.editarGrupoDe('Hogar'),
    ]);
  });
});
